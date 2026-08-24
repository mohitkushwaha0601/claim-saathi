"""Thin routes for approved purpose-specific resolution commands."""

from typing import Annotated

from fastapi import APIRouter, Depends, status

from app.api.dependencies import get_resolution_service
from app.api.schemas.resolution import (
    ResolutionResponse,
    StartResolutionRequest,
)
from app.application import ResolutionService

router = APIRouter(prefix="/journeys", tags=["resolutions"])


@router.post(
    "/{journey_instance_id}/resolutions",
    response_model=ResolutionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Start the approved resolution attached to a current issue",
)
def start_resolution(
    journey_instance_id: str,
    request: StartResolutionRequest,
    service: Annotated[ResolutionService, Depends(get_resolution_service)],
) -> ResolutionResponse:
    return ResolutionResponse.from_view(
        service.start_resolution(
            journey_instance_id=journey_instance_id,
            decision_id=request.decision_id,
            issue_code=request.issue_code,
        )
    )


@router.post(
    "/{journey_instance_id}/resolutions/{resolution_instance_id}/confirm-external-step-started",
    response_model=ResolutionResponse,
    summary="Record that approved external guidance was reviewed or started",
)
def confirm_external_step_started(
    journey_instance_id: str,
    resolution_instance_id: str,
    service: Annotated[ResolutionService, Depends(get_resolution_service)],
) -> ResolutionResponse:
    return ResolutionResponse.from_view(
        service.confirm_external_step_started(
            journey_instance_id=journey_instance_id,
            resolution_instance_id=resolution_instance_id,
        )
    )


@router.post(
    "/{journey_instance_id}/resolutions/{resolution_instance_id}/recheck",
    response_model=ResolutionResponse,
    summary="Verify resolution success from current trusted synthetic state",
)
def recheck_resolution(
    journey_instance_id: str,
    resolution_instance_id: str,
    service: Annotated[ResolutionService, Depends(get_resolution_service)],
) -> ResolutionResponse:
    return ResolutionResponse.from_view(
        service.recheck_resolution(
            journey_instance_id=journey_instance_id,
            resolution_instance_id=resolution_instance_id,
        )
    )


@router.get(
    "/{journey_instance_id}/resolutions/{resolution_instance_id}",
    response_model=ResolutionResponse,
    summary="Read resolution state and approved guidance without side effects",
)
def get_resolution(
    journey_instance_id: str,
    resolution_instance_id: str,
    service: Annotated[ResolutionService, Depends(get_resolution_service)],
) -> ResolutionResponse:
    return ResolutionResponse.from_view(
        service.get_resolution(
            journey_instance_id=journey_instance_id,
            resolution_instance_id=resolution_instance_id,
        )
    )
