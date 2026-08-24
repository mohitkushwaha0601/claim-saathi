"""ClaimSaathi Phase 6 FastAPI composition root."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.dependencies import (
    ApiSettings,
    ApplicationContainer,
    create_application_container,
    load_settings,
)
from app.api.errors import install_exception_handlers
from app.api.routes import demo, health, journeys, policy, resolutions


def create_app(
    *,
    container: ApplicationContainer | None = None,
    settings: ApiSettings | None = None,
) -> FastAPI:
    """Create an isolated API application, including process-local demo state."""

    active_settings = settings or load_settings()
    application = FastAPI(
        title="ClaimSaathi API",
        version="0.1.0-demo",
        description=(
            "Synthetic hackathon API over deterministic ClaimSaathi domain "
            "services. No real government action is performed."
        ),
    )

    @application.get("/")
    def root() -> dict[str, str]:
        return {
            "status": "ok",
            "service": "claimsaathi-api",
            "message": "Server is running.",
            "environment": active_settings.environment,
        }

    application.state.container = container or create_application_container()
    application.dependency_overrides[health.get_settings] = (
        lambda: active_settings
    )
    application.add_middleware(
        CORSMiddleware,
        allow_origins=list(active_settings.allowed_origins),
        allow_credentials=False,
        allow_methods=["GET", "POST"],
        allow_headers=["Content-Type"],
    )
    install_exception_handlers(application)
    application.include_router(health.router)
    application.include_router(demo.router, prefix="/api/v1")
    application.include_router(journeys.router, prefix="/api/v1")
    application.include_router(resolutions.router, prefix="/api/v1")
    application.include_router(policy.router, prefix="/api/v1")
    return application


app = create_app()
