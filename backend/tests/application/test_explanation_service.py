"""Safety and fallback behavior for downstream decision explanations."""

from __future__ import annotations

import json
from typing import Any

import pytest

from app.api.dependencies import ApiSettings, create_application_container
from app.application import (
    ExplanationContent,
    ExplanationMode,
    ExplanationService,
    SanitizedExplanationInput,
)
from app.domain import IntentGoal


class StubProvider:
    def __init__(
        self,
        output: ExplanationContent | dict[str, Any] | Exception,
    ) -> None:
        self.output = output
        self.inputs: list[SanitizedExplanationInput] = []
        self.modes: list[ExplanationMode] = []

    def generate(
        self,
        input: SanitizedExplanationInput,
        mode: ExplanationMode,
    ) -> Any:
        self.inputs.append(input)
        self.modes.append(mode)
        if isinstance(self.output, Exception):
            raise self.output
        return self.output


def _settings(
    *,
    enabled: bool = False,
    api_key: str | None = None,
) -> ApiSettings:
    return ApiSettings(
        environment="test",
        allowed_origins=(),
        ai_enabled=enabled,
        openai_api_key=api_key,
    )


def _evaluated_service(
    *,
    persona_id: str = "RAVI_PARTIAL_READY",
    goal: IntentGoal = IntentGoal.ACCESS_SOME_PF_FUNDS,
    requested_amount_rupees: int | None = 80_000,
    provider: StubProvider | None = None,
    settings: ApiSettings | None = None,
) -> tuple[ExplanationService, str, str, Any]:
    container = create_application_container(
        settings=settings or _settings(),
        explanation_provider=provider,
    )
    journey = container.journey_service.create_journey(
        persona_id=persona_id,
        goal=goal,
        requested_amount_rupees=requested_amount_rupees,
    )
    evaluation = container.journey_service.evaluate_journey(
        journey.journey_instance.journey_instance_id
    )
    return (
        container.explanation_service,
        journey.journey_instance.journey_instance_id,
        evaluation.evaluation.decision_record.decision_id,
        container,
    )


def _valid_content() -> ExplanationContent:
    return ExplanationContent(
        title="Your recorded result",
        summary=(
            "The configured ClaimSaathi checks currently pass. "
            "The process identified for this demo is Form 31."
        ),
        points=("The stored result remains Ready to proceed.",),
        disclaimer="This explanation does not change the stored decision.",
    )


def test_ai_disabled_returns_deterministic_fallback() -> None:
    service, journey_id, decision_id, _ = _evaluated_service()

    result = service.explain(
        journey_id,
        decision_id,
        ExplanationMode.SIMPLE_ENGLISH,
    )

    assert result.ai_used_for_decision is False
    assert result.ai_used_for_explanation is False
    assert result.fallback_used is True
    assert "Form 31" in result.content.summary


def test_missing_api_key_keeps_provider_disabled() -> None:
    service, journey_id, decision_id, _ = _evaluated_service(
        settings=_settings(enabled=True, api_key=None)
    )

    result = service.explain(
        journey_id,
        decision_id,
        ExplanationMode.SIMPLE_ENGLISH,
    )

    assert result.ai_used_for_explanation is False
    assert result.fallback_used is True


@pytest.mark.parametrize(
    "failure",
    [RuntimeError("provider unavailable"), TimeoutError("provider timeout")],
    ids=["provider-error", "timeout"],
)
def test_provider_failure_or_timeout_falls_back(failure: Exception) -> None:
    provider = StubProvider(failure)
    service, journey_id, decision_id, _ = _evaluated_service(
        provider=provider
    )

    result = service.explain(
        journey_id,
        decision_id,
        ExplanationMode.SIMPLE_ENGLISH,
    )

    assert result.ai_used_for_explanation is False
    assert result.fallback_used is True


def test_malformed_structured_output_falls_back() -> None:
    provider = StubProvider(
        {
            "title": "Incomplete",
            "summary": "Missing required structured fields.",
        }
    )
    service, journey_id, decision_id, _ = _evaluated_service(
        provider=provider
    )

    result = service.explain(
        journey_id,
        decision_id,
        ExplanationMode.SIMPLE_ENGLISH,
    )

    assert result.ai_used_for_explanation is False
    assert result.fallback_used is True


@pytest.mark.parametrize(
    "malicious_text",
    [
        "You are approved.",
        "Your claim is rejected.",
        "You are eligible.",
        "Wait 60 days.",
        "You can withdraw ₹2,00,000.",
        "Your limit is 75 percent.",
        "Start on 24/08/2026.",
        "Use Form 10C.",
        "Visit https://example.com.",
        "Your claim will definitely succeed.",
        "Upload a different document.",
    ],
)
def test_unsupported_authoritative_output_falls_back(
    malicious_text: str,
) -> None:
    provider = StubProvider(
        ExplanationContent(
            title="Explanation",
            summary="This describes the recorded ClaimSaathi result.",
            points=(malicious_text,),
            disclaimer="This explanation does not change the stored decision.",
        )
    )
    service, journey_id, decision_id, _ = _evaluated_service(
        provider=provider
    )

    result = service.explain(
        journey_id,
        decision_id,
        ExplanationMode.SIMPLE_ENGLISH,
    )

    assert result.ai_used_for_explanation is False
    assert result.fallback_used is True
    assert malicious_text not in result.content.points


@pytest.mark.parametrize(
    "unsafe_claim",
    [
        "You are eligible.",
        "Wait 60 days.",
        "Submit now.",
        "Form 19 is ready to submit.",
        "This policy interpretation is correct.",
    ],
)
def test_arjun_policy_review_safe_stop_rejects_invented_claims(
    unsafe_claim: str,
) -> None:
    provider = StubProvider(
        ExplanationContent(
            title="Policy review",
            summary=(
                "ClaimSaathi cannot determine this safely because the policy "
                "configuration needs review."
            ),
            points=(unsafe_claim,),
            disclaimer="The stored policy-review result remains unchanged.",
        )
    )
    service, journey_id, decision_id, _ = _evaluated_service(
        persona_id="ARJUN_FINAL_SETTLEMENT",
        goal=IntentGoal.FINAL_PF_SETTLEMENT,
        requested_amount_rupees=None,
        provider=provider,
    )

    result = service.explain(
        journey_id,
        decision_id,
        ExplanationMode.SIMPLE_ENGLISH,
    )

    assert result.ai_used_for_explanation is False
    assert result.fallback_used is True
    assert "cannot safely determine" in result.content.summary


def test_valid_provider_response_sets_ai_explanation_flag_only() -> None:
    provider = StubProvider(_valid_content())
    service, journey_id, decision_id, _ = _evaluated_service(
        provider=provider
    )

    result = service.explain(
        journey_id,
        decision_id,
        ExplanationMode.SIMPLE_ENGLISH,
    )

    assert result.ai_used_for_decision is False
    assert result.ai_used_for_explanation is True
    assert result.fallback_used is False
    assert result.content == _valid_content()


def test_valid_hindi_response_preserves_form_identifier() -> None:
    provider = StubProvider(
        ExplanationContent(
            title="आपका दर्ज परिणाम",
            summary=(
                "कॉन्फ़िगर की गई ClaimSaathi जाँचें वर्तमान में पूरी हैं। "
                "इस डेमो के लिए पहचानी गई प्रक्रिया Form 31 है।"
            ),
            points=("स्टोर किया गया परिणाम नहीं बदला है।",),
            disclaimer="AI ने यह निर्णय नहीं लिया।",
        )
    )
    service, journey_id, decision_id, _ = _evaluated_service(
        provider=provider
    )

    result = service.explain(
        journey_id,
        decision_id,
        ExplanationMode.HINDI,
    )

    assert result.ai_used_for_explanation is True
    assert result.fallback_used is False
    assert "Form 31" in result.content.summary


def test_provider_receives_only_sanitized_positive_allowlist() -> None:
    provider = StubProvider(_valid_content())
    service, journey_id, decision_id, container = _evaluated_service(
        provider=provider
    )
    session_before = container.journey_service.get_journey(journey_id)

    service.explain(journey_id, decision_id, ExplanationMode.SIMPLE_ENGLISH)

    assert len(provider.inputs) == 1
    payload = provider.inputs[0].model_dump(mode="json")
    assert set(payload) == {
        "journey_label",
        "decision_state",
        "state_label",
        "summary",
        "prerequisite_summaries",
        "issue_summaries",
        "resolution_summary",
        "official_process",
        "safety_notes",
        "source_ids",
    }
    serialized = json.dumps(payload, ensure_ascii=False).casefold()
    raw_state = session_before.citizen_state.model_dump(mode="json")
    forbidden_names = {
        "citizen_state",
        "citizen_id",
        "aadhaar_number",
        "uan_number",
        "pan",
        "bank_account",
        "available_balance_rupees",
        "requested_amount_rupees",
        "exit_date",
        "service_months",
        "state_revision",
    }
    assert forbidden_names.isdisjoint(payload)
    assert all(name not in serialized for name in forbidden_names)
    assert str(raw_state["citizen_id"]).casefold() not in serialized
    assert str(raw_state["pf"]["available_balance_rupees"]) not in serialized
    assert "aadhaar" not in serialized
    assert "uan" not in serialized


def test_explanation_has_no_business_state_side_effects() -> None:
    provider = StubProvider(_valid_content())
    service, journey_id, decision_id, container = _evaluated_service(
        provider=provider
    )
    detail_before = container.journey_service.decision_detail(
        journey_id,
        decision_id,
    )
    history_before = container.journey_service.decision_history(journey_id)
    session_before = container.journey_service.get_journey(journey_id)

    service.explain(journey_id, decision_id, ExplanationMode.SIMPLE_ENGLISH)

    detail_after = container.journey_service.decision_detail(
        journey_id,
        decision_id,
    )
    history_after = container.journey_service.decision_history(journey_id)
    session_after = container.journey_service.get_journey(journey_id)
    assert detail_after.evaluation.journey_decision == (
        detail_before.evaluation.journey_decision
    )
    assert detail_after.evaluation.decision_record == (
        detail_before.evaluation.decision_record
    )
    assert detail_after.evaluation.graph_evaluation == (
        detail_before.evaluation.graph_evaluation
    )
    assert len(history_after) == len(history_before) == 1
    assert session_after.citizen_state.state_revision == (
        session_before.citizen_state.state_revision
    )
    assert detail_after.definition.official_process_label == (
        detail_before.definition.official_process_label
    )
    assert detail_after.evaluation.decision_record.source_ids == (
        detail_before.evaluation.decision_record.source_ids
    )


@pytest.mark.parametrize(
    ("persona_id", "goal", "amount", "expected_state"),
    [
        (
            "RAVI_PARTIAL_READY",
            IntentGoal.ACCESS_SOME_PF_FUNDS,
            80_000,
            "PASS",
        ),
        (
            "PRIYA_TRANSFER_MISSING_EXIT",
            IntentGoal.TRANSFER_PF_AFTER_EMPLOYMENT_CHANGE,
            None,
            "ACTION_REQUIRED",
        ),
        (
            "ARJUN_FINAL_SETTLEMENT",
            IntentGoal.FINAL_PF_SETTLEMENT,
            None,
            "POLICY_REVIEW_REQUIRED",
        ),
    ],
)
def test_reference_persona_decision_state_is_unchanged(
    persona_id: str,
    goal: IntentGoal,
    amount: int | None,
    expected_state: str,
) -> None:
    service, journey_id, decision_id, container = _evaluated_service(
        persona_id=persona_id,
        goal=goal,
        requested_amount_rupees=amount,
    )
    before = container.journey_service.decision_detail(
        journey_id,
        decision_id,
    ).evaluation.journey_decision

    service.explain(journey_id, decision_id, ExplanationMode.HINDI)

    after = container.journey_service.decision_detail(
        journey_id,
        decision_id,
    ).evaluation.journey_decision
    assert before.state.value == expected_state
    assert after == before
