"""Government journey configuration and instance contracts."""

from typing import Annotated

from pydantic import AwareDatetime, BaseModel, ConfigDict, Field

from .enums import IntentGoal, JourneyDefinitionStatus, JourneyId

VersionNumber = Annotated[int, Field(ge=1, strict=True)]


class JourneyDefinition(BaseModel):
    """Configuration metadata only; this model executes no policy."""

    model_config = ConfigDict(
        extra="forbid",
        frozen=True,
        str_strip_whitespace=True,
    )

    journey_id: JourneyId
    version: VersionNumber
    catalog_version: VersionNumber
    status: JourneyDefinitionStatus
    display_name: str = Field(min_length=1)
    citizen_goal: IntentGoal
    official_process_label: str = Field(min_length=1)
    official_process_source_id: str = Field(min_length=1)
    policy_id: str = Field(min_length=1)
    policy_version: str = Field(min_length=1)
    prerequisite_graph_file: str = Field(min_length=1)
    prerequisite_graph_version: str = Field(min_length=1)
    prerequisite_root: str = Field(min_length=1)
    policy_rule_ids: tuple[str, ...]
    resolution_ids: tuple[str, ...] = ()


class JourneyCatalogDefinition(BaseModel):
    """Immutable reviewed collection of intent-to-journey mappings."""

    model_config = ConfigDict(
        extra="forbid",
        frozen=True,
        str_strip_whitespace=True,
    )

    catalog_id: str = Field(min_length=1)
    version: VersionNumber
    status: JourneyDefinitionStatus
    journeys: tuple[JourneyDefinition, ...]


class JourneyInstance(BaseModel):
    """A citizen starting a ClaimSaathi journey; this is not a claim."""

    model_config = ConfigDict(
        extra="forbid",
        frozen=True,
        str_strip_whitespace=True,
    )

    journey_instance_id: str = Field(min_length=1)
    citizen_id: str = Field(min_length=1)
    citizen_goal: IntentGoal
    journey_id: JourneyId
    journey_definition_version: VersionNumber
    created_at: AwareDatetime
    official_process_label: str = Field(min_length=1)
