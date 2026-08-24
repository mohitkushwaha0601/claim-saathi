"""Resolution endpoint ownership and transition safety tests."""

from collections.abc import Callable

from fastapi.testclient import TestClient


def _priya_evaluation(client: TestClient, create_journey: Callable[..., dict]):
    journey = create_journey(
        "PRIYA_TRANSFER_MISSING_EXIT",
        "TRANSFER_PF_AFTER_EMPLOYMENT_CHANGE",
    )
    evaluation = client.post(
        f"/api/v1/journeys/{journey['journey_instance_id']}/evaluate"
    ).json()
    return journey, evaluation


def test_resolution_start_derives_res_exit_and_starts_citizen_action(
    client: TestClient,
    create_journey: Callable[..., dict],
) -> None:
    journey, evaluation = _priya_evaluation(client, create_journey)

    response = client.post(
        f"/api/v1/journeys/{journey['journey_instance_id']}/resolutions",
        json={
            "decision_id": evaluation["decision_id"],
            "issue_code": "EXIT_DATE_MISSING",
        },
    )

    assert response.status_code == 201
    payload = response.json()
    assert payload["resolution_id"] == "RES_EXIT"
    assert payload["state"] == "CITIZEN_ACTION_REQUIRED"
    assert payload["official_sources"] == ["SRC-EPFO-EXIT-RESOLUTION"]
    assert len(payload["approved_steps"]) == 4


def test_client_cannot_supply_arbitrary_resolution_id(
    client: TestClient,
    create_journey: Callable[..., dict],
) -> None:
    journey, evaluation = _priya_evaluation(client, create_journey)

    response = client.post(
        f"/api/v1/journeys/{journey['journey_instance_id']}/resolutions",
        json={
            "decision_id": evaluation["decision_id"],
            "issue_code": "EXIT_DATE_MISSING",
            "resolution_id": "RES_WHATEVER",
        },
    )

    assert response.status_code == 422


def test_issue_absent_from_decision_cannot_start_resolution(
    client: TestClient,
    create_journey: Callable[..., dict],
) -> None:
    journey = create_journey(
        "RAVI_PARTIAL_READY",
        "ACCESS_SOME_PF_FUNDS",
        80_000,
    )
    evaluation = client.post(
        f"/api/v1/journeys/{journey['journey_instance_id']}/evaluate"
    ).json()

    response = client.post(
        f"/api/v1/journeys/{journey['journey_instance_id']}/resolutions",
        json={
            "decision_id": evaluation["decision_id"],
            "issue_code": "EXIT_DATE_MISSING",
        },
    )

    assert response.status_code == 409
    assert response.json()["error"]["code"] == (
        "RESOLUTION_START_NOT_ALLOWED"
    )


def test_resolution_has_no_direct_resolved_command(
    client: TestClient,
) -> None:
    response = client.post(
        "/api/v1/journeys/JRN/resolutions/RES/resolved",
        json={"resolved": True},
    )

    assert response.status_code == 404


def test_get_resolution_has_no_side_effects(
    client: TestClient,
    create_journey: Callable[..., dict],
) -> None:
    journey, evaluation = _priya_evaluation(client, create_journey)
    created = client.post(
        f"/api/v1/journeys/{journey['journey_instance_id']}/resolutions",
        json={
            "decision_id": evaluation["decision_id"],
            "issue_code": "EXIT_DATE_MISSING",
        },
    ).json()
    path = (
        f"/api/v1/journeys/{journey['journey_instance_id']}/resolutions/"
        f"{created['resolution_instance_id']}"
    )

    first = client.get(path)
    second = client.get(path)

    assert first.status_code == second.status_code == 200
    assert first.json() == second.json()
    assert first.json()["state"] == "CITIZEN_ACTION_REQUIRED"


def test_list_resolutions_restores_existing_state_without_side_effects(
    client: TestClient,
    create_journey: Callable[..., dict],
) -> None:
    journey, evaluation = _priya_evaluation(client, create_journey)
    journey_id = journey["journey_instance_id"]

    empty = client.get(f"/api/v1/journeys/{journey_id}/resolutions")
    created = client.post(
        f"/api/v1/journeys/{journey_id}/resolutions",
        json={
            "decision_id": evaluation["decision_id"],
            "issue_code": "EXIT_DATE_MISSING",
        },
    ).json()
    first = client.get(f"/api/v1/journeys/{journey_id}/resolutions")
    second = client.get(f"/api/v1/journeys/{journey_id}/resolutions")

    assert empty.status_code == 200
    assert empty.json()["resolutions"] == []
    assert first.status_code == second.status_code == 200
    assert first.json() == second.json()
    assert first.json()["resolutions"] == [created]
    assert first.json()["resolutions"][0]["state"] == (
        "CITIZEN_ACTION_REQUIRED"
    )
    assert first.json()["demo"]["real_government_action_performed"] is False


def test_invalid_resolution_transition_returns_safe_conflict(
    client: TestClient,
    create_journey: Callable[..., dict],
) -> None:
    journey, evaluation = _priya_evaluation(client, create_journey)
    created = client.post(
        f"/api/v1/journeys/{journey['journey_instance_id']}/resolutions",
        json={
            "decision_id": evaluation["decision_id"],
            "issue_code": "EXIT_DATE_MISSING",
        },
    ).json()
    path = (
        f"/api/v1/journeys/{journey['journey_instance_id']}/resolutions/"
        f"{created['resolution_instance_id']}"
        "/confirm-external-step-started"
    )

    assert client.post(path).status_code == 200
    response = client.post(path)

    assert response.status_code == 409
    assert response.json()["error"]["code"] == "INVALID_RESOLUTION_ACTION"
    assert "/Users/" not in response.text
