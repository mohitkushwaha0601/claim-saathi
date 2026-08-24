"""Versioned policy metadata contracts without policy evaluation."""

from datetime import date

from pydantic import AwareDatetime, BaseModel, ConfigDict, Field, HttpUrl, JsonValue

from .enums import (
    DecisionState,
    JourneyId,
    PolicyLifecycleStatus,
    PolicyOperator,
    PolicyRuleType,
)


class PolicySource(BaseModel):
    """Source provenance for a future verified government policy."""

    model_config = ConfigDict(
        extra="forbid",
        frozen=True,
        str_strip_whitespace=True,
    )

    source_id: str = Field(min_length=1)
    authority: str = Field(min_length=1)
    title: str = Field(min_length=1)
    document_type: str = Field(min_length=1)
    published_at: date | None = None
    effective_from: date | None = None
    effective_to: date | None = None
    reference_url: HttpUrl | None = None
    verified_at: AwareDatetime | None = None
    status: PolicyLifecycleStatus


class PolicyRule(BaseModel):
    """Declarative rule data for a future deterministic policy engine."""

    model_config = ConfigDict(
        extra="forbid",
        frozen=True,
        str_strip_whitespace=True,
    )

    rule_id: str = Field(min_length=1)
    version: str = Field(min_length=1)
    journeys: tuple[JourneyId, ...]
    rule_type: PolicyRuleType
    input_path: str = Field(min_length=1)
    operator: PolicyOperator
    expected: JsonValue
    pass_state: DecisionState
    failure_state: DecisionState
    issue_code: str = Field(min_length=1)
    resolution_id: str | None = None
    source_id: str = Field(min_length=1)
    effective_from: date | None = None
    effective_to: date | None = None
    status: PolicyLifecycleStatus
