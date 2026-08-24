"""Government journey metadata contracts."""

from pydantic import BaseModel, ConfigDict, Field

from .enums import IntentGoal, JourneyId


class JourneyDefinition(BaseModel):
    """Configuration metadata only; this model executes no policy."""

    model_config = ConfigDict(
        extra="forbid",
        frozen=True,
        str_strip_whitespace=True,
    )

    journey_id: JourneyId
    display_name: str = Field(min_length=1)
    citizen_goal: IntentGoal
    official_process_label: str | None = None
    prerequisite_root: str = Field(min_length=1)
    policy_rule_ids: tuple[str, ...] = ()
    resolution_ids: tuple[str, ...] = ()
