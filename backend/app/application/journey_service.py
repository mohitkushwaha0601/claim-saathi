"""Application orchestration for journey creation, evaluation, and reads."""

from collections.abc import Callable, Iterator, Mapping
from contextlib import contextmanager
from dataclasses import dataclass
from datetime import UTC, datetime
from uuid import uuid4

from app.domain import (
    CapabilityValue,
    CitizenIntent,
    CitizenState,
    DecisionRecord,
    EvaluationContext,
    IntentGoal,
    JourneyDefinition,
    JourneyEvaluationResult,
    JourneyInstance,
    PrerequisiteNodeResult,
)
from app.infrastructure import (
    DemoAuthoritativeCapabilityProvider,
    DemoCitizenStateProvider,
    DemoPersonaId,
    InMemoryJourneyStore,
    StoredJourneySession,
)
from app.infrastructure.memory_store import StoredJourneyNotFoundError
from app.journeys import JourneyCatalog, JourneyOrchestrator, JourneyPlanner

from .exceptions import (
    DecisionNotFoundError,
    DemoPersonaGoalMismatchError,
    InvalidDemoRequestError,
    JourneySessionNotFoundError,
    UnknownDemoPersonaError,
)

IdFactory = Callable[[str], str]
Clock = Callable[[], datetime]


def _default_id_factory(prefix: str) -> str:
    return f"{prefix}-{uuid4()}"


def _utc_now() -> datetime:
    return datetime.now(UTC)


@dataclass(frozen=True)
class PrerequisiteView:
    """Presentation-safe graph node state with reviewed label."""

    node_id: str
    label: str
    state: str


@dataclass(frozen=True)
class JourneySessionView:
    """Immutable application read view of one isolated demo session."""

    persona_id: DemoPersonaId
    journey_instance: JourneyInstance
    citizen_intent: CitizenIntent
    citizen_state: CitizenState
    definition: JourneyDefinition
    latest_evaluation: JourneyEvaluationResult | None


@dataclass(frozen=True)
class JourneyEvaluationView:
    """One full evaluation with safe prerequisite labels and metadata."""

    persona_id: DemoPersonaId
    journey_instance: JourneyInstance
    definition: JourneyDefinition
    evaluation: JourneyEvaluationResult
    prerequisites: tuple[PrerequisiteView, ...]


class JourneyService:
    """Own application-time metadata and coordinate the Phase 5 core."""

    def __init__(
        self,
        *,
        catalog: JourneyCatalog,
        planner: JourneyPlanner,
        orchestrator: JourneyOrchestrator,
        state_provider: DemoCitizenStateProvider,
        capability_provider: DemoAuthoritativeCapabilityProvider,
        store: InMemoryJourneyStore,
        id_factory: IdFactory = _default_id_factory,
        clock: Clock = _utc_now,
    ) -> None:
        self._catalog = catalog
        self._planner = planner
        self._orchestrator = orchestrator
        self._state_provider = state_provider
        self._capability_provider = capability_provider
        self._store = store
        self._id_factory = id_factory
        self._clock = clock

    def create_journey(
        self,
        *,
        persona_id: str,
        goal: IntentGoal,
        requested_amount_rupees: int | None,
    ) -> JourneySessionView:
        parsed_persona_id = self._parse_persona_id(persona_id)
        persona = self._state_provider.persona(parsed_persona_id)
        if persona.compatible_goal is not goal:
            raise DemoPersonaGoalMismatchError(persona_id)
        if (
            requested_amount_rupees is not None
            and goal is not IntentGoal.ACCESS_SOME_PF_FUNDS
        ):
            raise InvalidDemoRequestError(
                "requested amount is supported only for the funds-access demo"
            )

        base_intent, citizen_state = self._state_provider.load_base(
            parsed_persona_id
        )
        citizen_intent = CitizenIntent(
            goal=goal,
            currently_employed=base_intent.currently_employed,
            requested_amount_rupees=(
                requested_amount_rupees
                if requested_amount_rupees is not None
                else base_intent.requested_amount_rupees
            ),
        )
        instance = self._planner.create_instance(
            citizen_intent,
            citizen_id=citizen_state.citizen_id,
            journey_instance_id=self._id_factory("JRN"),
            created_at=self._clock(),
        )
        session = StoredJourneySession(
            persona_id=parsed_persona_id,
            journey_instance=instance,
            citizen_intent=citizen_intent,
            citizen_state=citizen_state,
        )
        self._store.create(session)
        return self._session_view(session)

    def evaluate_journey(
        self,
        journey_instance_id: str,
    ) -> JourneyEvaluationView:
        with self._locked_session(journey_instance_id) as session:
            definition = self._catalog.get_by_journey(
                session.journey_instance.journey_id
            )
            previous = (
                session.evaluations[-1].decision_record
                if session.evaluations
                else None
            )
            capability_results: Mapping[str, CapabilityValue] = (
                self._capability_provider.for_persona(session.persona_id)
            )
            evaluation = self._orchestrator.evaluate(
                journey_instance=session.journey_instance,
                citizen_intent=session.citizen_intent,
                citizen_state=session.citizen_state,
                policy_version=definition.policy_version,
                graph_version=definition.prerequisite_graph_version,
                capability_results=capability_results,
                evaluation_context=EvaluationContext(
                    decision_id=self._id_factory("DEC"),
                    evaluated_at=self._clock(),
                ),
                previous_decision_record=previous,
            )
            session.evaluations.append(evaluation)
            return self._evaluation_view(session, evaluation)

    def get_journey(self, journey_instance_id: str) -> JourneySessionView:
        with self._locked_session(journey_instance_id) as session:
            return self._session_view(session)

    def decision_history(
        self,
        journey_instance_id: str,
    ) -> tuple[JourneyEvaluationView, ...]:
        with self._locked_session(journey_instance_id) as session:
            return tuple(
                self._evaluation_view(session, evaluation)
                for evaluation in session.evaluations
            )

    def decision_detail(
        self,
        journey_instance_id: str,
        decision_id: str,
    ) -> JourneyEvaluationView:
        with self._locked_session(journey_instance_id) as session:
            for evaluation in session.evaluations:
                if evaluation.decision_record.decision_id == decision_id:
                    return self._evaluation_view(session, evaluation)
        raise DecisionNotFoundError(decision_id)

    def latest_record(
        self,
        journey_instance_id: str,
    ) -> DecisionRecord | None:
        with self._locked_session(journey_instance_id) as session:
            return (
                session.evaluations[-1].decision_record
                if session.evaluations
                else None
            )

    def _session_view(
        self,
        session: StoredJourneySession,
    ) -> JourneySessionView:
        return JourneySessionView(
            persona_id=session.persona_id,
            journey_instance=session.journey_instance,
            citizen_intent=session.citizen_intent,
            citizen_state=session.citizen_state,
            definition=self._catalog.get_by_journey(
                session.journey_instance.journey_id
            ),
            latest_evaluation=(
                session.evaluations[-1] if session.evaluations else None
            ),
        )

    def _evaluation_view(
        self,
        session: StoredJourneySession,
        evaluation: JourneyEvaluationResult,
    ) -> JourneyEvaluationView:
        definition = self._catalog.get_by_journey(
            session.journey_instance.journey_id
        )
        graph = self._catalog.graph_for(definition)
        labels = {node.node_id: node.label for node in graph.nodes}
        return JourneyEvaluationView(
            persona_id=session.persona_id,
            journey_instance=session.journey_instance,
            definition=definition,
            evaluation=evaluation,
            prerequisites=tuple(
                self._prerequisite_view(node_result, labels)
                for node_result in evaluation.graph_evaluation.node_results
            ),
        )

    @staticmethod
    def _prerequisite_view(
        node_result: PrerequisiteNodeResult,
        labels: Mapping[str, str],
    ) -> PrerequisiteView:
        return PrerequisiteView(
            node_id=node_result.node_id,
            label=labels[node_result.node_id],
            state=node_result.state.value,
        )

    @staticmethod
    def _parse_persona_id(persona_id: str) -> DemoPersonaId:
        try:
            return DemoPersonaId(persona_id)
        except ValueError as error:
            raise UnknownDemoPersonaError(persona_id) from error

    @contextmanager
    def _locked_session(
        self,
        journey_instance_id: str,
    ) -> Iterator[StoredJourneySession]:
        try:
            with self._store.locked_session(journey_instance_id) as session:
                yield session
        except StoredJourneyNotFoundError as error:
            raise JourneySessionNotFoundError(journey_instance_id) from error
