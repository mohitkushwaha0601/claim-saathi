"""Approved resolution workflow and instance contracts."""

from typing import Annotated

from pydantic import (
    AwareDatetime,
    BaseModel,
    ConfigDict,
    Field,
    model_validator,
)

from .enums import (
    ResolutionActor,
    ResolutionState,
    ResolutionStepType,
    ResolutionSuccessVerifier,
    ResolutionVerificationCode,
    ResolutionWorkflowStatus,
)

WorkflowVersion = Annotated[int, Field(ge=1, strict=True)]


class ResolutionStep(BaseModel):
    """One immutable, pre-approved workflow step."""

    model_config = ConfigDict(
        extra="forbid",
        frozen=True,
        str_strip_whitespace=True,
    )

    step_id: str = Field(min_length=1)
    step_type: ResolutionStepType
    title: str = Field(min_length=1)
    canonical_guidance: str = Field(min_length=1)
    official_route: tuple[str, ...] = ()

    @model_validator(mode="after")
    def validate_route_shape(self) -> "ResolutionStep":
        if (
            self.step_type is ResolutionStepType.EXTERNAL_ACTION
            and not self.official_route
        ):
            raise ValueError("external-action steps require an official route")
        if (
            self.step_type is not ResolutionStepType.EXTERNAL_ACTION
            and self.official_route
        ):
            raise ValueError(
                "only external-action steps may define an official route"
            )
        return self


class ResolutionWorkflow(BaseModel):
    """Predefined resolution data; steps are never generated at runtime."""

    model_config = ConfigDict(
        extra="forbid",
        frozen=True,
        str_strip_whitespace=True,
    )

    resolution_id: str = Field(min_length=1)
    version: WorkflowVersion
    issue_code: str = Field(min_length=1)
    title: str = Field(min_length=1)
    actor: ResolutionActor
    status: ResolutionWorkflowStatus
    approved_steps: tuple[ResolutionStep, ...]
    official_source_ids: tuple[str, ...]
    success_condition: str = Field(min_length=1)
    success_verifier: ResolutionSuccessVerifier


class ResolutionVerificationResult(BaseModel):
    """Typed outcome of checking a workflow against trusted citizen state."""

    model_config = ConfigDict(
        extra="forbid",
        frozen=True,
        str_strip_whitespace=True,
    )

    satisfied: bool
    code: ResolutionVerificationCode
    citizen_state_version: str = Field(min_length=1)

    @model_validator(mode="after")
    def validate_code_matches_outcome(self) -> "ResolutionVerificationResult":
        success_code = ResolutionVerificationCode.SUCCESS_CONDITION_SATISFIED
        if self.satisfied != (self.code is success_code):
            raise ValueError("verification code does not match its outcome")
        return self


class ResolutionInstance(BaseModel):
    """Immutable state of one active resolution for a citizen journey."""

    model_config = ConfigDict(
        extra="forbid",
        frozen=True,
        str_strip_whitespace=True,
    )

    resolution_instance_id: str = Field(min_length=1)
    journey_instance_id: str = Field(min_length=1)
    resolution_id: str = Field(min_length=1)
    issue_code: str = Field(min_length=1)
    state: ResolutionState
    created_at: AwareDatetime
    updated_at: AwareDatetime
    workflow_version: WorkflowVersion
    last_checked_citizen_state_version: str | None = Field(
        default=None,
        min_length=1,
    )
    last_verification_code: ResolutionVerificationCode | None = None

    @model_validator(mode="after")
    def validate_audit_shape(self) -> "ResolutionInstance":
        if self.updated_at < self.created_at:
            raise ValueError("updated_at cannot precede created_at")
        has_version = self.last_checked_citizen_state_version is not None
        has_code = self.last_verification_code is not None
        if has_version != has_code:
            raise ValueError(
                "last checked version and verification code must appear together"
            )
        return self


__all__ = [
    "ResolutionInstance",
    "ResolutionState",
    "ResolutionStep",
    "ResolutionVerificationResult",
    "ResolutionWorkflow",
]
