"""Shared local-only fixtures for deterministic policy tests."""

import json
from collections.abc import Callable
from pathlib import Path
from typing import Any

import pytest

from app.domain import CitizenIntent, CitizenState
from app.policies import PolicyEngine, PolicyRegistry, load_policy_registry

REPOSITORY_ROOT = Path(__file__).resolve().parents[4]
POLICY_DIRECTORY = REPOSITORY_ROOT / "policies" / "epfo"
DEMO_DIRECTORY = REPOSITORY_ROOT / "fixtures" / "demo"


@pytest.fixture(scope="session")
def policy_registry() -> PolicyRegistry:
    return load_policy_registry(POLICY_DIRECTORY)


@pytest.fixture(scope="session")
def policy_engine(policy_registry: PolicyRegistry) -> PolicyEngine:
    return PolicyEngine(policy_registry)


@pytest.fixture
def load_demo() -> Callable[[str], tuple[CitizenIntent, CitizenState]]:
    def _load(name: str) -> tuple[CitizenIntent, CitizenState]:
        payload: dict[str, Any] = json.loads(
            (DEMO_DIRECTORY / name).read_text(encoding="utf-8")
        )
        return (
            CitizenIntent.model_validate(payload["intent"]),
            CitizenState.model_validate(payload["citizen_state"]),
        )

    return _load
