"""Strict validation tests for prerequisite graph topology and node shapes."""

import pytest

from app.domain import (
    JourneyId,
    PrerequisiteAggregation,
    PrerequisiteGraphDefinition,
    PrerequisiteNode,
)
from app.prerequisites import validate_graph
from app.prerequisites.exceptions import (
    DisconnectedNodeError,
    DuplicateNodeIdError,
    DuplicateRuleBindingError,
    GraphCycleError,
    InvalidNodeShapeError,
    MissingRootNodeError,
    UnknownChildNodeError,
)


def leaf(node_id: str, rule_id: str = "SYNTH-RULE-001") -> PrerequisiteNode:
    return PrerequisiteNode(
        node_id=node_id,
        label=f"Synthetic leaf {node_id}",
        rule_ids=(rule_id,),
    )


def group(node_id: str, *children: str) -> PrerequisiteNode:
    return PrerequisiteNode(
        node_id=node_id,
        label=f"Synthetic group {node_id}",
        children=children,
        aggregation=PrerequisiteAggregation.ALL_OF,
    )


def graph(
    *nodes: PrerequisiteNode,
    root_node_id: str = "ROOT",
) -> PrerequisiteGraphDefinition:
    return PrerequisiteGraphDefinition(
        journey_id=JourneyId.PF_TRANSFER,
        graph_version="SYNTH-GRAPH-V1",
        root_node_id=root_node_id,
        nodes=nodes,
    )


def test_valid_graph_is_returned_unchanged() -> None:
    definition = graph(group("ROOT", "LEAF"), leaf("LEAF"))

    assert validate_graph(definition) is definition


def test_duplicate_node_id_is_rejected() -> None:
    definition = graph(
        group("ROOT", "LEAF"),
        leaf("LEAF"),
        leaf("LEAF", "SYNTH-RULE-002"),
    )

    with pytest.raises(DuplicateNodeIdError):
        validate_graph(definition)


def test_unknown_child_is_rejected() -> None:
    with pytest.raises(UnknownChildNodeError):
        validate_graph(graph(group("ROOT", "ABSENT")))


def test_missing_root_is_rejected() -> None:
    with pytest.raises(MissingRootNodeError):
        validate_graph(graph(leaf("LEAF")))


def test_indirect_cycle_is_rejected() -> None:
    definition = graph(group("ROOT", "BRANCH"), group("BRANCH", "ROOT"))

    with pytest.raises(GraphCycleError):
        validate_graph(definition)


def test_direct_self_cycle_is_rejected() -> None:
    with pytest.raises(GraphCycleError):
        validate_graph(graph(group("ROOT", "ROOT")))


def test_disconnected_node_is_rejected() -> None:
    definition = graph(
        group("ROOT", "LEAF"),
        leaf("LEAF"),
        leaf("ORPHAN", "SYNTH-RULE-002"),
    )

    with pytest.raises(DisconnectedNodeError):
        validate_graph(definition)


def test_cycle_is_rejected_even_when_disconnected_from_root() -> None:
    definition = graph(
        leaf("ROOT"),
        group("ORPHAN-A", "ORPHAN-B"),
        group("ORPHAN-B", "ORPHAN-A"),
    )

    with pytest.raises(GraphCycleError):
        validate_graph(definition)


def test_node_with_children_and_rule_is_rejected() -> None:
    ambiguous = PrerequisiteNode(
        node_id="ROOT",
        label="Ambiguous",
        children=("LEAF",),
        rule_ids=("SYNTH-RULE-ROOT",),
        aggregation=PrerequisiteAggregation.ALL_OF,
    )

    with pytest.raises(InvalidNodeShapeError):
        validate_graph(graph(ambiguous, leaf("LEAF")))


def test_node_with_neither_children_nor_rule_is_rejected() -> None:
    empty = PrerequisiteNode(node_id="ROOT", label="Empty")

    with pytest.raises(InvalidNodeShapeError):
        validate_graph(graph(empty))


def test_leaf_with_multiple_rules_is_rejected() -> None:
    invalid = PrerequisiteNode(
        node_id="ROOT",
        label="Too many rules",
        rule_ids=("SYNTH-RULE-001", "SYNTH-RULE-002"),
    )

    with pytest.raises(InvalidNodeShapeError):
        validate_graph(graph(invalid))


def test_duplicate_rule_binding_is_rejected() -> None:
    definition = graph(
        group("ROOT", "LEFT", "RIGHT"),
        leaf("LEFT"),
        leaf("RIGHT"),
    )

    with pytest.raises(DuplicateRuleBindingError):
        validate_graph(definition)
