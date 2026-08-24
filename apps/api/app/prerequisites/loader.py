"""Local JSON prerequisite-graph loader with no external dependencies."""

from pathlib import Path

from pydantic import ValidationError

from app.domain import JourneyId, PrerequisiteGraphDefinition

from .exceptions import GraphConfigurationError, JourneyGraphMismatchError
from .graph import validate_graph

_EXPECTED_JOURNEYS = {
    "partial_withdrawal.v1.json": JourneyId.PF_PARTIAL_WITHDRAWAL,
    "transfer.v1.json": JourneyId.PF_TRANSFER,
    "final_settlement.conflict_demo.json": JourneyId.PF_FINAL_SETTLEMENT,
}


def load_graph(graph_path: Path) -> PrerequisiteGraphDefinition:
    """Load and validate one immutable graph from local reviewed JSON."""

    try:
        graph = PrerequisiteGraphDefinition.model_validate_json(
            graph_path.read_text(encoding="utf-8")
        )
    except (OSError, ValidationError, ValueError) as error:
        raise GraphConfigurationError(f"cannot load {graph_path}") from error

    expected_journey = _EXPECTED_JOURNEYS.get(graph_path.name)
    if expected_journey is not None and graph.journey_id is not expected_journey:
        raise JourneyGraphMismatchError(
            f"{graph_path.name} declares {graph.journey_id.value}"
        )
    return validate_graph(graph)


def load_graph_directory(
    graph_directory: Path,
) -> tuple[PrerequisiteGraphDefinition, ...]:
    """Load the exact known MVP graph files in stable filename order."""

    paths = tuple(sorted(graph_directory.glob("*.json")))
    unknown_names = {path.name for path in paths} - set(_EXPECTED_JOURNEYS)
    if unknown_names:
        raise GraphConfigurationError(
            f"unknown graph files: {', '.join(sorted(unknown_names))}"
        )
    missing_names = set(_EXPECTED_JOURNEYS) - {path.name for path in paths}
    if missing_names:
        raise GraphConfigurationError(
            f"missing graph files: {', '.join(sorted(missing_names))}"
        )
    return tuple(load_graph(path) for path in paths)
