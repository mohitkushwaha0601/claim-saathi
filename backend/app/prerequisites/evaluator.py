"""Pure deterministic composition of already-produced RuleResult objects."""

from collections.abc import Iterable

from app.domain import (
    DecisionState,
    PrerequisiteGraphDefinition,
    PrerequisiteGraphEvaluation,
    PrerequisiteNodeResult,
    RuleResult,
)

from .exceptions import DuplicateRuleResultError, MissingRuleResultError
from .graph import validate_graph

_ALL_OF_PRECEDENCE = (
    DecisionState.POLICY_REVIEW_REQUIRED,
    DecisionState.NOT_APPLICABLE,
    DecisionState.NOT_ELIGIBLE,
    DecisionState.ACTION_REQUIRED,
    DecisionState.UNABLE_TO_VERIFY,
    DecisionState.PASS,
)


def aggregate_all_of(states: Iterable[DecisionState]) -> DecisionState:
    """Aggregate non-empty child states using the documented MVP precedence."""

    state_set = frozenset(states)
    for state in _ALL_OF_PRECEDENCE:
        if state in state_set:
            return state
    raise ValueError("ALL_OF requires at least one child state")


def evaluate_graph(
    graph_definition: PrerequisiteGraphDefinition,
    rule_results: Iterable[RuleResult],
) -> PrerequisiteGraphEvaluation:
    """Compose supplied rule states without evaluating or reinterpreting policy."""

    graph = validate_graph(graph_definition)
    results_by_rule_id: dict[str, RuleResult] = {}
    for result in rule_results:
        if result.rule_id in results_by_rule_id:
            raise DuplicateRuleResultError(result.rule_id)
        results_by_rule_id[result.rule_id] = result

    nodes_by_id = {node.node_id: node for node in graph.nodes}
    states_by_node_id: dict[str, DecisionState] = {}

    def evaluate_node(node_id: str) -> DecisionState:
        node = nodes_by_id[node_id]
        if node.children:
            state = aggregate_all_of(
                evaluate_node(child_id) for child_id in node.children
            )
        else:
            rule_id = node.rule_ids[0]
            try:
                state = results_by_rule_id[rule_id].state
            except KeyError as error:
                raise MissingRuleResultError(rule_id) from error
        states_by_node_id[node_id] = state
        return state

    root_state = evaluate_node(graph.root_node_id)
    node_results = tuple(
        PrerequisiteNodeResult(
            node_id=node.node_id,
            state=states_by_node_id[node.node_id],
            child_node_ids=node.children,
            rule_id=node.rule_ids[0] if node.rule_ids else None,
        )
        for node in graph.nodes
    )
    non_pass_leaf_node_ids = tuple(
        result.node_id
        for result in node_results
        if result.rule_id is not None and result.state is not DecisionState.PASS
    )
    return PrerequisiteGraphEvaluation(
        journey_id=graph.journey_id,
        graph_version=graph.graph_version,
        root_node_id=graph.root_node_id,
        root_state=root_state,
        node_results=node_results,
        non_pass_leaf_node_ids=non_pass_leaf_node_ids,
    )
