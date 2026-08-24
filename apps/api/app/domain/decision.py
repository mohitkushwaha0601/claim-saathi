"""Canonical deterministic decision and audit-record contracts."""

from typing import Annotated, Literal

from pydantic import AwareDatetime, BaseModel, ConfigDict, Field

from .enums import DecisionState, JourneyId
from .prerequisite import PrerequisiteGraphEvaluation, RuleResult

NonNegativeRevision = Annotated[int, Field(ge=0, strict=True)]
PositiveVersion = Annotated[int, Field(ge=1, strict=True)]


class EvaluationContext(BaseModel):
    """Caller-supplied identifiers and time for deterministic evaluation."""

    model_config = ConfigDict(
        extra="forbid",
        frozen=True,
        str_strip_whitespace=True,
    )

    decision_id: str = Field(min_length=1)
    evaluated_at: AwareDatetime


class IssueResolutionLink(BaseModel):
    """Deterministic association already emitted by one non-pass rule."""

    model_config = ConfigDict(
        extra="forbid",
        frozen=True,
        str_strip_whitespace=True,
    )

    issue_code: str = Field(min_length=1)
    resolution_id: str = Field(min_length=1)


class JourneyDecision(BaseModel):
    """Configured prerequisite result, not an authoritative outcome."""

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
    issue_resolution_links: tuple[IssueResolutionLink, ...] = ()
    policy_version: str = Field(min_length=1)
    graph_version: str = Field(min_length=1)
    journey_definition_version: PositiveVersion
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
    citizen_state_revision: NonNegativeRevision
    policy_version: str = Field(min_length=1)
    graph_version: str = Field(min_length=1)
    journey_definition_version: PositiveVersion
    evaluated_at: AwareDatetime
    journey_id: JourneyId
    journey_state: DecisionState
    rule_results: tuple[RuleResult, ...]
    issue_codes: tuple[str, ...] = ()
    source_ids: tuple[str, ...]
    ai_used_for_decision: Literal[False] = False


class JourneyEvaluationResult(BaseModel):
    """Complete immutable output of one full journey evaluation."""

    model_config = ConfigDict(extra="forbid", frozen=True)

    graph_evaluation: PrerequisiteGraphEvaluation
    journey_decision: JourneyDecision
    decision_record: DecisionRecord
