"""Tests for explicit resolution state transitions and verifier gating."""

from datetime import UTC, datetime, timedelta

import pytest

from app.domain import (
    ResolutionInstance,
    ResolutionState,
    ResolutionVerificationCode,
    ResolutionVerificationResult,
)
from app.resolutions.exceptions import (
    InvalidResolutionTransitionError,
    ResolutionVerificationRequiredError,
)
from app.resolutions.state_machine import (
    _transition_after_verification,
    transition,
)

CREATED_AT = datetime(2026, 8, 24, 10, 0, tzinfo=UTC)


def instance(state: ResolutionState = ResolutionState.CREATED) -> ResolutionInstance:
    return ResolutionInstance(
        resolution_instance_id="SYNTH-RESOLUTION-INSTANCE-001",
        journey_instance_id="SYNTH-JOURNEY-INSTANCE-001",
        resolution_id="RES_EXIT",
        issue_code="EXIT_DATE_MISSING",
        state=state,
        created_at=CREATED_AT,
        updated_at=CREATED_AT,
        workflow_version=1,
    )


def verification(satisfied: bool) -> ResolutionVerificationResult:
    return ResolutionVerificationResult(
        satisfied=satisfied,
        code=(
            ResolutionVerificationCode.SUCCESS_CONDITION_SATISFIED
            if satisfied
            else ResolutionVerificationCode.EXIT_DATE_STILL_MISSING
        ),
        citizen_state_version="SYNTH-STATE-V2",
    )


def test_created_to_citizen_action_required_is_allowed() -> None:
    updated = transition(
        instance(),
        ResolutionState.CITIZEN_ACTION_REQUIRED,
        at=CREATED_AT + timedelta(minutes=1),
    )

    assert updated.state is ResolutionState.CITIZEN_ACTION_REQUIRED


def test_citizen_action_to_waiting_is_allowed() -> None:
    updated = transition(
        instance(ResolutionState.CITIZEN_ACTION_REQUIRED),
        ResolutionState.WAITING_FOR_UPDATE,
        at=CREATED_AT + timedelta(minutes=1),
    )

    assert updated.state is ResolutionState.WAITING_FOR_UPDATE


def test_external_action_to_waiting_is_supported_for_future_workflows() -> None:
    updated = transition(
        instance(ResolutionState.EXTERNAL_ACTION_REQUIRED),
        ResolutionState.WAITING_FOR_UPDATE,
        at=CREATED_AT + timedelta(minutes=1),
    )

    assert updated.state is ResolutionState.WAITING_FOR_UPDATE


def test_waiting_to_rechecking_is_allowed() -> None:
    updated = transition(
        instance(ResolutionState.WAITING_FOR_UPDATE),
        ResolutionState.RECHECKING,
        at=CREATED_AT + timedelta(minutes=1),
    )

    assert updated.state is ResolutionState.RECHECKING


@pytest.mark.parametrize(
    ("satisfied", "expected_state"),
    [
        (True, ResolutionState.RESOLVED),
        (False, ResolutionState.STILL_BLOCKED),
    ],
)
def test_rechecking_outcome_is_selected_by_verification(
    satisfied: bool,
    expected_state: ResolutionState,
) -> None:
    updated = _transition_after_verification(
        instance(ResolutionState.RECHECKING),
        verification(satisfied),
        at=CREATED_AT + timedelta(minutes=1),
    )

    assert updated.state is expected_state
    assert updated.last_checked_citizen_state_version == "SYNTH-STATE-V2"


def test_still_blocked_can_return_to_citizen_action() -> None:
    updated = transition(
        instance(ResolutionState.STILL_BLOCKED),
        ResolutionState.CITIZEN_ACTION_REQUIRED,
        at=CREATED_AT + timedelta(minutes=1),
    )

    assert updated.state is ResolutionState.CITIZEN_ACTION_REQUIRED


@pytest.mark.parametrize(
    "start_state",
    [
        ResolutionState.CREATED,
        ResolutionState.CITIZEN_ACTION_REQUIRED,
        ResolutionState.WAITING_FOR_UPDATE,
    ],
)
def test_direct_terminal_transition_is_rejected(
    start_state: ResolutionState,
) -> None:
    with pytest.raises(ResolutionVerificationRequiredError):
        transition(
            instance(start_state),
            ResolutionState.RESOLVED,
            at=CREATED_AT + timedelta(minutes=1),
        )


def test_arbitrary_unknown_transition_is_rejected() -> None:
    with pytest.raises(InvalidResolutionTransitionError):
        transition(
            instance(),
            "SYNTH-UNKNOWN",  # type: ignore[arg-type]
            at=CREATED_AT + timedelta(minutes=1),
        )


def test_verification_outcome_requires_rechecking_state() -> None:
    with pytest.raises(InvalidResolutionTransitionError):
        _transition_after_verification(
            instance(ResolutionState.WAITING_FOR_UPDATE),
            verification(True),
            at=CREATED_AT + timedelta(minutes=1),
        )
