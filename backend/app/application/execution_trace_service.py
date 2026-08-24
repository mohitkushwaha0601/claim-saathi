"""Observational execution traces built from immutable stored artifacts."""

from collections.abc import Iterator
from contextlib import contextmanager
from dataclasses import dataclass
from datetime import datetime
from enum import Enum
from typing import Literal

from app.domain import (
    DecisionState,
    IntentGoal,
    JourneyId,
    RuleResult,
)
from app.infrastructure import InMemoryJourneyStore, StoredJourneySession
from app.infrastructure.memory_store import StoredJourneyNotFoundError
from app.journeys import JourneyCatalog
from app.journeys.exceptions import JourneyConfigurationError

from .exceptions import DecisionNotFoundError, JourneySessionNotFoundError


class TraceStageType(str, Enum):
    """Closed categories available to the judge-facing trace."""

    INTENT = "INTENT"
    JOURNEY_PLANNER = "JOURNEY_PLANNER"
    POLICY_ENGINE = "POLICY_ENGINE"
    PREREQUISITE_GRAPH = "PREREQUISITE_GRAPH"
    DECISION_RECORD = "DECISION_RECORD"


class TraceStageState(str, Enum):
    """Recorded progress or a stored deterministic result state."""

    RECORDED = "RECORDED"
    PASS = "PASS"
    ACTION_REQUIRED = "ACTION_REQUIRED"
    NOT_ELIGIBLE = "NOT_ELIGIBLE"
    UNABLE_TO_VERIFY = "UNABLE_TO_VERIFY"
    NOT_APPLICABLE = "NOT_APPLICABLE"
    POLICY_REVIEW_REQUIRED = "POLICY_REVIEW_REQUIRED"


class PlannerMethod(str, Enum):
    """Only the reviewed exact mapping is currently supported."""

    EXACT_REVIEWED_CONFIGURATION = "EXACT_REVIEWED_CONFIGURATION"


@dataclass(frozen=True)
class TraceRuleView:
    rule_id: str
    state: DecisionState
    issue_code: str | None
    source_id: str | None


@dataclass(frozen=True)
class TraceGraphNodeView:
    node_id: str
    label: str
    state: DecisionState
    children_ids: tuple[str, ...]
    rule_id: str | None


@dataclass(frozen=True)
class IntentTraceDetailsView:
    citizen_goal: IntentGoal
    ai_used: Literal[False] = False


@dataclass(frozen=True)
class PlannerTraceDetailsView:
    citizen_goal: IntentGoal
    journey_id: JourneyId
    method: PlannerMethod = PlannerMethod.EXACT_REVIEWED_CONFIGURATION
    ai_used: Literal[False] = False


@dataclass(frozen=True)
class PolicyEngineTraceDetailsView:
    policy_version: str
    rules: tuple[TraceRuleView, ...]
    ai_used: Literal[False] = False


@dataclass(frozen=True)
class PrerequisiteGraphTraceDetailsView:
    graph_version: str
    root_node_id: str
    nodes: tuple[TraceGraphNodeView, ...]
    ai_used: Literal[False] = False


@dataclass(frozen=True)
class DecisionRecordTraceDetailsView:
    decision_id: str
    citizen_state_revision: int
    policy_version: str
    graph_version: str
    journey_definition_version: int
    evaluated_at: datetime
    ai_used_for_decision: Literal[False]


TraceStageDetailsView = (
    IntentTraceDetailsView
    | PlannerTraceDetailsView
    | PolicyEngineTraceDetailsView
    | PrerequisiteGraphTraceDetailsView
    | DecisionRecordTraceDetailsView
)


@dataclass(frozen=True)
class ExecutionTraceStageView:
    stage_id: TraceStageType
    stage_type: TraceStageType
    label: str
    state: TraceStageState
    short_description: str
    input_summary: str
    output_summary: str
    details: TraceStageDetailsView


@dataclass(frozen=True)
class ExecutionTraceView:
    journey_instance_id: str
    decision_id: str
    journey_id: JourneyId
    citizen_goal: IntentGoal
    official_process_label: str
    official_process_source_id: str
    decision_state: DecisionState
    citizen_state_revision: int
    policy_version: str
    graph_version: str
    journey_definition_version: int
    ai_used_for_decision: Literal[False]
    stages: tuple[ExecutionTraceStageView, ...]


class ExecutionTraceService:
    """Describe one stored decision without invoking any decision service."""

    def __init__(
        self,
        *,
        catalog: JourneyCatalog,
        store: InMemoryJourneyStore,
    ) -> None:
        self._catalog = catalog
        self._store = store

    def get_trace(
        self,
        journey_instance_id: str,
        decision_id: str,
    ) -> ExecutionTraceView:
        with self._locked_session(journey_instance_id) as session:
            evaluation = next(
                (
                    item
                    for item in session.evaluations
                    if item.decision_record.decision_id == decision_id
                ),
                None,
            )
            if evaluation is None:
                raise DecisionNotFoundError(decision_id)

            definition = self._catalog.get_by_journey(
                session.journey_instance.journey_id
            )
            graph = self._catalog.graph_for(definition)
            record = evaluation.decision_record
            decision = evaluation.journey_decision
            graph_evaluation = evaluation.graph_evaluation
            if (
                record.journey_instance_id != journey_instance_id
                or record.decision_id != decision.decision_id
                or record.journey_id is not decision.journey_id
                or record.journey_state is not decision.state
                or record.policy_version != decision.policy_version
                or record.graph_version != decision.graph_version
                or record.journey_definition_version
                != decision.journey_definition_version
                or record.journey_id is not graph_evaluation.journey_id
                or graph.graph_version != record.graph_version
                or graph.root_node_id != graph_evaluation.root_node_id
                or graph_evaluation.root_state is not record.journey_state
                or tuple(
                    result.rule_id for result in record.rule_results
                )
                != definition.policy_rule_ids
            ):
                raise JourneyConfigurationError(
                    "stored trace artifacts do not agree"
                )

            result_by_node = {
                result.node_id: result
                for result in graph_evaluation.node_results
            }
            if set(result_by_node) != {node.node_id for node in graph.nodes}:
                raise JourneyConfigurationError(
                    "stored graph results do not match the pinned graph"
                )

            rules = tuple(
                self._trace_rule(result, record.source_ids)
                for result in record.rule_results
            )
            graph_nodes = tuple(
                TraceGraphNodeView(
                    node_id=node.node_id,
                    label=node.label,
                    state=result_by_node[node.node_id].state,
                    children_ids=node.children,
                    rule_id=result_by_node[node.node_id].rule_id,
                )
                for node in graph.nodes
            )
            trace_state = TraceStageState(record.journey_state.value)
            stages = (
                ExecutionTraceStageView(
                    stage_id=TraceStageType.INTENT,
                    stage_type=TraceStageType.INTENT,
                    label="Intent",
                    state=TraceStageState.RECORDED,
                    short_description=(
                        "ClaimSaathi starts with the citizen's typed goal."
                    ),
                    input_summary="Citizen-selected goal",
                    output_summary=(
                        f"Typed CitizenIntent: {session.citizen_intent.goal.value}"
                    ),
                    details=IntentTraceDetailsView(
                        citizen_goal=session.citizen_intent.goal
                    ),
                ),
                ExecutionTraceStageView(
                    stage_id=TraceStageType.JOURNEY_PLANNER,
                    stage_type=TraceStageType.JOURNEY_PLANNER,
                    label="Journey Planner",
                    state=TraceStageState.RECORDED,
                    short_description=(
                        "An exact reviewed mapping identifies the configured journey."
                    ),
                    input_summary=session.citizen_intent.goal.value,
                    output_summary=session.journey_instance.journey_id.value,
                    details=PlannerTraceDetailsView(
                        citizen_goal=session.citizen_intent.goal,
                        journey_id=session.journey_instance.journey_id,
                    ),
                ),
                ExecutionTraceStageView(
                    stage_id=TraceStageType.POLICY_ENGINE,
                    stage_type=TraceStageType.POLICY_ENGINE,
                    label="Policy Engine",
                    state=trace_state,
                    short_description=(
                        "Reviewed versioned rules produced the stored rule results."
                    ),
                    input_summary=f"Pinned policy {record.policy_version}",
                    output_summary=(
                        f"{len(record.rule_results)} stored rule result"
                        f"{'s' if len(record.rule_results) != 1 else ''}"
                    ),
                    details=PolicyEngineTraceDetailsView(
                        policy_version=record.policy_version,
                        rules=rules,
                    ),
                ),
                ExecutionTraceStageView(
                    stage_id=TraceStageType.PREREQUISITE_GRAPH,
                    stage_type=TraceStageType.PREREQUISITE_GRAPH,
                    label="Prerequisite Graph",
                    state=TraceStageState(graph_evaluation.root_state.value),
                    short_description=(
                        "The stored rule results were combined by the pinned prerequisite graph."
                    ),
                    input_summary=f"Pinned graph {record.graph_version}",
                    output_summary=(
                        f"Root state: {graph_evaluation.root_state.value}"
                    ),
                    details=PrerequisiteGraphTraceDetailsView(
                        graph_version=record.graph_version,
                        root_node_id=graph.root_node_id,
                        nodes=graph_nodes,
                    ),
                ),
                ExecutionTraceStageView(
                    stage_id=TraceStageType.DECISION_RECORD,
                    stage_type=TraceStageType.DECISION_RECORD,
                    label="Decision",
                    state=trace_state,
                    short_description=(
                        "The result was recorded as an immutable decision."
                    ),
                    input_summary="Stored deterministic evaluation artifacts",
                    output_summary=(
                        f"{record.journey_state.value} · {record.decision_id}"
                    ),
                    details=DecisionRecordTraceDetailsView(
                        decision_id=record.decision_id,
                        citizen_state_revision=record.citizen_state_revision,
                        policy_version=record.policy_version,
                        graph_version=record.graph_version,
                        journey_definition_version=(
                            record.journey_definition_version
                        ),
                        evaluated_at=record.evaluated_at,
                        ai_used_for_decision=record.ai_used_for_decision,
                    ),
                ),
            )
            return ExecutionTraceView(
                journey_instance_id=journey_instance_id,
                decision_id=record.decision_id,
                journey_id=record.journey_id,
                citizen_goal=session.citizen_intent.goal,
                official_process_label=definition.official_process_label,
                official_process_source_id=(
                    definition.official_process_source_id
                ),
                decision_state=record.journey_state,
                citizen_state_revision=record.citizen_state_revision,
                policy_version=record.policy_version,
                graph_version=record.graph_version,
                journey_definition_version=record.journey_definition_version,
                ai_used_for_decision=record.ai_used_for_decision,
                stages=stages,
            )

    @staticmethod
    def _trace_rule(
        result: RuleResult,
        decision_source_ids: tuple[str, ...],
    ) -> TraceRuleView:
        if (
            result.source_id is not None
            and result.source_id not in decision_source_ids
        ):
            raise JourneyConfigurationError(
                "stored rule source is absent from decision provenance"
            )
        return TraceRuleView(
            rule_id=result.rule_id,
            state=result.state,
            issue_code=result.issue_code,
            source_id=result.source_id,
        )

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
