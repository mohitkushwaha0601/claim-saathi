"""Application composition and FastAPI dependency accessors."""

import os
from dataclasses import dataclass
from pathlib import Path

from fastapi import Request

from app.application import (
    DemoService,
    ExecutionTraceService,
    JourneyService,
    PolicyService,
    ResolutionService,
)
from app.domain import CapabilityValue
from app.infrastructure import (
    DemoAuthoritativeCapabilityProvider,
    DemoCitizenStateProvider,
    InMemoryJourneyStore,
)
from app.journeys import (
    JourneyOrchestrator,
    JourneyPlanner,
    load_journey_catalog,
)
from app.policies import load_policy_registry
from app.resolutions import ResolutionNavigator, load_resolution_catalog

BACKEND_ROOT = Path(__file__).resolve().parents[2]
REPOSITORY_ROOT = BACKEND_ROOT.parent


@dataclass(frozen=True)
class ApiSettings:
    """Minimal environment settings; this prototype has no secrets."""

    environment: str
    allowed_origins: tuple[str, ...]


@dataclass(frozen=True)
class ApplicationContainer:
    """Single process-local composition root for API services."""

    demo_service: DemoService
    execution_trace_service: ExecutionTraceService
    journey_service: JourneyService
    resolution_service: ResolutionService
    policy_service: PolicyService


def load_settings() -> ApiSettings:
    origins_text = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000")
    origins = tuple(
        origin.strip()
        for origin in origins_text.split(",")
        if origin.strip()
    )
    if "*" in origins:
        raise ValueError("wildcard CORS origins are not permitted")
    return ApiSettings(
        environment=os.getenv("APP_ENV", "development"),
        allowed_origins=origins,
    )


def create_application_container(
    *,
    transfer_route_capability: CapabilityValue = CapabilityValue.AVAILABLE,
) -> ApplicationContainer:
    """Build local reviewed registries and process-local demo services."""

    policy_directory = REPOSITORY_ROOT / "policies" / "epfo"
    journey_directory = REPOSITORY_ROOT / "journeys" / "epfo"
    resolution_directory = REPOSITORY_ROOT / "resolutions" / "epfo"
    fixture_directory = REPOSITORY_ROOT / "fixtures" / "demo"

    policy_registry = load_policy_registry(policy_directory)
    journey_catalog = load_journey_catalog(
        journey_directory,
        policy_registry,
    )
    resolution_catalog = load_resolution_catalog(
        resolution_directory,
        policy_directory / "sources.json",
    )
    resolution_navigator = ResolutionNavigator(resolution_catalog)
    journey_orchestrator = JourneyOrchestrator(
        journey_catalog,
        policy_registry,
        resolution_navigator,
    )
    state_provider = DemoCitizenStateProvider(fixture_directory)
    capability_provider = DemoAuthoritativeCapabilityProvider(
        transfer_route_capability
    )
    store = InMemoryJourneyStore()

    journey_service = JourneyService(
        catalog=journey_catalog,
        planner=JourneyPlanner(journey_catalog),
        orchestrator=journey_orchestrator,
        state_provider=state_provider,
        capability_provider=capability_provider,
        store=store,
    )
    return ApplicationContainer(
        demo_service=DemoService(state_provider, store),
        execution_trace_service=ExecutionTraceService(
            catalog=journey_catalog,
            store=store,
        ),
        journey_service=journey_service,
        resolution_service=ResolutionService(
            orchestrator=journey_orchestrator,
            navigator=resolution_navigator,
            store=store,
        ),
        policy_service=PolicyService(policy_registry.source_registry),
    )


def get_container(request: Request) -> ApplicationContainer:
    return request.app.state.container


def get_demo_service(request: Request) -> DemoService:
    return get_container(request).demo_service


def get_execution_trace_service(request: Request) -> ExecutionTraceService:
    return get_container(request).execution_trace_service


def get_journey_service(request: Request) -> JourneyService:
    return get_container(request).journey_service


def get_resolution_service(request: Request) -> ResolutionService:
    return get_container(request).resolution_service


def get_policy_service(request: Request) -> PolicyService:
    return get_container(request).policy_service
