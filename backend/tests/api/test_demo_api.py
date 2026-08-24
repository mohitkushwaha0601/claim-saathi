"""Synthetic persona allowlist and demo-event safety tests."""

from collections.abc import Callable

from fastapi.testclient import TestClient


def test_persona_list_contains_exactly_three_safe_summaries(
    client: TestClient,
) -> None:
    response = client.get("/api/v1/demo/personas")

    assert response.status_code == 200
    payload = response.json()
    assert {item["persona_id"] for item in payload["personas"]} == {
        "RAVI_PARTIAL_READY",
        "PRIYA_TRANSFER_MISSING_EXIT",
        "ARJUN_FINAL_SETTLEMENT",
    }
    assert {item["display_name"] for item in payload["personas"]} == {
        "Ravi",
        "Priya",
        "Arjun",
    }
    serialized = str(payload).lower()
    assert "citizen_state" not in serialized
    assert "account_number" not in serialized
    assert payload["demo"] == {
        "environment": "DEMO",
        "synthetic_data": True,
        "real_government_action_performed": False,
    }


def test_demo_event_is_rejected_for_ravi(
    client: TestClient,
    create_journey: Callable[..., dict],
) -> None:
    journey = create_journey(
        "RAVI_PARTIAL_READY",
        "ACCESS_SOME_PF_FUNDS",
        80_000,
    )

    response = client.post(
        f"/api/v1/demo/journeys/{journey['journey_instance_id']}"
        "/events/previous-exit-date-updated"
    )

    assert response.status_code == 409
    assert response.json()["error"]["code"] == "DEMO_EVENT_NOT_ALLOWED"


def test_demo_event_is_rejected_for_arjun(
    client: TestClient,
    create_journey: Callable[..., dict],
) -> None:
    journey = create_journey(
        "ARJUN_FINAL_SETTLEMENT",
        "FINAL_PF_SETTLEMENT",
    )

    response = client.post(
        f"/api/v1/demo/journeys/{journey['journey_instance_id']}"
        "/events/previous-exit-date-updated"
    )

    assert response.status_code == 409
    assert response.json()["error"]["code"] == "DEMO_EVENT_NOT_ALLOWED"


def test_priya_event_increments_revision_once_only_when_state_changes(
    client: TestClient,
    create_journey: Callable[..., dict],
) -> None:
    journey = create_journey(
        "PRIYA_TRANSFER_MISSING_EXIT",
        "TRANSFER_PF_AFTER_EMPLOYMENT_CHANGE",
    )
    path = (
        f"/api/v1/demo/journeys/{journey['journey_instance_id']}"
        "/events/previous-exit-date-updated"
    )

    first = client.post(path)
    second = client.post(path)

    assert first.status_code == 200
    assert first.json()["synthetic_event"] is True
    assert first.json()["changed"] is True
    assert first.json()["citizen_state_revision"] == 2
    assert first.json()["demo"]["real_government_action_performed"] is False
    assert second.status_code == 200
    assert second.json()["changed"] is False
    assert second.json()["citizen_state_revision"] == 2


def test_no_generic_demo_mutation_endpoint_exists(client: TestClient) -> None:
    response = client.post(
        "/api/v1/demo/journeys/SYNTH/mutate",
        json={"path": "employment.records", "value": "anything"},
    )

    assert response.status_code == 404
