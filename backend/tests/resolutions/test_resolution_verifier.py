"""Trusted-fact tests for the allowlisted RES_EXIT success verifier."""

import json
from pathlib import Path
from typing import Any

from app.domain import (
    CitizenState,
    ResolutionVerificationCode,
)
from app.resolutions import load_resolution_workflow, verify_resolution_success

BACKEND_ROOT = Path(__file__).resolve().parents[2]
REPOSITORY_ROOT = BACKEND_ROOT.parent
DEMO_PATH = REPOSITORY_ROOT / "fixtures" / "demo" / "priya_transfer_missing_exit.json"
WORKFLOW_PATH = (
    REPOSITORY_ROOT / "resolutions" / "epfo" / "exit_date_missing.v1.json"
)


def priya_payload() -> dict[str, Any]:
    return json.loads(DEMO_PATH.read_text(encoding="utf-8"))["citizen_state"]


def verify(payload: dict[str, Any]):
    workflow = load_resolution_workflow(WORKFLOW_PATH)
    return verify_resolution_success(
        workflow,
        CitizenState.model_validate(payload),
    )


def test_original_priya_does_not_satisfy_success_condition() -> None:
    result = verify(priya_payload())

    assert result.satisfied is False
    assert result.code is ResolutionVerificationCode.EXIT_DATE_STILL_MISSING


def test_corrected_previous_employment_satisfies_success_condition() -> None:
    payload = priya_payload()
    payload["state_version"] = "SYNTH-PRIYA-STATE-V2"
    payload["employment"]["records"][0]["exit_date"] = "2023-01-31"
    payload["employment"]["records"][0]["exit_record_status"] = "RECORDED"

    result = verify(payload)

    assert result.satisfied is True
    assert result.code is (
        ResolutionVerificationCode.SUCCESS_CONDITION_SATISFIED
    )
    assert result.citizen_state_version == "SYNTH-PRIYA-STATE-V2"


def test_current_employment_exit_date_does_not_resolve_previous_record() -> None:
    payload = priya_payload()
    payload["state_version"] = "SYNTH-PRIYA-STATE-V2-WRONG-RECORD"
    payload["employment"]["records"][1]["exit_date"] = "2026-08-01"
    payload["employment"]["records"][1]["exit_record_status"] = "RECORDED"

    result = verify(payload)

    assert result.satisfied is False
    assert result.code is ResolutionVerificationCode.EXIT_DATE_STILL_MISSING


def test_zero_previous_records_does_not_produce_false_success() -> None:
    payload = priya_payload()
    payload["employment"]["records"] = [payload["employment"]["records"][1]]

    result = verify(payload)

    assert result.satisfied is False
    assert result.code is (
        ResolutionVerificationCode.PREVIOUS_EMPLOYMENT_RECORD_NOT_UNIQUE
    )


def test_multiple_previous_records_do_not_produce_false_success() -> None:
    payload = priya_payload()
    extra_previous = dict(payload["employment"]["records"][0])
    extra_previous["employment_id"] = "SYNTH-PRIYA-PREVIOUS-AMBIGUOUS-002"
    extra_previous["exit_date"] = "2022-12-31"
    extra_previous["exit_record_status"] = "RECORDED"
    payload["employment"]["records"].append(extra_previous)

    result = verify(payload)

    assert result.satisfied is False
    assert result.code is (
        ResolutionVerificationCode.PREVIOUS_EMPLOYMENT_RECORD_NOT_UNIQUE
    )


def test_higher_state_version_without_exit_date_is_not_proof() -> None:
    payload = priya_payload()
    payload["state_version"] = "SYNTH-PRIYA-STATE-V999"

    result = verify(payload)

    assert result.satisfied is False
    assert result.citizen_state_version == "SYNTH-PRIYA-STATE-V999"
