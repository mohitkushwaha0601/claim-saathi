"""Explicit resolution state transitions with verifier-gated outcomes."""

from datetime import datetime

from app.domain import (
    ResolutionInstance,
    ResolutionState,
    ResolutionVerificationResult,
)

from .exceptions import (
    InvalidResolutionTransitionError,
    ResolutionTimestampError,
    ResolutionVerificationRequiredError,
)

_ALLOWED_NON_TERMINAL_TRANSITIONS = {
    ResolutionState.CREATED: frozenset(
        {
            ResolutionState.CITIZEN_ACTION_REQUIRED,
            ResolutionState.EXTERNAL_ACTION_REQUIRED,
        }
    ),
    ResolutionState.CITIZEN_ACTION_REQUIRED: frozenset(
        {ResolutionState.WAITING_FOR_UPDATE}
    ),
    ResolutionState.EXTERNAL_ACTION_REQUIRED: frozenset(
        {ResolutionState.WAITING_FOR_UPDATE}
    ),
    ResolutionState.WAITING_FOR_UPDATE: frozenset(
        {ResolutionState.RECHECKING}
    ),
    ResolutionState.STILL_BLOCKED: frozenset(
        {ResolutionState.CITIZEN_ACTION_REQUIRED}
    ),
}
_VERIFICATION_STATES = frozenset(
    {ResolutionState.RESOLVED, ResolutionState.STILL_BLOCKED}
)


def _validate_timestamp(instance: ResolutionInstance, at: datetime) -> None:
    if at.tzinfo is None or at.utcoffset() is None:
        raise ResolutionTimestampError("transition timestamp must be timezone-aware")
    if at < instance.updated_at:
        raise ResolutionTimestampError(
            "transition timestamp cannot precede instance history"
        )


def transition(
    instance: ResolutionInstance,
    target_state: ResolutionState,
    *,
    at: datetime,
) -> ResolutionInstance:
    """Apply an allowed non-terminal transition to an immutable instance."""

    if not isinstance(target_state, ResolutionState):
        raise InvalidResolutionTransitionError(str(target_state))
    if target_state in _VERIFICATION_STATES:
        raise ResolutionVerificationRequiredError(target_state.value)
    allowed = _ALLOWED_NON_TERMINAL_TRANSITIONS.get(
        instance.state,
        frozenset(),
    )
    if target_state not in allowed:
        raise InvalidResolutionTransitionError(
            f"{instance.state.value} -> {target_state.value}"
        )
    _validate_timestamp(instance, at)
    return instance.model_copy(update={"state": target_state, "updated_at": at})


def _transition_after_verification(
    instance: ResolutionInstance,
    verification: ResolutionVerificationResult,
    *,
    at: datetime,
) -> ResolutionInstance:
    """Apply the verifier-selected terminal state; not a public resolve API."""

    if instance.state is not ResolutionState.RECHECKING:
        raise InvalidResolutionTransitionError(
            f"{instance.state.value} is not ready for a verification outcome"
        )
    _validate_timestamp(instance, at)
    target_state = (
        ResolutionState.RESOLVED
        if verification.satisfied
        else ResolutionState.STILL_BLOCKED
    )
    return instance.model_copy(
        update={
            "state": target_state,
            "updated_at": at,
            "last_checked_citizen_state_version": (
                verification.citizen_state_version
            ),
            "last_verification_code": verification.code,
        }
    )
