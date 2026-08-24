"""Shared safe API metadata and categorical display labels."""

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

from app.domain import DecisionState


class ApiModel(BaseModel):
    """Closed public contract base."""

    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)


class DemoMetadata(ApiModel):
    """Persistent warning that this runtime is synthetic and non-government."""

    environment: Literal["DEMO"] = "DEMO"
    synthetic_data: Literal[True] = True
    real_government_action_performed: Literal[False] = False


class OfficialProcessResponse(ApiModel):
    """Reviewed process-label metadata, not an outcome."""

    label: str = Field(min_length=1)
    source_id: str = Field(min_length=1)


class ErrorDetail(ApiModel):
    code: str = Field(min_length=1)
    message: str = Field(min_length=1)
    request_id: str | None = None


class ErrorEnvelope(ApiModel):
    error: ErrorDetail


_STATE_LABELS = {
    DecisionState.PASS: "Ready to proceed",
    DecisionState.ACTION_REQUIRED: "Action required",
    DecisionState.NOT_ELIGIBLE: "Not currently eligible",
    DecisionState.UNABLE_TO_VERIFY: "Unable to verify",
    DecisionState.NOT_APPLICABLE: "This journey does not currently apply",
    DecisionState.POLICY_REVIEW_REQUIRED: "Policy verification required",
}


def state_display_label(state: DecisionState) -> str:
    """Return the reviewed display label for an existing machine state."""

    return _STATE_LABELS[state]
