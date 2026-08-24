"""Shared deterministic Phase 5 test harness over local reviewed config."""

import json
from collections.abc import Mapping
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

import pytest

from app.domain import (
    CapabilityValue,
    CitizenIntent,
    CitizenState,
    DecisionRecord,
    EvaluationContext,
    JourneyEvaluationResult,
    JourneyInstance,
)
from app.journeys import (
    JourneyOrchestrator,
    JourneyPlanner,
    load_journey_catalog,
)
from app.policies import load_policy_registry
from app.resolutions import ResolutionNavigator, load_resolution_catalog

REPOSITORY_ROOT = Path(__file__).resolve().parents[4]
POLICY_DIRECTORY = REPOSITORY_ROOT / "policies" / "epfo"
JOURNEY_DIRECTORY = REPOSITORY_ROOT / "journeys" / "epfo"
RESOLUTION_DIRECTORY = REPOSITORY_ROOT / "resolutions" / "epfo"
DEMO_DIRECTORY = REPOSITORY_ROOT / "fixtures" / "demo"
EVALUATED_AT = datetime(2026, 8, 24, 12, 0, tzinfo=UTC)


class JourneyHarness:
    """Convenience wrapper that still exercises public production services."""

    def __init__(self) -> None:
        policy_registry = load_policy_registry(POLICY_DIRECTORY)
        self.catalog = load_journey_catalog(
            JOURNEY_DIRECTORY,
            policy_registry,
        )
        self.planner = JourneyPlanner(self.catalog)
        resolution_catalog = load_resolution_catalog(
            RESOLUTION_DIRECTORY,
            POLICY_DIRECTORY / "sources.json",
        )
        self.resolution_navigator = ResolutionNavigator(resolution_catalog)
        self.orchestrator = JourneyOrchestrator(
            self.catalog,
            policy_registry,
            self.resolution_navigator,
        )

    @staticmethod
    def load_demo(name: str) -> tuple[CitizenIntent, CitizenState]:
        payload: dict[str, Any] = json.loads(
            (DEMO_DIRECTORY / name).read_text(encoding="utf-8")
        )
        return (
            CitizenIntent.model_validate(payload["intent"]),
            CitizenState.model_validate(payload["citizen_state"]),
        )

    def create_instance(
        self,
        intent: CitizenIntent,
        state: CitizenState,
        *,
        suffix: str,
    ) -> JourneyInstance:
        return self.planner.create_instance(
            intent,
            citizen_id=state.citizen_id,
            journey_instance_id=f"SYNTH-JOURNEY-{suffix}",
            created_at=EVALUATED_AT,
        )

    def evaluate(
        self,
        instance: JourneyInstance,
        intent: CitizenIntent,
        state: CitizenState,
        *,
        decision_id: str,
        capabilities: Mapping[str, CapabilityValue] | None = None,
        previous: DecisionRecord | None = None,
        evaluated_at: datetime = EVALUATED_AT,
    ) -> JourneyEvaluationResult:
        definition = self.catalog.get_by_journey(instance.journey_id)
        return self.orchestrator.evaluate(
            journey_instance=instance,
            citizen_intent=intent,
            citizen_state=state,
            policy_version=definition.policy_version,
            graph_version=definition.prerequisite_graph_version,
            capability_results=capabilities,
            evaluation_context=EvaluationContext(
                decision_id=decision_id,
                evaluated_at=evaluated_at,
            ),
            previous_decision_record=previous,
        )

    @staticmethod
    def replace_section(
        state: CitizenState,
        section: str,
        **updates: object,
    ) -> CitizenState:
        payload = state.model_dump(mode="json")
        payload[section].update(updates)
        return CitizenState.model_validate(payload)

    @staticmethod
    def revised_state(
        state: CitizenState,
        *,
        state_version: str,
        state_revision: int,
        previous_exit_date: str | None = None,
        current_exit_date: str | None = None,
    ) -> CitizenState:
        payload = state.model_dump(mode="json")
        payload["state_version"] = state_version
        payload["state_revision"] = state_revision
        for record in payload["employment"]["records"]:
            if record["employment_type"] == "PREVIOUS" and previous_exit_date:
                record["exit_date"] = previous_exit_date
                record["exit_record_status"] = "RECORDED"
            if record["employment_type"] == "CURRENT" and current_exit_date:
                record["exit_date"] = current_exit_date
                record["exit_record_status"] = "RECORDED"
        return CitizenState.model_validate(payload)


@pytest.fixture
def harness() -> JourneyHarness:
    return JourneyHarness()

