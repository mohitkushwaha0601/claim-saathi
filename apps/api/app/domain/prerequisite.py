"""Prerequisite graph and rule-result contracts without evaluation logic."""

from pydantic import BaseModel, ConfigDict, Field, JsonValue

from .enums import DecisionState, JourneyId, PrerequisiteAggregation


class PrerequisiteNode(BaseModel):
    """A prerequisite leaf or group described only by identifiers."""

    model_config = ConfigDict(
        extra="forbid",
        frozen=True,
        str_strip_whitespace=True,
    )

    node_id: str = Field(min_length=1)
    label: str = Field(min_length=1)
    children: tuple[str, ...] = ()
    rule_ids: tuple[str, ...] = ()
    aggregation: PrerequisiteAggregation | None = None


class PrerequisiteGraphDefinition(BaseModel):
    """Immutable configuration contract for one journey prerequisite graph."""

    model_config = ConfigDict(
        extra="forbid",
        frozen=True,
        str_strip_whitespace=True,
    )

    journey_id: JourneyId
    graph_version: str = Field(min_length=1)
    root_node_id: str = Field(min_length=1)
    nodes: tuple[PrerequisiteNode, ...]


class PrerequisiteNodeResult(BaseModel):
    """State of one evaluated node without copying observed citizen values."""

    model_config = ConfigDict(
        extra="forbid",
        frozen=True,
        str_strip_whitespace=True,
    )

    node_id: str = Field(min_length=1)
    state: DecisionState
    child_node_ids: tuple[str, ...] = ()
    rule_id: str | None = Field(default=None, min_length=1)


class PrerequisiteGraphEvaluation(BaseModel):
    """Complete deterministic evaluation of a prerequisite graph."""

    model_config = ConfigDict(
        extra="forbid",
        frozen=True,
        str_strip_whitespace=True,
    )

    journey_id: JourneyId
    graph_version: str = Field(min_length=1)
    root_node_id: str = Field(min_length=1)
    root_state: DecisionState
    node_results: tuple[PrerequisiteNodeResult, ...]
    non_pass_leaf_node_ids: tuple[str, ...] = ()


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
