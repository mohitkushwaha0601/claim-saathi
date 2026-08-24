"""Tests for local immutable prerequisite-graph configuration loading."""

import json
from pathlib import Path

import pytest
from pydantic import ValidationError

from app.domain import JourneyId, PrerequisiteAggregation
from app.prerequisites import load_graph, load_graph_directory
from app.prerequisites.exceptions import (
    GraphConfigurationError,
    JourneyGraphMismatchError,
)

REPOSITORY_ROOT = Path(__file__).resolve().parents[4]
GRAPH_DIRECTORY = REPOSITORY_ROOT / "journeys" / "epfo"


def test_valid_graph_directory_loads_exact_mvp_graphs() -> None:
    graphs = load_graph_directory(GRAPH_DIRECTORY)

    assert {graph.journey_id for graph in graphs} == {
        JourneyId.PF_PARTIAL_WITHDRAWAL,
        JourneyId.PF_TRANSFER,
        JourneyId.PF_FINAL_SETTLEMENT,
    }
    assert all(
        node.aggregation in (None, PrerequisiteAggregation.ALL_OF)
        for graph in graphs
        for node in graph.nodes
    )


def test_graph_configuration_is_immutable_after_load() -> None:
    graph = load_graph(GRAPH_DIRECTORY / "transfer.v1.json")

    with pytest.raises(ValidationError):
        graph.graph_version = "MUTATED"  # type: ignore[misc]
    with pytest.raises(ValidationError):
        graph.nodes[0].label = "Mutated"  # type: ignore[misc]


def test_known_filename_rejects_journey_mismatch(tmp_path: Path) -> None:
    source = GRAPH_DIRECTORY / "partial_withdrawal.v1.json"
    target = tmp_path / "transfer.v1.json"
    target.write_text(source.read_text(encoding="utf-8"), encoding="utf-8")

    with pytest.raises(JourneyGraphMismatchError):
        load_graph(target)


def test_directory_rejects_unknown_graph_file(tmp_path: Path) -> None:
    (tmp_path / "unknown.json").write_text("{}", encoding="utf-8")

    with pytest.raises(GraphConfigurationError, match="unknown graph files"):
        load_graph_directory(tmp_path)


def test_graph_files_contain_only_rule_bindings_not_policy_conditions() -> None:
    forbidden_keys = {
        "expected",
        "operator",
        "input_path",
        "evaluator_id",
        "pass_state",
        "failure_state",
    }

    for path in GRAPH_DIRECTORY.glob("*.json"):
        payload = json.loads(path.read_text(encoding="utf-8"))
        assert all(forbidden_keys.isdisjoint(node) for node in payload["nodes"])


def test_final_settlement_graph_contains_no_numeric_wait_period() -> None:
    payload = json.loads(
        (GRAPH_DIRECTORY / "final_settlement.conflict_demo.json").read_text(
            encoding="utf-8"
        )
    )

    assert "FINAL_SETTLEMENT_WAIT_PERIOD" in json.dumps(payload)
    assert not any(
        isinstance(value, (int, float)) and not isinstance(value, bool)
        for value in _walk_values(payload)
    )


def _walk_values(value: object) -> list[object]:
    if isinstance(value, dict):
        return [item for child in value.values() for item in _walk_values(child)]
    if isinstance(value, list):
        return [item for child in value for item in _walk_values(child)]
    return [value]
