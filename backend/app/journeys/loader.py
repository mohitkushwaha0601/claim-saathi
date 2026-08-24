"""Local loader for the reviewed journey catalog and existing graph files."""

from pathlib import Path

from pydantic import ValidationError

from app.domain import JourneyCatalogDefinition
from app.policies import PolicyRegistry
from app.prerequisites import load_graph
from app.prerequisites.exceptions import PrerequisiteGraphError

from .catalog import JourneyCatalog
from .exceptions import JourneyConfigurationError

_CATALOG_FILENAME = "catalog.v1.json"


def load_journey_catalog(
    journey_directory: Path,
    policy_registry: PolicyRegistry,
) -> JourneyCatalog:
    """Load reviewed local mappings and validate all cross-layer bindings."""

    catalog_path = journey_directory / _CATALOG_FILENAME
    try:
        definition = JourneyCatalogDefinition.model_validate_json(
            catalog_path.read_text(encoding="utf-8")
        )
    except (OSError, ValidationError, ValueError) as error:
        raise JourneyConfigurationError(f"cannot load {catalog_path}") from error

    graph_bindings = []
    for graph_filename in dict.fromkeys(
        journey.prerequisite_graph_file for journey in definition.journeys
    ):
        if Path(graph_filename).name != graph_filename:
            raise JourneyConfigurationError(
                f"graph filename must be local: {graph_filename}"
            )
        try:
            graph = load_graph(journey_directory / graph_filename)
        except PrerequisiteGraphError as error:
            raise JourneyConfigurationError(
                f"cannot bind graph: {graph_filename}"
            ) from error
        graph_bindings.append((graph_filename, graph))

    return JourneyCatalog(definition, policy_registry, graph_bindings)
