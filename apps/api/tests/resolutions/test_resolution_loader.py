"""Validation tests for reviewed resolution workflow configuration."""

import json
from pathlib import Path
from typing import Any

import pytest
from pydantic import ValidationError

from app.domain import (
    ResolutionStepType,
    ResolutionSuccessVerifier,
    ResolutionWorkflowStatus,
)
from app.resolutions import load_resolution_catalog, load_resolution_workflow
from app.resolutions.exceptions import (
    DuplicateResolutionStepError,
    ResolutionConfigurationError,
    ResolutionWorkflowMismatchError,
    UnknownResolutionSourceError,
)

REPOSITORY_ROOT = Path(__file__).resolve().parents[4]
RESOLUTION_DIRECTORY = REPOSITORY_ROOT / "resolutions" / "epfo"
SOURCE_REGISTRY_PATH = REPOSITORY_ROOT / "policies" / "epfo" / "sources.json"
WORKFLOW_PATH = RESOLUTION_DIRECTORY / "exit_date_missing.v1.json"


def workflow_payload() -> dict[str, Any]:
    return json.loads(WORKFLOW_PATH.read_text(encoding="utf-8"))


def write_workflow(directory: Path, payload: dict[str, Any]) -> Path:
    path = directory / "exit_date_missing.v1.json"
    path.write_text(json.dumps(payload), encoding="utf-8")
    return path


def test_valid_res_exit_workflow_loads() -> None:
    catalog = load_resolution_catalog(
        RESOLUTION_DIRECTORY,
        SOURCE_REGISTRY_PATH,
    )
    workflow = catalog.get_by_issue("EXIT_DATE_MISSING")

    assert workflow.resolution_id == "RES_EXIT"
    assert workflow.version == 1
    assert workflow.status is ResolutionWorkflowStatus.ACTIVE
    assert workflow.success_verifier is (
        ResolutionSuccessVerifier.PREVIOUS_EMPLOYMENT_EXIT_DATE_PRESENT
    )
    assert [step.step_type for step in workflow.approved_steps] == [
        ResolutionStepType.INFORMATION,
        ResolutionStepType.EXTERNAL_ACTION,
        ResolutionStepType.WAIT,
        ResolutionStepType.SYSTEM_ACTION,
    ]


def test_unknown_source_is_rejected(tmp_path: Path) -> None:
    payload = workflow_payload()
    payload["official_source_ids"] = ["SRC-SYNTH-UNKNOWN"]
    write_workflow(tmp_path, payload)

    with pytest.raises(UnknownResolutionSourceError):
        load_resolution_catalog(tmp_path, SOURCE_REGISTRY_PATH)


def test_duplicate_step_id_is_rejected(tmp_path: Path) -> None:
    payload = workflow_payload()
    payload["approved_steps"][1]["step_id"] = payload["approved_steps"][0][
        "step_id"
    ]
    write_workflow(tmp_path, payload)

    with pytest.raises(DuplicateResolutionStepError):
        load_resolution_catalog(tmp_path, SOURCE_REGISTRY_PATH)


def test_unsupported_step_type_is_rejected(tmp_path: Path) -> None:
    payload = workflow_payload()
    payload["approved_steps"][0]["step_type"] = "AI_GENERATED_ACTION"
    path = write_workflow(tmp_path, payload)

    with pytest.raises(ResolutionConfigurationError):
        load_resolution_workflow(path)


def test_unsupported_success_verifier_is_rejected(tmp_path: Path) -> None:
    payload = workflow_payload()
    payload["success_verifier"] = "ARBITRARY_EXPRESSION"
    path = write_workflow(tmp_path, payload)

    with pytest.raises(ResolutionConfigurationError):
        load_resolution_workflow(path)


def test_missing_success_condition_is_rejected(tmp_path: Path) -> None:
    payload = workflow_payload()
    del payload["success_condition"]
    path = write_workflow(tmp_path, payload)

    with pytest.raises(ResolutionConfigurationError):
        load_resolution_workflow(path)


def test_arbitrary_executable_expression_is_rejected(tmp_path: Path) -> None:
    payload = workflow_payload()
    payload["success_expression"] = "citizen_state.exit_date != null"
    path = write_workflow(tmp_path, payload)

    with pytest.raises(ResolutionConfigurationError):
        load_resolution_workflow(path)


def test_arbitrary_action_field_is_rejected(tmp_path: Path) -> None:
    payload = workflow_payload()
    payload["approved_steps"][0]["generated_action"] = "Do something else"
    path = write_workflow(tmp_path, payload)

    with pytest.raises(ResolutionConfigurationError):
        load_resolution_workflow(path)


def test_workflow_issue_code_mismatch_is_rejected(tmp_path: Path) -> None:
    payload = workflow_payload()
    payload["issue_code"] = "SYNTH-WRONG-ISSUE"
    path = write_workflow(tmp_path, payload)

    with pytest.raises(ResolutionWorkflowMismatchError):
        load_resolution_workflow(path)


def test_workflow_config_is_immutable() -> None:
    workflow = load_resolution_workflow(WORKFLOW_PATH)

    with pytest.raises(ValidationError):
        workflow.title = "Mutated"  # type: ignore[misc]
    with pytest.raises(ValidationError):
        workflow.approved_steps[0].title = "Mutated"  # type: ignore[misc]


def test_res_exit_source_is_narrow_resolution_guidance() -> None:
    sources = json.loads(SOURCE_REGISTRY_PATH.read_text(encoding="utf-8"))
    source = next(
        item
        for item in sources
        if item["source_id"] == "SRC-EPFO-EXIT-RESOLUTION"
    )

    assert source["status"] == "ACTIVE"
    assert "RES_EXIT" in source["scope"]
    assert "does not evaluate" in source["notes"]
    assert source["reference_url"] == "https://www.epfindia.gov.in/site_en/FAQ.php"


def test_external_action_guidance_is_conditional_not_an_availability_claim() -> None:
    workflow = load_resolution_workflow(WORKFLOW_PATH)
    external_step = next(
        step
        for step in workflow.approved_steps
        if step.step_type is ResolutionStepType.EXTERNAL_ACTION
    )

    assert external_step.canonical_guidance == (
        "EPFO provides a self-service Mark Exit process after the applicable "
        "60-day condition is satisfied."
    )
    assert external_step.official_route == (
        "Member Unified Portal",
        "Manage",
        "Mark Exit",
        "Select previous employment",
        "Enter Date of Exit and Reason of Exit",
        "Authenticate using Aadhaar-linked OTP",
    )
