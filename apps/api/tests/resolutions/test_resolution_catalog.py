"""Behavioral tests for exact issue-to-workflow catalog mapping."""

import json
from pathlib import Path

import pytest
from pydantic import TypeAdapter

from app.domain import PolicySource, ResolutionWorkflow
from app.resolutions import ResolutionCatalog, load_resolution_catalog
from app.resolutions.exceptions import (
    DuplicateIssueMappingError,
    ResolutionConfigurationError,
    ResolutionNotAvailableError,
    UnknownResolutionError,
)

REPOSITORY_ROOT = Path(__file__).resolve().parents[4]
RESOLUTION_DIRECTORY = REPOSITORY_ROOT / "resolutions" / "epfo"
SOURCE_REGISTRY_PATH = REPOSITORY_ROOT / "policies" / "epfo" / "sources.json"
WORKFLOW_PATH = RESOLUTION_DIRECTORY / "exit_date_missing.v1.json"
SOURCE_ADAPTER = TypeAdapter(tuple[PolicySource, ...])


def sources() -> tuple[PolicySource, ...]:
    return SOURCE_ADAPTER.validate_json(
        SOURCE_REGISTRY_PATH.read_text(encoding="utf-8")
    )


def workflow() -> ResolutionWorkflow:
    return ResolutionWorkflow.model_validate_json(
        WORKFLOW_PATH.read_text(encoding="utf-8")
    )


def test_exit_date_issue_maps_deterministically_to_res_exit() -> None:
    catalog = load_resolution_catalog(
        RESOLUTION_DIRECTORY,
        SOURCE_REGISTRY_PATH,
    )

    first = catalog.get_by_issue("EXIT_DATE_MISSING")
    second = catalog.get_by_issue("EXIT_DATE_MISSING")

    assert first is second
    assert first.resolution_id == "RES_EXIT"


def test_unknown_issue_has_no_invented_resolution() -> None:
    catalog = load_resolution_catalog(
        RESOLUTION_DIRECTORY,
        SOURCE_REGISTRY_PATH,
    )

    with pytest.raises(ResolutionNotAvailableError):
        catalog.get_by_issue("SYNTH-UNKNOWN-ISSUE")


def test_unknown_resolution_identifier_is_rejected() -> None:
    catalog = load_resolution_catalog(
        RESOLUTION_DIRECTORY,
        SOURCE_REGISTRY_PATH,
    )

    with pytest.raises(UnknownResolutionError):
        catalog.get_by_resolution("SYNTH-UNKNOWN-RESOLUTION", 1)


def test_duplicate_active_issue_mapping_is_rejected() -> None:
    original = workflow()
    duplicate = original.model_copy(
        update={"resolution_id": "SYNTH-SECOND-RESOLUTION"}
    )

    with pytest.raises(DuplicateIssueMappingError):
        ResolutionCatalog(sources(), (original, duplicate))


def test_workflow_with_no_steps_is_rejected() -> None:
    empty = workflow().model_copy(update={"approved_steps": ()})

    with pytest.raises(ResolutionConfigurationError, match="no approved steps"):
        ResolutionCatalog(sources(), (empty,))


def test_catalog_all_is_stable_and_read_only() -> None:
    catalog = load_resolution_catalog(
        RESOLUTION_DIRECTORY,
        SOURCE_REGISTRY_PATH,
    )

    assert catalog.all() == catalog.all()
    assert not hasattr(catalog, "add")


def test_catalog_uses_exact_issue_codes_without_fuzzy_matching() -> None:
    catalog = load_resolution_catalog(
        RESOLUTION_DIRECTORY,
        SOURCE_REGISTRY_PATH,
    )

    for near_match in ("exit_date_missing", "EXIT DATE MISSING", "EXIT_DATE"):
        with pytest.raises(ResolutionNotAvailableError):
            catalog.get_by_issue(near_match)
