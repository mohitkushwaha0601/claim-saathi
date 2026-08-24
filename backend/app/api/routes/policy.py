"""Read-only reviewed policy-source metadata route."""

from typing import Annotated

from fastapi import APIRouter, Depends

from app.api.dependencies import get_policy_service
from app.api.schemas.policy import PolicySourceResponse
from app.application import PolicyService

router = APIRouter(prefix="/policy", tags=["policy"])


@router.get(
    "/sources/{source_id}",
    response_model=PolicySourceResponse,
    summary="Read reviewed source metadata without fetching its URL",
)
def get_policy_source(
    source_id: str,
    service: Annotated[PolicyService, Depends(get_policy_service)],
) -> PolicySourceResponse:
    return PolicySourceResponse.from_source(service.get_source(source_id))
