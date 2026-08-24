"""Explicitly synthetic persona and event endpoints."""

from typing import Annotated

from fastapi import APIRouter, Depends

from app.api.dependencies import get_demo_service
from app.api.schemas.demo import (
    DemoEventResponse,
    DemoPersonaListResponse,
    DemoPersonaResponse,
)
from app.application import DemoService

router = APIRouter(prefix="/demo", tags=["demo"])


@router.get(
    "/personas",
    response_model=DemoPersonaListResponse,
    summary="List the three synthetic demo personas",
)
def list_personas(
    service: Annotated[DemoService, Depends(get_demo_service)],
) -> DemoPersonaListResponse:
    return DemoPersonaListResponse(
        personas=tuple(
            DemoPersonaResponse.from_persona(persona)
            for persona in service.list_personas()
        )
    )


@router.post(
    "/journeys/{journey_instance_id}/events/previous-exit-date-updated",
    response_model=DemoEventResponse,
    summary="Apply Priya's journey-local synthetic Date-of-Exit update",
)
def previous_exit_date_updated(
    journey_instance_id: str,
    service: Annotated[DemoService, Depends(get_demo_service)],
) -> DemoEventResponse:
    return DemoEventResponse.from_result(
        service.apply_previous_exit_date_updated(journey_instance_id)
    )
