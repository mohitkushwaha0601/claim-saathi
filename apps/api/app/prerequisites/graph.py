"""Strict structural validation for immutable prerequisite graphs."""

from app.domain import PrerequisiteAggregation, PrerequisiteGraphDefinition

from .exceptions import (
    DisconnectedNodeError,
    DuplicateNodeIdError,
    DuplicateRuleBindingError,
    GraphCycleError,
    InvalidNodeShapeError,
    MissingRootNodeError,
    UnknownChildNodeError,
)


def validate_graph(
    graph: PrerequisiteGraphDefinition,
) -> PrerequisiteGraphDefinition:
    """Validate one complete graph and return the same immutable definition."""

    nodes_by_id = {}
    for node in graph.nodes:
        if node.node_id in nodes_by_id:
            raise DuplicateNodeIdError(node.node_id)
        nodes_by_id[node.node_id] = node

    if graph.root_node_id not in nodes_by_id:
        raise MissingRootNodeError(graph.root_node_id)

    bound_rule_ids: set[str] = set()
    for node in graph.nodes:
        has_children = bool(node.children)
        has_rules = bool(node.rule_ids)

        if has_children:
            if has_rules or node.aggregation is not PrerequisiteAggregation.ALL_OF:
                raise InvalidNodeShapeError(node.node_id)
        elif (
            len(node.rule_ids) != 1
            or node.aggregation is not None
        ):
            raise InvalidNodeShapeError(node.node_id)

        for child_id in node.children:
            if child_id not in nodes_by_id:
                raise UnknownChildNodeError(f"{node.node_id}: {child_id}")

        if not has_children:
            rule_id = node.rule_ids[0]
            if rule_id in bound_rule_ids:
                raise DuplicateRuleBindingError(rule_id)
            bound_rule_ids.add(rule_id)

    cycle_checked: set[str] = set()
    visiting: set[str] = set()

    def check_for_cycles(node_id: str) -> None:
        if node_id in visiting:
            raise GraphCycleError(node_id)
        if node_id in cycle_checked:
            return
        visiting.add(node_id)
        for child_id in nodes_by_id[node_id].children:
            check_for_cycles(child_id)
        visiting.remove(node_id)
        cycle_checked.add(node_id)

    for node_id in nodes_by_id:
        check_for_cycles(node_id)

    reachable: set[str] = set()

    def mark_reachable(node_id: str) -> None:
        if node_id in reachable:
            return
        reachable.add(node_id)
        for child_id in nodes_by_id[node_id].children:
            mark_reachable(child_id)

    mark_reachable(graph.root_node_id)
    if reachable != set(nodes_by_id):
        orphan_ids = sorted(set(nodes_by_id) - reachable)
        raise DisconnectedNodeError(", ".join(orphan_ids))

    return graph
