"""Reviewed journey catalog loading and cross-layer drift tests."""

from pathlib import Path

import pytest
from pydantic import ValidationError

from app.domain import IntentGoal, JourneyCatalogDefinition, JourneyId
from app.journeys import JourneyCatalog, load_journey_catalog
from app.journeys.exceptions import (
    DuplicateJourneyMappingError,
    JourneyNotAvailableError,
    PolicyGraphMismatchError,
)
from app.policies import load_policy_registry
from app.prerequisites import load_graph

REPOSITORY_ROOT = Path(__file__).resolve().parents[4]
JOURNEY_DIRECTORY = REPOSITORY_ROOT / "journeys" / "epfo"
POLICY_DIRECTORY = REPOSITORY_ROOT / "policies" / "epfo"


def registry():
    return load_policy_registry(POLICY_DIRECTORY)


def catalog_definition() -> JourneyCatalogDefinition:
    return JourneyCatalogDefinition.model_validate_json(
        (JOURNEY_DIRECTORY / "catalog.v1.json").read_text(encoding="utf-8")
    )


def graph_bindings(definition: JourneyCatalogDefinition):
    filenames = dict.fromkeys(
        item.prerequisite_graph_file for item in definition.journeys
    )
    return tuple(
        (filename, load_graph(JOURNEY_DIRECTORY / filename))
        for filename in filenames
    )


def test_valid_catalog_loads_with_three_active_mappings() -> None:
    catalog = load_journey_catalog(JOURNEY_DIRECTORY, registry())

    assert len(catalog.all()) == 3
    assert {item.journey_id for item in catalog.all()} == set(JourneyId)


def test_official_process_metadata_is_preserved() -> None:
    catalog = load_journey_catalog(JOURNEY_DIRECTORY, registry())

    expected = {
        JourneyId.PF_PARTIAL_WITHDRAWAL: "Form 31",
        JourneyId.PF_TRANSFER: "Form 13",
        JourneyId.PF_FINAL_SETTLEMENT: "Form 19",
    }
    for journey_id, process_label in expected.items():
        definition = catalog.get_by_journey(journey_id)
        assert definition.official_process_label == process_label
        assert definition.official_process_source_id == "SRC-EPFO-FORMS"


def test_unknown_citizen_goal_is_rejected() -> None:
    definition = catalog_definition()
    partial_only = definition.model_copy(
        update={"journeys": (definition.journeys[0],)}
    )
    catalog = JourneyCatalog(
        partial_only,
        registry(),
        graph_bindings(definition),
    )

    with pytest.raises(JourneyNotAvailableError):
        catalog.get_by_goal(IntentGoal.FINAL_PF_SETTLEMENT)


def test_duplicate_active_goal_mapping_is_rejected() -> None:
    definition = catalog_definition()
    duplicate = definition.journeys[1].model_copy(
        update={"citizen_goal": IntentGoal.ACCESS_SOME_PF_FUNDS}
    )
    modified = definition.model_copy(
        update={
            "journeys": (
                definition.journeys[0],
                duplicate,
                definition.journeys[2],
            )
        }
    )

    with pytest.raises(DuplicateJourneyMappingError):
        JourneyCatalog(modified, registry(), graph_bindings(definition))


def test_policy_graph_journey_mismatch_is_rejected() -> None:
    definition = catalog_definition()
    partial = definition.journeys[0].model_copy(
        update={"prerequisite_graph_file": "transfer.v1.json"}
    )
    modified = definition.model_copy(
        update={"journeys": (partial,) + definition.journeys[1:]}
    )

    with pytest.raises(PolicyGraphMismatchError, match="graph journey"):
        JourneyCatalog(modified, registry(), graph_bindings(definition))


def test_missing_expected_graph_rule_is_rejected() -> None:
    definition = catalog_definition()
    partial = definition.journeys[0]
    shortened = partial.model_copy(
        update={"policy_rule_ids": partial.policy_rule_ids[:-1]}
    )
    modified = definition.model_copy(
        update={"journeys": (shortened,) + definition.journeys[1:]}
    )

    with pytest.raises(PolicyGraphMismatchError, match="graph rule binding"):
        JourneyCatalog(modified, registry(), graph_bindings(definition))


def test_unreviewed_resolution_binding_is_rejected() -> None:
    definition = catalog_definition()
    transfer = definition.journeys[1].model_copy(
        update={"resolution_ids": ("RES_UNREVIEWED",)}
    )
    modified = definition.model_copy(
        update={
            "journeys": (
                definition.journeys[0],
                transfer,
                definition.journeys[2],
            )
        }
    )

    with pytest.raises(PolicyGraphMismatchError, match="resolution binding"):
        JourneyCatalog(modified, registry(), graph_bindings(definition))


def test_catalog_configuration_is_immutable() -> None:
    catalog = load_journey_catalog(JOURNEY_DIRECTORY, registry())
    definition = catalog.get_by_journey(JourneyId.PF_TRANSFER)

    with pytest.raises(ValidationError):
        definition.version = 2  # type: ignore[misc]
