"""Local process health endpoint."""

from typing import Annotated

from fastapi import APIRouter, Depends

from app.api.dependencies import ApiSettings
from app.api.schemas.health import HealthResponse

router = APIRouter(tags=["health"])


def get_settings() -> ApiSettings:
    """Overridden at app composition time."""

    raise RuntimeError("settings dependency is not configured")


@router.get(
    "/health",
    response_model=HealthResponse,
    summary="Check the local API process",
)
def health(
    settings: Annotated[ApiSettings, Depends(get_settings)],
) -> HealthResponse:
    return HealthResponse(
        status="ok",
        service="claimsaathi-api",
        environment=settings.environment,
    )
