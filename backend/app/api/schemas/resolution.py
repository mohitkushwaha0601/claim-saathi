"""Purpose-specific resolution request and approved workflow response."""

from datetime import datetime

from pydantic import Field

from app.application.resolution_service import ResolutionView
from app.domain import ResolutionState, ResolutionStepType

from .common import ApiModel, DemoMetadata


class StartResolutionRequest(ApiModel):
    decision_id: str = Field(min_length=1, max_length=128)
    issue_code: str = Field(
        min_length=1,
        max_length=128,
        pattern=r"^[A-Z0-9_]+$",
    )


class ApprovedResolutionStepResponse(ApiModel):
    step_id: str
    step_type: ResolutionStepType
    title: str
    canonical_guidance: str
    official_route: tuple[str, ...]


class ResolutionResponse(ApiModel):
    resolution_instance_id: str
    resolution_id: str
    issue_code: str
    state: ResolutionState
    title: str
    approved_steps: tuple[ApprovedResolutionStepResponse, ...]
    official_sources: tuple[str, ...]
    workflow_version: int
    created_at: datetime
    updated_at: datetime
    last_checked_citizen_state_version: str | None
    demo: DemoMetadata = DemoMetadata()

    @classmethod
    def from_view(cls, view: ResolutionView) -> "ResolutionResponse":
        instance = view.instance
        workflow = view.workflow
        return cls(
            resolution_instance_id=instance.resolution_instance_id,
            resolution_id=instance.resolution_id,
            issue_code=instance.issue_code,
            state=instance.state,
            title=workflow.title,
            approved_steps=tuple(
                ApprovedResolutionStepResponse(
                    step_id=step.step_id,
                    step_type=step.step_type,
                    title=step.title,
                    canonical_guidance=step.canonical_guidance,
                    official_route=step.official_route,
                )
                for step in workflow.approved_steps
            ),
            official_sources=workflow.official_source_ids,
            workflow_version=instance.workflow_version,
            created_at=instance.created_at,
            updated_at=instance.updated_at,
            last_checked_citizen_state_version=(
                instance.last_checked_citizen_state_version
            ),
        )
