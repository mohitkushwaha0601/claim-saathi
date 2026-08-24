"""Citizen intent contracts."""

from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field

from .enums import IntentGoal

NonNegativeRupees = Annotated[int, Field(ge=0, strict=True)]


class CitizenIntent(BaseModel):
    """What a citizen wants to achieve, independent of government forms."""

    model_config = ConfigDict(
        extra="forbid",
        frozen=True,
        str_strip_whitespace=True,
    )

    goal: IntentGoal
    currently_employed: bool | None = None
    requested_amount_rupees: NonNegativeRupees | None = None
