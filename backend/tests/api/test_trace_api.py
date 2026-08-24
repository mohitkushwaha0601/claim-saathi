"""Observational execution-trace API contract and safety tests."""

from collections.abc import Callable

import pytest
from fastapi.testclient import TestClient
from app.journeys.exceptions import JourneyConfigurationError


def _evaluate(
    client: TestClient,
    created: dict,
) -> dict:
    response = client.post(
        f"/api/v1/journeys/{created['journey_instance_id']}/evaluate"
    )
    assert response.status_code == 200, response.text
    return response.json()


def _trace(
    client: TestClient,
    journey_id: str,
    decision_id: str,
):
    return client.get(
        f"/api/v1/journeys/{journey_id}/decisions/{decision_id}/trace"
    )


def test_trace_unknown_journey_and_decision_are_404(
    client: TestClient,
    create_journey: Callable[..., dict],
) -> None:
    unknown_journey = _trace(client, "JRN-UNKNOWN", "DEC-UNKNOWN")
    created = create_journey(
        "RAVI_PARTIAL_READY",
        "ACCESS_SOME_PF_FUNDS",
        80_000,
    )
    unknown_decision = _trace(
        client,
        created["journey_instance_id"],
        "DEC-UNKNOWN",
    )

    assert unknown_journey.status_code == 404
    assert unknown_decision.status_code == 404
    assert unknown_journey.json()["error"]["code"] == (
        "JOURNEY_RESOURCE_NOT_FOUND"
    )


def test_trace_decision_must_belong_to_requested_journey(
    client: TestClient,
    create_journey: Callable[..., dict],
) -> None:
    first = create_journey(
        "RAVI_PARTIAL_READY",
        "ACCESS_SOME_PF_FUNDS",
        80_000,
    )
    second = create_journey(
        "RAVI_PARTIAL_READY",
        "ACCESS_SOME_PF_FUNDS",
        80_000,
    )
    first_decision = _evaluate(client, first)

    response = _trace(
        client,
        second["journey_instance_id"],
        first_decision["decision_id"],
    )

    assert response.status_code == 404


def test_ravi_trace_uses_stored_rule_and_graph_results(
    client: TestClient,
    create_journey: Callable[..., dict],
) -> None:
    created = create_journey(
        "RAVI_PARTIAL_READY",
        "ACCESS_SOME_PF_FUNDS",
        80_000,
    )
    decision = _evaluate(client, created)
    detail = client.get(
        f"/api/v1/journeys/{created['journey_instance_id']}"
        f"/decisions/{decision['decision_id']}"
    ).json()

    response = _trace(
        client,
        created["journey_instance_id"],
        decision["decision_id"],
    )

    assert response.status_code == 200
    payload = response.json()
    assert [stage["stage_type"] for stage in payload["stages"]] == [
        "INTENT",
        "JOURNEY_PLANNER",
        "POLICY_ENGINE",
        "PREREQUISITE_GRAPH",
        "DECISION_RECORD",
    ]
    policy_stage = payload["stages"][2]
    assert policy_stage["details"]["rules"] == [
        {
            "rule_id": result["rule_id"],
            "state": result["state"],
            "issue_code": result["issue_code"],
            "source_id": result["source_id"],
        }
        for result in detail["rule_results"]
    ]
    graph_stage = payload["stages"][3]
    graph_nodes = graph_stage["details"]["nodes"]
    root = next(
        node
        for node in graph_nodes
        if node["node_id"] == graph_stage["details"]["root_node_id"]
    )
    assert root["state"] == detail["state"] == "PASS"
    assert payload["ai_used_for_decision"] is False
    assert all(stage["details"].get("ai_used") is not True for stage in payload["stages"])


@pytest.mark.parametrize(
    ("persona_id", "goal", "expected_state"),
    (
        (
            "PRIYA_TRANSFER_MISSING_EXIT",
            "TRANSFER_PF_AFTER_EMPLOYMENT_CHANGE",
            "ACTION_REQUIRED",
        ),
        (
            "ARJUN_FINAL_SETTLEMENT",
            "FINAL_PF_SETTLEMENT",
            "POLICY_REVIEW_REQUIRED",
        ),
    ),
)
def test_non_pass_traces_preserve_the_stored_safe_state(
    client: TestClient,
    create_journey: Callable[..., dict],
    persona_id: str,
    goal: str,
    expected_state: str,
) -> None:
    created = create_journey(persona_id, goal)
    decision = _evaluate(client, created)

    payload = _trace(
        client,
        created["journey_instance_id"],
        decision["decision_id"],
    ).json()

    assert payload["decision_state"] == expected_state
    assert payload["stages"][-1]["state"] == expected_state
    if expected_state == "POLICY_REVIEW_REQUIRED":
        serialized = str(payload)
        assert "waiting_period" not in serialized
        assert "wait_period" not in serialized


def test_trace_is_read_only_and_does_not_call_evaluators(
    client: TestClient,
    create_journey: Callable[..., dict],
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    created = create_journey(
        "PRIYA_TRANSFER_MISSING_EXIT",
        "TRANSFER_PF_AFTER_EMPLOYMENT_CHANGE",
    )
    journey_id = created["journey_instance_id"]
    decision = _evaluate(client, created)
    resolution = client.post(
        f"/api/v1/journeys/{journey_id}/resolutions",
        json={
            "decision_id": decision["decision_id"],
            "issue_code": "EXIT_DATE_MISSING",
        },
    )
    assert resolution.status_code == 201

    journey_before = client.get(f"/api/v1/journeys/{journey_id}").json()
    decisions_before = client.get(
        f"/api/v1/journeys/{journey_id}/decisions"
    ).json()
    resolutions_before = client.get(
        f"/api/v1/journeys/{journey_id}/resolutions"
    ).json()

    def unexpected_call(*_args, **_kwargs):
        raise AssertionError("trace called deterministic evaluation")

    journey_service = client.app.state.container.journey_service
    monkeypatch.setattr(
        journey_service._orchestrator._policy_engine,
        "evaluate_rule",
        unexpected_call,
    )
    monkeypatch.setattr(
        "app.journeys.orchestrator.evaluate_graph",
        unexpected_call,
    )

    first = _trace(client, journey_id, decision["decision_id"])
    second = _trace(client, journey_id, decision["decision_id"])

    assert first.status_code == second.status_code == 200
    assert first.json() == second.json()
    assert client.get(f"/api/v1/journeys/{journey_id}").json() == journey_before
    assert client.get(
        f"/api/v1/journeys/{journey_id}/decisions"
    ).json() == decisions_before
    assert client.get(
        f"/api/v1/journeys/{journey_id}/resolutions"
    ).json() == resolutions_before


def test_trace_response_excludes_raw_citizen_state_and_sensitive_identifiers(
    client: TestClient,
    create_journey: Callable[..., dict],
) -> None:
    created = create_journey(
        "RAVI_PARTIAL_READY",
        "ACCESS_SOME_PF_FUNDS",
        80_000,
    )
    decision = _evaluate(client, created)

    payload = _trace(
        client,
        created["journey_instance_id"],
        decision["decision_id"],
    ).json()
    serialized = str(payload).lower()
    property_names = {
        key
        for stage in payload["stages"]
        for key in stage["details"]
    }

    assert "citizen_state" not in property_names
    assert "observed_value" not in serialized
    assert "aadhaar_number" not in serialized
    assert "uan_number" not in serialized
    assert "bank_account_number" not in serialized
    decision_sources = set(
        client.get(
            f"/api/v1/journeys/{created['journey_instance_id']}"
            f"/decisions/{decision['decision_id']}"
        ).json()["sources"]
    )
    trace_sources = {
        rule["source_id"]
        for rule in payload["stages"][2]["details"]["rules"]
        if rule["source_id"] is not None
    }
    assert trace_sources <= decision_sources


def test_trace_configuration_failure_remains_a_server_error(
    client: TestClient,
    create_journey: Callable[..., dict],
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    created = create_journey(
        "RAVI_PARTIAL_READY",
        "ACCESS_SOME_PF_FUNDS",
        80_000,
    )
    decision = _evaluate(client, created)
    trace_service = client.app.state.container.execution_trace_service

    def invalid_graph(*_args, **_kwargs):
        raise JourneyConfigurationError("synthetic test corruption")

    monkeypatch.setattr(trace_service._catalog, "graph_for", invalid_graph)
    response = _trace(
        client,
        created["journey_instance_id"],
        decision["decision_id"],
    )

    assert response.status_code == 500
    assert response.json()["error"]["code"] == "CONFIGURATION_ERROR"
    assert "synthetic test corruption" not in response.text
