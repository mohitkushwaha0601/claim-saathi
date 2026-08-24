"""End-to-end Phase 4 tests for Priya's RES_EXIT recovery workflow."""

import ast
import inspect
import json
from datetime import UTC, datetime, timedelta
from pathlib import Path
from typing import Any

from app.domain import (
    CitizenState,
    ResolutionState,
    ResolutionVerificationCode,
)
from app.resolutions import ResolutionNavigator, load_resolution_catalog

BACKEND_ROOT = Path(__file__).resolve().parents[2]
REPOSITORY_ROOT = BACKEND_ROOT.parent
RESOLUTION_DIRECTORY = REPOSITORY_ROOT / "resolutions" / "epfo"
SOURCE_REGISTRY_PATH = REPOSITORY_ROOT / "policies" / "epfo" / "sources.json"
DEMO_PATH = REPOSITORY_ROOT / "fixtures" / "demo" / "priya_transfer_missing_exit.json"
RESOLUTION_PACKAGE = BACKEND_ROOT / "app" / "resolutions"
CREATED_AT = datetime(2026, 8, 24, 10, 0, tzinfo=UTC)


def navigator() -> ResolutionNavigator:
    return ResolutionNavigator(
        load_resolution_catalog(RESOLUTION_DIRECTORY, SOURCE_REGISTRY_PATH)
    )


def priya_state() -> CitizenState:
    payload: dict[str, Any] = json.loads(
        DEMO_PATH.read_text(encoding="utf-8")
    )
    return CitizenState.model_validate(payload["citizen_state"])


def corrected_priya_state() -> CitizenState:
    payload = priya_state().model_dump(mode="json")
    payload["state_version"] = "SYNTH-PRIYA-STATE-V2"
    payload["employment"]["records"][0]["exit_date"] = "2023-01-31"
    payload["employment"]["records"][0]["exit_record_status"] = "RECORDED"
    return CitizenState.model_validate(payload)


def wrong_record_priya_state() -> CitizenState:
    payload = priya_state().model_dump(mode="json")
    payload["state_version"] = "SYNTH-PRIYA-STATE-V2-WRONG-RECORD"
    payload["employment"]["records"][1]["exit_date"] = "2026-08-01"
    payload["employment"]["records"][1]["exit_record_status"] = "RECORDED"
    return CitizenState.model_validate(payload)


def version_only_priya_state() -> CitizenState:
    payload = priya_state().model_dump(mode="json")
    payload["state_version"] = "SYNTH-PRIYA-STATE-V999"
    return CitizenState.model_validate(payload)


def waiting_instance(service: ResolutionNavigator):
    created = service.create(
        issue_code="EXIT_DATE_MISSING",
        journey_instance_id="SYNTH-JOURNEY-PRIYA-001",
        resolution_instance_id="SYNTH-RESOLUTION-PRIYA-001",
        at=CREATED_AT,
    )
    started = service.start(created, at=CREATED_AT + timedelta(minutes=1))
    return service.wait_for_update(
        started,
        at=CREATED_AT + timedelta(minutes=2),
    )


def test_priya_resolution_creation_selects_approved_workflow() -> None:
    service = navigator()
    created = service.create(
        issue_code="EXIT_DATE_MISSING",
        journey_instance_id="SYNTH-JOURNEY-PRIYA-001",
        resolution_instance_id="SYNTH-RESOLUTION-PRIYA-001",
        at=CREATED_AT,
    )
    workflow = service.workflow_for_issue("EXIT_DATE_MISSING")

    assert created.resolution_id == "RES_EXIT"
    assert created.workflow_version == 1
    assert created.state is ResolutionState.CREATED
    assert workflow.official_source_ids == ("SRC-EPFO-EXIT-RESOLUTION",)
    assert service.start(
        created,
        at=CREATED_AT + timedelta(minutes=1),
    ).state is ResolutionState.CITIZEN_ACTION_REQUIRED


def test_original_priya_recheck_remains_still_blocked() -> None:
    service = navigator()

    result = service.recheck(
        waiting_instance(service),
        priya_state(),
        at=CREATED_AT + timedelta(minutes=3),
    )

    assert result.state is ResolutionState.STILL_BLOCKED
    assert result.last_checked_citizen_state_version == "SYNTH-PRIYA-STATE-V1"


def test_corrected_priya_recheck_is_resolved_from_trusted_state() -> None:
    service = navigator()

    result = service.recheck(
        waiting_instance(service),
        corrected_priya_state(),
        at=CREATED_AT + timedelta(minutes=3),
    )

    assert result.state is ResolutionState.RESOLVED
    assert result.last_checked_citizen_state_version == "SYNTH-PRIYA-STATE-V2"


def test_wrong_record_update_remains_still_blocked() -> None:
    service = navigator()

    result = service.recheck(
        waiting_instance(service),
        wrong_record_priya_state(),
        at=CREATED_AT + timedelta(minutes=3),
    )

    assert result.state is ResolutionState.STILL_BLOCKED
    assert result.last_verification_code is (
        ResolutionVerificationCode.EXIT_DATE_STILL_MISSING
    )


def test_higher_state_version_alone_remains_still_blocked() -> None:
    service = navigator()

    result = service.recheck(
        waiting_instance(service),
        version_only_priya_state(),
        at=CREATED_AT + timedelta(minutes=3),
    )

    assert result.state is ResolutionState.STILL_BLOCKED
    assert result.last_checked_citizen_state_version == (
        "SYNTH-PRIYA-STATE-V999"
    )


def test_same_inputs_and_sequence_produce_equivalent_outcome() -> None:
    first_service = navigator()
    second_service = navigator()

    first = first_service.recheck(
        waiting_instance(first_service),
        corrected_priya_state(),
        at=CREATED_AT + timedelta(minutes=3),
    )
    second = second_service.recheck(
        waiting_instance(second_service),
        corrected_priya_state(),
        at=CREATED_AT + timedelta(minutes=3),
    )

    assert first == second
    assert first.model_dump_json() == second.model_dump_json()


def test_production_priya_fixture_remains_missing_previous_exit_date() -> None:
    state = priya_state()
    previous = tuple(
        record
        for record in state.employment.records
        if record.employment_type.value == "PREVIOUS"
    )

    assert len(previous) == 1
    assert previous[0].exit_date is None


def test_navigator_exposes_no_public_direct_resolve_method() -> None:
    public_methods = {
        name
        for name, member in inspect.getmembers(
            ResolutionNavigator,
            predicate=inspect.isfunction,
        )
        if not name.startswith("_")
    }

    assert "resolve" not in public_methods
    assert "mark_resolved" not in public_methods
    assert public_methods == {
        "create",
        "recheck",
        "retry",
        "start",
        "wait_for_update",
        "workflow_for_issue",
    }


def test_resolution_package_has_no_forbidden_dependencies_or_calls() -> None:
    forbidden_import_roots = {
        "fastapi",
        "httpx",
        "openai",
        "requests",
        "socket",
        "sqlalchemy",
        "sqlite3",
        "urllib",
    }
    forbidden_calls = {"eval", "exec"}

    for path in RESOLUTION_PACKAGE.glob("*.py"):
        source = path.read_text(encoding="utf-8")
        tree = ast.parse(source)
        imports = {
            alias.name.split(".")[0]
            for node in ast.walk(tree)
            if isinstance(node, (ast.Import, ast.ImportFrom))
            for alias in node.names
        }
        assert imports.isdisjoint(forbidden_import_roots)
        assert "app.policies" not in source
        assert "app.prerequisites" not in source
        assert "PolicyEngine" not in source
        assert "evaluate_graph" not in source
        assert "JourneyDecision" not in source
        assert not any(
            isinstance(node, ast.Call)
            and isinstance(node.func, ast.Name)
            and node.func.id in forbidden_calls
            for node in ast.walk(tree)
        )
