"""Thin journey creation, evaluation, and audit-read routes."""

from typing import Annotated

from fastapi import APIRouter, Depends, status

from app.api.dependencies import get_journey_service
from app.api.schemas.journey import (
    CreateJourneyRequest,
    DecisionDetailResponse,
    DecisionHistoryResponse,
    DecisionSummaryResponse,
    JourneyCreatedResponse,
    JourneyEvaluationResponse,
    JourneyResponse,
)
from app.application import JourneyService

router = APIRouter(prefix="/journeys", tags=["journeys"])


@router.post(
    "",
    response_model=JourneyCreatedResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create an isolated synthetic journey",
)
def create_journey(
    request: CreateJourneyRequest,
    service: Annotated[JourneyService, Depends(get_journey_service)],
) -> JourneyCreatedResponse:
    return JourneyCreatedResponse.from_view(
        service.create_journey(
            persona_id=request.persona_id,
            goal=request.goal,
            requested_amount_rupees=request.requested_amount_rupees,
        )
    )


@router.post(
    "/{journey_instance_id}/evaluate",
    response_model=JourneyEvaluationResponse,
    summary="Run a new full deterministic journey evaluation",
)
def evaluate_journey(
    journey_instance_id: str,
    service: Annotated[JourneyService, Depends(get_journey_service)],
) -> JourneyEvaluationResponse:
    return JourneyEvaluationResponse.from_view(
        service.evaluate_journey(journey_instance_id)
    )


@router.get(
    "/{journey_instance_id}",
    response_model=JourneyResponse,
    summary="Read a journey without triggering evaluation",
)
def get_journey(
    journey_instance_id: str,
    service: Annotated[JourneyService, Depends(get_journey_service)],
) -> JourneyResponse:
    return JourneyResponse.from_view(service.get_journey(journey_instance_id))


@router.get(
    "/{journey_instance_id}/decisions",
    response_model=DecisionHistoryResponse,
    summary="List immutable journey decision history",
)
def list_decisions(
    journey_instance_id: str,
    service: Annotated[JourneyService, Depends(get_journey_service)],
) -> DecisionHistoryResponse:
    views = service.decision_history(journey_instance_id)
    return DecisionHistoryResponse(
        journey_instance_id=journey_instance_id,
        decisions=tuple(
            DecisionSummaryResponse.from_view(view) for view in views
        ),
    )


@router.get(
    "/{journey_instance_id}/decisions/{decision_id}",
    response_model=DecisionDetailResponse,
    summary="Inspect one safe deterministic decision record",
)
def get_decision(
    journey_instance_id: str,
    decision_id: str,
    service: Annotated[JourneyService, Depends(get_journey_service)],
) -> DecisionDetailResponse:
    return DecisionDetailResponse.from_view(
        service.decision_detail(journey_instance_id, decision_id)
    )
