"""Canonical deterministic decision and audit-record contracts."""

from typing import Literal

from pydantic import AwareDatetime, BaseModel, ConfigDict, Field

from .enums import DecisionState, JourneyId
from .prerequisite import RuleResult


class JourneyDecision(BaseModel):
    """Canonical result returned by a future deterministic journey engine."""

    model_config = ConfigDict(
        extra="forbid",
        frozen=True,
        str_strip_whitespace=True,
    )

    journey_id: JourneyId
    state: DecisionState
    blocking_node_ids: tuple[str, ...] = ()
    issue_codes: tuple[str, ...] = ()
    resolution_ids: tuple[str, ...] = ()
    policy_version: str = Field(min_length=1)
    decision_id: str = Field(min_length=1)


class DecisionRecord(BaseModel):
    """Reproducible audit record for a future deterministic evaluation."""

    model_config = ConfigDict(
        extra="forbid",
        frozen=True,
        str_strip_whitespace=True,
    )

    decision_id: str = Field(min_length=1)
    journey_instance_id: str = Field(min_length=1)
    citizen_state_version: str = Field(min_length=1)
    policy_version: str = Field(min_length=1)
    evaluated_at: AwareDatetime
    journey_id: JourneyId
    journey_state: DecisionState
    rule_results: tuple[RuleResult, ...]
    issue_codes: tuple[str, ...] = ()
    source_ids: tuple[str, ...]
    ai_used_for_decision: Literal[False] = False
