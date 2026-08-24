"""Journey transport validation, reads, and audit response tests."""

from collections.abc import Callable

from fastapi.testclient import TestClient


def test_create_journey_does_not_evaluate_implicitly(
    client: TestClient,
    create_journey: Callable[..., dict],
) -> None:
    created = create_journey(
        "RAVI_PARTIAL_READY",
        "ACCESS_SOME_PF_FUNDS",
        80_000,
    )

    response = client.get(
        f"/api/v1/journeys/{created['journey_instance_id']}"
    )

    assert response.status_code == 200
    assert response.json()["latest_decision"] is None
    assert response.json()["official_process"]["label"] == "Form 31"


def test_repeated_equal_revision_evaluations_create_distinct_records(
    client: TestClient,
    create_journey: Callable[..., dict],
) -> None:
    created = create_journey(
        "RAVI_PARTIAL_READY",
        "ACCESS_SOME_PF_FUNDS",
        80_000,
    )
    path = f"/api/v1/journeys/{created['journey_instance_id']}/evaluate"

    first = client.post(path)
    second = client.post(path)
    history = client.get(
        f"/api/v1/journeys/{created['journey_instance_id']}/decisions"
    )

    assert first.status_code == second.status_code == 200
    assert first.json()["citizen_state_revision"] == 1
    assert second.json()["citizen_state_revision"] == 1
    assert first.json()["decision_id"] != second.json()["decision_id"]
    assert len(history.json()["decisions"]) == 2


def test_decision_detail_exposes_safe_audit_information(
    client: TestClient,
    create_journey: Callable[..., dict],
) -> None:
    created = create_journey(
        "RAVI_PARTIAL_READY",
        "ACCESS_SOME_PF_FUNDS",
        80_000,
    )
    evaluation = client.post(
        f"/api/v1/journeys/{created['journey_instance_id']}/evaluate"
    ).json()

    response = client.get(
        f"/api/v1/journeys/{created['journey_instance_id']}"
        f"/decisions/{evaluation['decision_id']}"
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["ai_used_for_decision"] is False
    assert payload["policy_version"] == "1.0.0"
    assert payload["graph_version"] == "1.0.0"
    assert payload["sources"] == ["SRC-EPFO-PARTIAL-2026"]
    assert all("observed_value" not in item for item in payload["rule_results"])


def test_persona_goal_mismatch_is_a_safe_400(client: TestClient) -> None:
    response = client.post(
        "/api/v1/journeys",
        json={
            "persona_id": "RAVI_PARTIAL_READY",
            "goal": "FINAL_PF_SETTLEMENT",
        },
    )

    assert response.status_code == 400
    assert response.json()["error"]["code"] == "INVALID_DEMO_REQUEST"


def test_unknown_persona_is_404(client: TestClient) -> None:
    response = client.post(
        "/api/v1/journeys",
        json={
            "persona_id": "UNKNOWN_PERSONA",
            "goal": "ACCESS_SOME_PF_FUNDS",
        },
    )

    assert response.status_code == 404
    assert response.json()["error"]["code"] == "DEMO_PERSONA_NOT_FOUND"


def test_arbitrary_persona_path_is_rejected_by_request_schema(
    client: TestClient,
) -> None:
    response = client.post(
        "/api/v1/journeys",
        json={
            "persona_id": "../../fixtures/demo/ravi_partial_ready.json",
            "goal": "ACCESS_SOME_PF_FUNDS",
        },
    )

    assert response.status_code == 422
    assert response.json()["error"]["code"] == "REQUEST_VALIDATION_ERROR"


def test_invalid_goal_negative_amount_extra_and_raw_state_are_rejected(
    client: TestClient,
) -> None:
    invalid_bodies = (
        {
            "persona_id": "RAVI_PARTIAL_READY",
            "goal": "NOT_A_GOAL",
        },
        {
            "persona_id": "RAVI_PARTIAL_READY",
            "goal": "ACCESS_SOME_PF_FUNDS",
            "requested_amount_rupees": -1,
        },
        {
            "persona_id": "RAVI_PARTIAL_READY",
            "goal": "ACCESS_SOME_PF_FUNDS",
            "unexpected": True,
        },
        {
            "persona_id": "RAVI_PARTIAL_READY",
            "goal": "ACCESS_SOME_PF_FUNDS",
            "citizen_state": {"is_synthetic": True},
        },
    )

    for body in invalid_bodies:
        response = client.post("/api/v1/journeys", json=body)
        assert response.status_code == 422
        assert response.json()["error"]["code"] == (
            "REQUEST_VALIDATION_ERROR"
        )


def test_public_openapi_has_no_raw_identity_or_bank_number_fields(
    client: TestClient,
) -> None:
    schemas = client.get("/openapi.json").json()["components"]["schemas"]
    property_names = {
        property_name
        for schema in schemas.values()
        for property_name in schema.get("properties", {})
    }

    assert property_names.isdisjoint(
        {
            "aadhaar_number",
            "uan_number",
            "pan_number",
            "bank_account_number",
        }
    )
