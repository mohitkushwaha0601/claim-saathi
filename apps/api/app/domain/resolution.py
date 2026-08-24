"""Approved resolution workflow contracts without execution logic."""

from pydantic import BaseModel, ConfigDict, Field

from .enums import ResolutionActor, ResolutionState


class ResolutionWorkflow(BaseModel):
    """Predefined resolution data; steps are never generated at runtime."""

    model_config = ConfigDict(
        extra="forbid",
        frozen=True,
        str_strip_whitespace=True,
    )

    resolution_id: str = Field(min_length=1)
    issue_code: str = Field(min_length=1)
    title: str = Field(min_length=1)
    actor: ResolutionActor
    approved_steps: tuple[str, ...]
    official_source_ids: tuple[str, ...]
    success_condition: str = Field(min_length=1)


__all__ = ["ResolutionState", "ResolutionWorkflow"]
