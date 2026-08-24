"""Prerequisite graph and rule-result contracts without evaluation logic."""

from pydantic import BaseModel, ConfigDict, Field, JsonValue

from .enums import DecisionState


class PrerequisiteNode(BaseModel):
    """A future prerequisite graph node described only by identifiers."""

    model_config = ConfigDict(
        extra="forbid",
        frozen=True,
        str_strip_whitespace=True,
    )

    node_id: str = Field(min_length=1)
    label: str = Field(min_length=1)
    children: tuple[str, ...] = ()
    rule_ids: tuple[str, ...] = ()


class RuleResult(BaseModel):
    """Canonical output contract for one future deterministic rule check.

    ``observed_value`` is optional and must contain only the minimum
    non-sensitive value needed for audit.
    """

    model_config = ConfigDict(
        extra="forbid",
        frozen=True,
        str_strip_whitespace=True,
    )

    rule_id: str = Field(min_length=1)
    state: DecisionState
    observed_value: JsonValue | None = None
    issue_code: str | None = None
    resolution_id: str | None = None
    source_id: str | None = Field(default=None, min_length=1)
    policy_version: str = Field(min_length=1)
