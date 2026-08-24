"""Ravi, Priya, Arjun, and session-isolation API demonstrations."""

import ast
from collections.abc import Callable
from pathlib import Path

from fastapi.testclient import TestClient

from app.api.dependencies import (
    ApiSettings,
    create_application_container,
)
from app.domain import CapabilityValue
from app.main import create_app

REPOSITORY_ROOT = Path(__file__).resolve().parents[4]
ROUTE_DIRECTORY = REPOSITORY_ROOT / "apps" / "api" / "app" / "api" / "routes"


def test_ravi_complete_api_flow(
    client: TestClient,
    create_journey: Callable[..., dict],
) -> None:
    personas = client.get("/api/v1/demo/personas").json()["personas"]
    assert any(item["persona_id"] == "RAVI_PARTIAL_READY" for item in personas)
    journey = create_journey(
        "RAVI_PARTIAL_READY",
        "ACCESS_SOME_PF_FUNDS",
        80_000,
    )

    response = client.post(
        f"/api/v1/journeys/{journey['journey_instance_id']}/evaluate"
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["state"] == "PASS"
    assert payload["state_display"] == "Ready to proceed"
    assert payload["official_process"]["label"] == "Form 31"
    assert payload["issue_codes"] == []
    assert payload["resolution_ids"] == []
    assert payload["ai_used_for_decision"] is False
    assert payload["demo"]["synthetic_data"] is True
    assert payload["demo"]["real_government_action_performed"] is False


def test_priya_complete_resolution_and_re_evaluation_flow(
    client: TestClient,
    create_journey: Callable[..., dict],
) -> None:
    journey = create_journey(
        "PRIYA_TRANSFER_MISSING_EXIT",
        "TRANSFER_PF_AFTER_EMPLOYMENT_CHANGE",
    )
    journey_id = journey["journey_instance_id"]
    first = client.post(f"/api/v1/journeys/{journey_id}/evaluate").json()
    assert first["state"] == "ACTION_REQUIRED"
    assert first["issue_codes"] == ["EXIT_DATE_MISSING"]
    assert first["resolution_ids"] == ["RES_EXIT"]

    resolution = client.post(
        f"/api/v1/journeys/{journey_id}/resolutions",
        json={
            "decision_id": first["decision_id"],
            "issue_code": "EXIT_DATE_MISSING",
        },
    ).json()
    resolution_id = resolution["resolution_instance_id"]
    assert resolution["state"] == "CITIZEN_ACTION_REQUIRED"

    waiting_path = (
        f"/api/v1/journeys/{journey_id}/resolutions/{resolution_id}"
        "/confirm-external-step-started"
    )
    recheck_path = (
        f"/api/v1/journeys/{journey_id}/resolutions/{resolution_id}/recheck"
    )
    assert client.post(waiting_path).json()["state"] == "WAITING_FOR_UPDATE"
    assert client.post(recheck_path).json()["state"] == "STILL_BLOCKED"
    assert client.post(waiting_path).json()["state"] == "WAITING_FOR_UPDATE"

    event = client.post(
        f"/api/v1/demo/journeys/{journey_id}"
        "/events/previous-exit-date-updated"
    ).json()
    assert event["synthetic_event"] is True
    assert event["real_government_action_performed"] is False
    assert client.post(recheck_path).json()["state"] == "RESOLVED"

    before_re_evaluation = client.get(
        f"/api/v1/journeys/{journey_id}"
    ).json()
    assert before_re_evaluation["latest_decision"]["state"] == (
        "ACTION_REQUIRED"
    )

    second = client.post(f"/api/v1/journeys/{journey_id}/evaluate").json()
    assert second["state"] == "PASS"
    assert second["official_process"]["label"] == "Form 13"
    history = client.get(
        f"/api/v1/journeys/{journey_id}/decisions"
    ).json()["decisions"]
    assert [item["state"] for item in history] == ["ACTION_REQUIRED", "PASS"]
    assert history[0]["decision_id"] != history[1]["decision_id"]


def test_priya_journey_state_is_isolated_per_session(
    client: TestClient,
    create_journey: Callable[..., dict],
) -> None:
    first = create_journey(
        "PRIYA_TRANSFER_MISSING_EXIT",
        "TRANSFER_PF_AFTER_EMPLOYMENT_CHANGE",
    )
    second = create_journey(
        "PRIYA_TRANSFER_MISSING_EXIT",
        "TRANSFER_PF_AFTER_EMPLOYMENT_CHANGE",
    )
    first_id = first["journey_instance_id"]
    second_id = second["journey_instance_id"]

    event = client.post(
        f"/api/v1/demo/journeys/{first_id}"
        "/events/previous-exit-date-updated"
    )
    first_result = client.post(
        f"/api/v1/journeys/{first_id}/evaluate"
    ).json()
    second_result = client.post(
        f"/api/v1/journeys/{second_id}/evaluate"
    ).json()

    assert event.status_code == 200
    assert first_result["state"] == "PASS"
    assert second_result["state"] == "ACTION_REQUIRED"
    assert first_result["citizen_state_revision"] == 2
    assert second_result["citizen_state_revision"] == 1


def test_arjun_fails_closed_through_api(
    client: TestClient,
    create_journey: Callable[..., dict],
) -> None:
    journey = create_journey(
        "ARJUN_FINAL_SETTLEMENT",
        "FINAL_PF_SETTLEMENT",
    )

    response = client.post(
        f"/api/v1/journeys/{journey['journey_instance_id']}/evaluate"
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["state"] == "POLICY_REVIEW_REQUIRED"
    assert payload["state_display"] == "Policy verification required"
    assert payload["official_process"]["label"] == "Form 19"
    assert payload["resolution_ids"] == []
    assert payload["ai_used_for_decision"] is False


def test_mock_transfer_capability_unknown_is_unable_to_verify_after_correction(
) -> None:
    application = create_app(
        container=create_application_container(
            transfer_route_capability=CapabilityValue.UNKNOWN
        ),
        settings=ApiSettings(environment="test", allowed_origins=()),
    )
    with TestClient(application) as client:
        journey = client.post(
            "/api/v1/journeys",
            json={
                "persona_id": "PRIYA_TRANSFER_MISSING_EXIT",
                "goal": "TRANSFER_PF_AFTER_EMPLOYMENT_CHANGE",
            },
        ).json()
        journey_id = journey["journey_instance_id"]
        client.post(
            f"/api/v1/demo/journeys/{journey_id}"
            "/events/previous-exit-date-updated"
        )

        result = client.post(
            f"/api/v1/journeys/{journey_id}/evaluate"
        ).json()

    assert result["state"] == "UNABLE_TO_VERIFY"
    assert result["state_display"] == "Unable to verify"


def test_routes_contain_no_domain_decision_or_dynamic_execution_logic() -> None:
    forbidden_symbols = {
        "PolicyEngine",
        "JourneyOrchestrator",
        "ResolutionNavigator",
        "aggregate_all_of",
        "evaluate_graph",
        "eval",
        "exec",
    }

    for path in ROUTE_DIRECTORY.glob("*.py"):
        tree = ast.parse(path.read_text(encoding="utf-8"))
        names = {
            node.id for node in ast.walk(tree) if isinstance(node, ast.Name)
        }
        imported_modules = {
            node.module
            for node in ast.walk(tree)
            if isinstance(node, ast.ImportFrom) and node.module is not None
        }
        assert names.isdisjoint(forbidden_symbols)
        assert not any(module.startswith("app.domain") for module in imported_modules)
        assert not any(module.startswith("app.policies") for module in imported_modules)
        assert not any(
            module.startswith("app.prerequisites")
            for module in imported_modules
        )
