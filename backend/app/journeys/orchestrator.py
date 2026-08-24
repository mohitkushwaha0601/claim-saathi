"""Explicit coordination of deterministic policy, graph, audit, and resolution."""

from collections.abc import Mapping
from datetime import datetime

from app.domain import (
    CapabilityValue,
    CitizenIntent,
    CitizenState,
    DecisionRecord,
    EvaluationContext,
    IssueResolutionLink,
    JourneyDecision,
    JourneyEvaluationResult,
    JourneyInstance,
    ResolutionInstance,
    RuleResult,
)
from app.policies import PolicyEngine, PolicyRegistry
from app.prerequisites import evaluate_graph
from app.resolutions import ResolutionNavigator

from .catalog import JourneyCatalog
from .exceptions import (
    JourneyInstanceMismatchError,
    JourneyVersionMismatchError,
    ResolutionStartNotAllowedError,
    StaleCitizenStateError,
)


def _ordered_unique(values: tuple[str | None, ...]) -> tuple[str, ...]:
    ordered: list[str] = []
    seen: set[str] = set()
    for value in values:
        if value is not None and value not in seen:
            ordered.append(value)
            seen.add(value)
    return tuple(ordered)


class JourneyOrchestrator:
    """Coordinate existing deterministic layers without reimplementing them."""

    def __init__(
        self,
        catalog: JourneyCatalog,
        policy_registry: PolicyRegistry,
        resolution_navigator: ResolutionNavigator | None = None,
    ) -> None:
        self._catalog = catalog
        self._policy_engine = PolicyEngine(policy_registry)
        self._resolution_navigator = resolution_navigator

    def evaluate(
        self,
        *,
        journey_instance: JourneyInstance,
        citizen_intent: CitizenIntent,
        citizen_state: CitizenState,
        policy_version: str,
        graph_version: str,
        evaluation_context: EvaluationContext,
        capability_results: Mapping[str, CapabilityValue] | None = None,
        previous_decision_record: DecisionRecord | None = None,
    ) -> JourneyEvaluationResult:
        """Run every configured policy rule and then the full graph from scratch."""

        journey = self._catalog.get_by_journey(journey_instance.journey_id)
        self._validate_inputs(
            journey_instance,
            citizen_intent,
            citizen_state,
            journey.version,
        )
        if policy_version != journey.policy_version:
            raise JourneyVersionMismatchError(
                f"policy {policy_version} != {journey.policy_version}"
            )
        if graph_version != journey.prerequisite_graph_version:
            raise JourneyVersionMismatchError(
                f"graph {graph_version} != {journey.prerequisite_graph_version}"
            )
        self._validate_recheck(
            journey_instance,
            citizen_state,
            previous_decision_record,
        )

        rule_results = tuple(
            self._policy_engine.evaluate_rule(
                policy_id=journey.policy_id,
                policy_version=policy_version,
                rule_id=rule_id,
                citizen_state=citizen_state,
                citizen_intent=citizen_intent,
                capability_results=capability_results,
            )
            for rule_id in journey.policy_rule_ids
        )
        graph = self._catalog.graph_for(journey)
        graph_evaluation = evaluate_graph(graph, rule_results)

        results_by_rule = {result.rule_id: result for result in rule_results}
        non_pass_node_ids = frozenset(
            graph_evaluation.non_pass_leaf_node_ids
        )
        non_pass_results = tuple(
            results_by_rule[node.rule_ids[0]]
            for node in graph.nodes
            if node.node_id in non_pass_node_ids and node.rule_ids
        )
        issue_codes = _ordered_unique(
            tuple(result.issue_code for result in non_pass_results)
        )
        resolution_ids = _ordered_unique(
            tuple(result.resolution_id for result in non_pass_results)
        )
        resolution_links = tuple(
            IssueResolutionLink(
                issue_code=result.issue_code,
                resolution_id=result.resolution_id,
            )
            for result in non_pass_results
            if result.issue_code is not None and result.resolution_id is not None
        )
        source_ids = _ordered_unique(
            tuple(result.source_id for result in rule_results)
        )

        decision = JourneyDecision(
            journey_id=journey.journey_id,
            state=graph_evaluation.root_state,
            blocking_node_ids=graph_evaluation.non_pass_leaf_node_ids,
            issue_codes=issue_codes,
            resolution_ids=resolution_ids,
            issue_resolution_links=resolution_links,
            policy_version=policy_version,
            graph_version=graph_version,
            journey_definition_version=journey.version,
            decision_id=evaluation_context.decision_id,
        )
        record = DecisionRecord(
            decision_id=evaluation_context.decision_id,
            journey_instance_id=journey_instance.journey_instance_id,
            citizen_state_version=citizen_state.state_version,
            citizen_state_revision=citizen_state.state_revision,
            policy_version=policy_version,
            graph_version=graph_version,
            journey_definition_version=journey.version,
            evaluated_at=evaluation_context.evaluated_at,
            journey_id=journey.journey_id,
            journey_state=graph_evaluation.root_state,
            rule_results=rule_results,
            issue_codes=issue_codes,
            source_ids=source_ids,
            ai_used_for_decision=False,
        )
        return JourneyEvaluationResult(
            graph_evaluation=graph_evaluation,
            journey_decision=decision,
            decision_record=record,
        )

    def start_resolution_for_issue(
        self,
        *,
        journey_instance: JourneyInstance,
        current_evaluation: JourneyEvaluationResult,
        issue_code: str,
        resolution_instance_id: str,
        at: datetime,
    ) -> ResolutionInstance:
        """Start only the approved resolution linked by the current decision."""

        if self._resolution_navigator is None:
            raise ResolutionStartNotAllowedError(
                "resolution navigator is not configured"
            )
        decision = current_evaluation.journey_decision
        record = current_evaluation.decision_record
        if (
            record.journey_instance_id != journey_instance.journey_instance_id
            or record.decision_id != decision.decision_id
            or decision.journey_id is not journey_instance.journey_id
        ):
            raise ResolutionStartNotAllowedError(
                "decision does not belong to the journey instance"
            )
        links = tuple(
            link
            for link in decision.issue_resolution_links
            if link.issue_code == issue_code
        )
        if issue_code not in decision.issue_codes or len(links) != 1:
            raise ResolutionStartNotAllowedError(issue_code)
        if links[0].resolution_id not in decision.resolution_ids:
            raise ResolutionStartNotAllowedError(
                "decision resolution linkage is inconsistent"
            )
        workflow = self._resolution_navigator.workflow_for_issue(issue_code)
        if workflow.resolution_id != links[0].resolution_id:
            raise ResolutionStartNotAllowedError(
                "decision resolution does not match the approved catalog"
            )
        return self._resolution_navigator.create(
            issue_code=issue_code,
            journey_instance_id=journey_instance.journey_instance_id,
            resolution_instance_id=resolution_instance_id,
            at=at,
        )

    @staticmethod
    def _validate_inputs(
        journey_instance: JourneyInstance,
        citizen_intent: CitizenIntent,
        citizen_state: CitizenState,
        journey_definition_version: int,
    ) -> None:
        if journey_instance.citizen_goal is not citizen_intent.goal:
            raise JourneyInstanceMismatchError("intent goal mismatch")
        if journey_instance.citizen_id != citizen_state.citizen_id:
            raise JourneyInstanceMismatchError("citizen identifier mismatch")
        if (
            journey_instance.journey_definition_version
            != journey_definition_version
        ):
            raise JourneyInstanceMismatchError("journey definition mismatch")

    @staticmethod
    def _validate_recheck(
        journey_instance: JourneyInstance,
        citizen_state: CitizenState,
        previous: DecisionRecord | None,
    ) -> None:
        if previous is None:
            return
        if (
            previous.journey_instance_id
            != journey_instance.journey_instance_id
            or previous.journey_id is not journey_instance.journey_id
        ):
            raise JourneyInstanceMismatchError(
                "previous decision belongs to another journey"
            )
        if citizen_state.state_revision < previous.citizen_state_revision:
            raise StaleCitizenStateError(
                f"state revision {citizen_state.state_revision} is older than "
                f"{previous.citizen_state_revision}"
            )
