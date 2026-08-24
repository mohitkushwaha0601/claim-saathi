"""Allowlisted resolution success checks over trusted CitizenState facts."""

from collections.abc import Callable

from app.domain import (
    CitizenState,
    EmploymentRecordType,
    ResolutionSuccessVerifier,
    ResolutionVerificationCode,
    ResolutionVerificationResult,
    ResolutionWorkflow,
)

from .exceptions import UnsupportedSuccessVerifierError


def _verify_previous_employment_exit_date(
    citizen_state: CitizenState,
) -> ResolutionVerificationResult:
    previous_records = tuple(
        record
        for record in citizen_state.employment.records
        if record.employment_type is EmploymentRecordType.PREVIOUS
    )
    if len(previous_records) != 1:
        return ResolutionVerificationResult(
            satisfied=False,
            code=(
                ResolutionVerificationCode.PREVIOUS_EMPLOYMENT_RECORD_NOT_UNIQUE
            ),
            citizen_state_version=citizen_state.state_version,
        )
    if previous_records[0].exit_date is None:
        return ResolutionVerificationResult(
            satisfied=False,
            code=ResolutionVerificationCode.EXIT_DATE_STILL_MISSING,
            citizen_state_version=citizen_state.state_version,
        )
    return ResolutionVerificationResult(
        satisfied=True,
        code=ResolutionVerificationCode.SUCCESS_CONDITION_SATISFIED,
        citizen_state_version=citizen_state.state_version,
    )


_VERIFIERS: dict[
    ResolutionSuccessVerifier,
    Callable[[CitizenState], ResolutionVerificationResult],
] = {
    ResolutionSuccessVerifier.PREVIOUS_EMPLOYMENT_EXIT_DATE_PRESENT: (
        _verify_previous_employment_exit_date
    ),
}


def verify_resolution_success(
    workflow: ResolutionWorkflow,
    citizen_state: CitizenState,
) -> ResolutionVerificationResult:
    """Run exactly one allowlisted verifier; workflow prose is never executed."""

    try:
        verifier = _VERIFIERS[workflow.success_verifier]
    except KeyError as error:
        raise UnsupportedSuccessVerifierError(
            str(workflow.success_verifier)
        ) from error
    return verifier(citizen_state)
