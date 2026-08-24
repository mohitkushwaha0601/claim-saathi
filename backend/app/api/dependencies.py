"""Application composition and FastAPI dependency accessors."""

import os
from dataclasses import dataclass, field
from math import isfinite
from pathlib import Path

from fastapi import Request

from app.application import (
    DemoService,
    ExplanationProvider,
    ExplanationService,
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

def _resolve_repository_root(start_path: Path) -> Path:
    """Support repo root layouts in local dev and in deploy containers."""
    candidates = [start_path.resolve(), *start_path.resolve().parents]
    for candidate in candidates:
        if (
            (candidate / "policies").exists()
            and (candidate / "journeys").exists()
            and (candidate / "resolutions").exists()
            and (candidate / "fixtures").exists()
        ):
            return candidate
    if start_path.name == "backend":
        return start_path.parent
    if start_path.name == "app":
        return start_path.parent
    return start_path


BACKEND_ROOT = Path(__file__).resolve().parents[2]
REPOSITORY_ROOT = _resolve_repository_root(BACKEND_ROOT)


@dataclass(frozen=True)
class ApiSettings:
    """Central runtime settings; secret values are never returned by the API."""

    environment: str
    allowed_origins: tuple[str, ...]
    ai_enabled: bool = False
    openai_api_key: str | None = field(default=None, repr=False)
    ai_model: str = "gpt-5.6-luna"
    ai_timeout_seconds: float = 5.0


@dataclass(frozen=True)
class ApplicationContainer:
    """Single process-local composition root for API services."""

    demo_service: DemoService
    execution_trace_service: ExecutionTraceService
    journey_service: JourneyService
    resolution_service: ResolutionService
    policy_service: PolicyService
    explanation_service: ExplanationService


def _parse_bool_setting(name: str, default: bool) -> bool:
    raw_value = os.getenv(name)
    if raw_value is None:
        return default
    normalized = raw_value.strip().casefold()
    if normalized in {"true", "1", "yes", "on"}:
        return True
    if normalized in {"false", "0", "no", "off"}:
        return False
    raise ValueError(f"{name} must be a boolean value")


def load_settings() -> ApiSettings:
    origins_text = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000")
    origins = tuple(
        origin.strip()
        for origin in origins_text.split(",")
        if origin.strip()
    )
    if "*" in origins:
        raise ValueError("wildcard CORS origins are not permitted")
    timeout_seconds = float(
        os.getenv("AI_TIMEOUT_SECONDS", "5.0")
    )
    if not isfinite(timeout_seconds) or timeout_seconds <= 0:
        raise ValueError("AI_TIMEOUT_SECONDS must be positive")
    api_key = os.getenv("OPENAI_API_KEY")
    return ApiSettings(
        environment=os.getenv("APP_ENV", "development"),
        allowed_origins=origins,
        ai_enabled=_parse_bool_setting("AI_ENABLED", False),
        openai_api_key=api_key.strip() if api_key and api_key.strip() else None,
        ai_model=os.getenv("AI_MODEL", "gpt-5.6-luna").strip()
        or "gpt-5.6-luna",
        ai_timeout_seconds=timeout_seconds,
    )


def create_application_container(
    *,
    transfer_route_capability: CapabilityValue = CapabilityValue.AVAILABLE,
    settings: ApiSettings | None = None,
    explanation_provider: ExplanationProvider | None = None,
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
    active_settings = settings or load_settings()
    provider = explanation_provider
    if (
        provider is None
        and active_settings.ai_enabled
        and active_settings.openai_api_key is not None
    ):
        from app.infrastructure.integrations import OpenAIExplanationProvider

        provider = OpenAIExplanationProvider(
            api_key=active_settings.openai_api_key,
            model=active_settings.ai_model,
            timeout_seconds=active_settings.ai_timeout_seconds,
        )
    return ApplicationContainer(
        demo_service=DemoService(state_provider, store),
        execution_trace_service=ExecutionTraceService(
            catalog=journey_catalog,
            store=store,
        ),
        journey_service=journey_service,
        explanation_service=ExplanationService(
            journey_service=journey_service,
            provider=provider,
        ),
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


def get_explanation_service(request: Request) -> ExplanationService:
    return get_container(request).explanation_service


def get_journey_service(request: Request) -> JourneyService:
    return get_container(request).journey_service


def get_resolution_service(request: Request) -> ResolutionService:
    return get_container(request).resolution_service


def get_policy_service(request: Request) -> PolicyService:
    return get_container(request).policy_service
