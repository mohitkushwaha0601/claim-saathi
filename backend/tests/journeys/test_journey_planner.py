"""Exact citizen-goal planning and immutable journey-instance tests."""

from datetime import UTC, datetime
from pathlib import Path

import pytest
from pydantic import ValidationError

from app.domain import CitizenIntent, IntentGoal, JourneyId
from app.journeys import JourneyPlanner, load_journey_catalog
from app.policies import load_policy_registry

BACKEND_ROOT = Path(__file__).resolve().parents[2]
REPOSITORY_ROOT = BACKEND_ROOT.parent
JOURNEY_DIRECTORY = REPOSITORY_ROOT / "journeys" / "epfo"
POLICY_DIRECTORY = REPOSITORY_ROOT / "policies" / "epfo"
CREATED_AT = datetime(2026, 8, 24, 9, 0, tzinfo=UTC)


def planner() -> JourneyPlanner:
    registry = load_policy_registry(POLICY_DIRECTORY)
    return JourneyPlanner(load_journey_catalog(JOURNEY_DIRECTORY, registry))


@pytest.mark.parametrize(
    ("goal", "journey_id", "process_label"),
    [
        (
            IntentGoal.ACCESS_SOME_PF_FUNDS,
            JourneyId.PF_PARTIAL_WITHDRAWAL,
            "Form 31",
        ),
        (
            IntentGoal.TRANSFER_PF_AFTER_EMPLOYMENT_CHANGE,
            JourneyId.PF_TRANSFER,
            "Form 13",
        ),
        (
            IntentGoal.FINAL_PF_SETTLEMENT,
            JourneyId.PF_FINAL_SETTLEMENT,
            "Form 19",
        ),
    ],
)
def test_typed_goal_maps_to_exact_reviewed_journey(
    goal: IntentGoal,
    journey_id: JourneyId,
    process_label: str,
) -> None:
    definition = planner().plan(CitizenIntent(goal=goal))

    assert definition.journey_id is journey_id
    assert definition.official_process_label == process_label


def test_planner_does_not_use_profile_context_to_change_journey() -> None:
    service = planner()
    first = CitizenIntent(
        goal=IntentGoal.ACCESS_SOME_PF_FUNDS,
        currently_employed=True,
        requested_amount_rupees=1,
    )
    second = CitizenIntent(
        goal=IntentGoal.ACCESS_SOME_PF_FUNDS,
        currently_employed=False,
        requested_amount_rupees=999_999,
    )

    assert service.plan(first) == service.plan(second)


def test_create_instance_uses_explicit_identity_and_time() -> None:
    intent = CitizenIntent(goal=IntentGoal.FINAL_PF_SETTLEMENT)

    instance = planner().create_instance(
        intent,
        citizen_id="SYNTH-CITIZEN-INSTANCE-001",
        journey_instance_id="SYNTH-JOURNEY-INSTANCE-001",
        created_at=CREATED_AT,
    )

    assert instance.journey_id is JourneyId.PF_FINAL_SETTLEMENT
    assert instance.journey_instance_id == "SYNTH-JOURNEY-INSTANCE-001"
    assert instance.created_at == CREATED_AT
    assert instance.official_process_label == "Form 19"
    assert "claim" not in type(instance).__name__.lower()


def test_journey_instance_is_immutable() -> None:
    instance = planner().create_instance(
        CitizenIntent(goal=IntentGoal.ACCESS_SOME_PF_FUNDS),
        citizen_id="SYNTH-CITIZEN-INSTANCE-002",
        journey_instance_id="SYNTH-JOURNEY-INSTANCE-002",
        created_at=CREATED_AT,
    )

    with pytest.raises(ValidationError):
        instance.citizen_id = "SYNTH-CHANGED"  # type: ignore[misc]
