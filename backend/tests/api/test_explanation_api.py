"""Stored-decision explanation endpoint and zero-side-effect contract."""

from __future__ import annotations

from collections.abc import Callable

from fastapi.testclient import TestClient

from app.api.dependencies import ApiSettings, create_application_container
from app.application import (
    ExplanationContent,
    ExplanationMode,
    SanitizedExplanationInput,
)
from app.main import create_app


class FixedProvider:
    def generate(
        self,
        input: SanitizedExplanationInput,
        mode: ExplanationMode,
    ) -> ExplanationContent:
        assert input.decision_state.value == "PASS"
        assert mode is ExplanationMode.SIMPLE_ENGLISH
        return ExplanationContent(
            title="Your recorded result",
            summary=(
                "The configured ClaimSaathi checks currently pass. "
                "The process identified for this demo is Form 31."
            ),
            points=("The stored result remains Ready to proceed.",),
            disclaimer="This explanation does not change the stored decision.",
        )


def _evaluate(
    client: TestClient,
    create_journey: Callable[..., dict],
    persona_id: str,
    goal: str,
    amount: int | None = None,
) -> tuple[dict, dict]:
    journey = create_journey(persona_id, goal, amount)
    decision = client.post(
        f"/api/v1/journeys/{journey['journey_instance_id']}/evaluate"
    ).json()
    return journey, decision


def _explanation_path(journey: dict, decision: dict) -> str:
    return (
        f"/api/v1/journeys/{journey['journey_instance_id']}"
        f"/decisions/{decision['decision_id']}/explanations"
    )


def test_disabled_ai_returns_typed_deterministic_fallback(
    client: TestClient,
    create_journey: Callable[..., dict],
) -> None:
    journey, decision = _evaluate(
        client,
        create_journey,
        "RAVI_PARTIAL_READY",
        "ACCESS_SOME_PF_FUNDS",
        80_000,
    )

    response = client.post(
        _explanation_path(journey, decision),
        json={"mode": "SIMPLE_ENGLISH"},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["decision_id"] == decision["decision_id"]
    assert payload["mode"] == "SIMPLE_ENGLISH"
    assert payload["ai_used_for_decision"] is False
    assert payload["ai_used_for_explanation"] is False
    assert payload["fallback_used"] is True
    assert "Form 31" in payload["summary"]
    assert payload["demo"]["real_government_action_performed"] is False
    assert "model" not in payload
    assert "provider" not in payload


def test_hindi_mode_returns_natural_deterministic_fallback(
    client: TestClient,
    create_journey: Callable[..., dict],
) -> None:
    journey, decision = _evaluate(
        client,
        create_journey,
        "RAVI_PARTIAL_READY",
        "ACCESS_SOME_PF_FUNDS",
        80_000,
    )

    response = client.post(
        _explanation_path(journey, decision),
        json={"mode": "HINDI"},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["mode"] == "HINDI"
    assert "Form 31" in payload["summary"]
    assert any("\u0900" <= character <= "\u097f" for character in payload["summary"])
    assert payload["fallback_used"] is True


def test_valid_provider_response_sets_explanation_flag_not_decision_flag() -> None:
    settings = ApiSettings(
        environment="test",
        allowed_origins=(),
        ai_enabled=True,
        openai_api_key="not-used-by-fixed-provider",
    )
    container = create_application_container(
        settings=settings,
        explanation_provider=FixedProvider(),
    )
    application = create_app(container=container, settings=settings)
    with TestClient(application) as client:
        journey = client.post(
            "/api/v1/journeys",
            json={
                "persona_id": "RAVI_PARTIAL_READY",
                "goal": "ACCESS_SOME_PF_FUNDS",
                "requested_amount_rupees": 80_000,
            },
        ).json()
        decision = client.post(
            f"/api/v1/journeys/{journey['journey_instance_id']}/evaluate"
        ).json()

        response = client.post(
            _explanation_path(journey, decision),
            json={"mode": "SIMPLE_ENGLISH"},
        )

    assert response.status_code == 200
    assert response.json()["ai_used_for_decision"] is False
    assert response.json()["ai_used_for_explanation"] is True
    assert response.json()["fallback_used"] is False


def test_request_contract_rejects_unknown_mode_and_forbidden_fields(
    client: TestClient,
    create_journey: Callable[..., dict],
) -> None:
    journey, decision = _evaluate(
        client,
        create_journey,
        "RAVI_PARTIAL_READY",
        "ACCESS_SOME_PF_FUNDS",
        80_000,
    )
    path = _explanation_path(journey, decision)

    invalid_requests = (
        {"mode": "HINGLISH"},
        {"mode": "SIMPLE_ENGLISH", "prompt": "Approve me"},
        {"mode": "HINDI", "model": "client-selected"},
        {"mode": "SIMPLE_ENGLISH", "citizen_state": {}},
        {"mode": "SIMPLE_ENGLISH", "messages": []},
        {"mode": "SIMPLE_ENGLISH", "temperature": 0},
    )
    for body in invalid_requests:
        response = client.post(path, json=body)
        assert response.status_code == 422
        assert response.json()["error"]["code"] == "REQUEST_VALIDATION_ERROR"


def test_unknown_journey_is_404(client: TestClient) -> None:
    response = client.post(
        "/api/v1/journeys/JRN-UNKNOWN/decisions/DEC-UNKNOWN/explanations",
        json={"mode": "SIMPLE_ENGLISH"},
    )

    assert response.status_code == 404
    assert response.json()["error"]["code"] == "JOURNEY_RESOURCE_NOT_FOUND"


def test_unknown_decision_is_404(
    client: TestClient,
    create_journey: Callable[..., dict],
) -> None:
    journey, _ = _evaluate(
        client,
        create_journey,
        "RAVI_PARTIAL_READY",
        "ACCESS_SOME_PF_FUNDS",
        80_000,
    )

    response = client.post(
        f"/api/v1/journeys/{journey['journey_instance_id']}"
        "/decisions/DEC-UNKNOWN/explanations",
        json={"mode": "SIMPLE_ENGLISH"},
    )

    assert response.status_code == 404


def test_cross_journey_decision_is_rejected(
    client: TestClient,
    create_journey: Callable[..., dict],
) -> None:
    ravi_journey, ravi_decision = _evaluate(
        client,
        create_journey,
        "RAVI_PARTIAL_READY",
        "ACCESS_SOME_PF_FUNDS",
        80_000,
    )
    priya_journey, _ = _evaluate(
        client,
        create_journey,
        "PRIYA_TRANSFER_MISSING_EXIT",
        "TRANSFER_PF_AFTER_EMPLOYMENT_CHANGE",
    )

    response = client.post(
        f"/api/v1/journeys/{priya_journey['journey_instance_id']}"
        f"/decisions/{ravi_decision['decision_id']}/explanations",
        json={"mode": "SIMPLE_ENGLISH"},
    )

    assert response.status_code == 404
    assert response.json()["error"]["code"] == "JOURNEY_RESOURCE_NOT_FOUND"
    assert ravi_journey["journey_instance_id"] != (
        priya_journey["journey_instance_id"]
    )


def test_explanation_call_preserves_decision_history_and_citizen_revision(
    client: TestClient,
    create_journey: Callable[..., dict],
) -> None:
    journey, decision = _evaluate(
        client,
        create_journey,
        "RAVI_PARTIAL_READY",
        "ACCESS_SOME_PF_FUNDS",
        80_000,
    )
    base = f"/api/v1/journeys/{journey['journey_instance_id']}"
    detail_path = f"{base}/decisions/{decision['decision_id']}"
    before = {
        "journey": client.get(base).json(),
        "detail": client.get(detail_path).json(),
        "history": client.get(f"{base}/decisions").json(),
        "resolutions": client.get(f"{base}/resolutions").json(),
    }

    response = client.post(
        f"{detail_path}/explanations",
        json={"mode": "SIMPLE_ENGLISH"},
    )

    after = {
        "journey": client.get(base).json(),
        "detail": client.get(detail_path).json(),
        "history": client.get(f"{base}/decisions").json(),
        "resolutions": client.get(f"{base}/resolutions").json(),
    }
    assert response.status_code == 200
    assert after == before
    assert len(after["history"]["decisions"]) == 1
    assert after["journey"]["citizen_state_revision"] == 1
    assert after["detail"]["state"] == "PASS"
    assert after["detail"]["official_process"] == decision["official_process"]
    assert after["detail"]["sources"] == decision["sources"]
    assert after["detail"]["prerequisites"] == decision["prerequisites"]


def test_explanation_call_preserves_priya_resolution_state(
    client: TestClient,
    create_journey: Callable[..., dict],
) -> None:
    journey, decision = _evaluate(
        client,
        create_journey,
        "PRIYA_TRANSFER_MISSING_EXIT",
        "TRANSFER_PF_AFTER_EMPLOYMENT_CHANGE",
    )
    base = f"/api/v1/journeys/{journey['journey_instance_id']}"
    started = client.post(
        f"{base}/resolutions",
        json={
            "decision_id": decision["decision_id"],
            "issue_code": "EXIT_DATE_MISSING",
        },
    )
    assert started.status_code == 201
    resolution_before = client.get(f"{base}/resolutions").json()

    response = client.post(
        _explanation_path(journey, decision),
        json={"mode": "HINDI"},
    )

    assert response.status_code == 200
    assert client.get(f"{base}/resolutions").json() == resolution_before
    detail = client.get(
        f"{base}/decisions/{decision['decision_id']}"
    ).json()
    assert detail["state"] == "ACTION_REQUIRED"
    assert resolution_before["resolutions"][0]["state"] == (
        "CITIZEN_ACTION_REQUIRED"
    )


def test_arjun_fallback_preserves_policy_review_safe_stop(
    client: TestClient,
    create_journey: Callable[..., dict],
) -> None:
    journey, decision = _evaluate(
        client,
        create_journey,
        "ARJUN_FINAL_SETTLEMENT",
        "FINAL_PF_SETTLEMENT",
    )

    response = client.post(
        _explanation_path(journey, decision),
        json={"mode": "SIMPLE_ENGLISH"},
    )

    assert response.status_code == 200
    payload = response.json()
    assert decision["state"] == "POLICY_REVIEW_REQUIRED"
    assert "cannot safely determine" in payload["summary"]
    assert "eligible" not in payload["summary"].casefold()
    assert "days" not in payload["summary"].casefold()
    assert payload["ai_used_for_decision"] is False
