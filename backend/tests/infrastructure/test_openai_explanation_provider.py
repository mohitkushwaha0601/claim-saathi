"""Exact outbound OpenAI Responses API request contract."""

from __future__ import annotations

import json
from types import SimpleNamespace
from typing import Any

from app.application import (
    ExplanationContent,
    ExplanationMode,
    SanitizedExplanationInput,
)
from app.domain import DecisionState
from app.infrastructure.integrations import OpenAIExplanationProvider


class RecordingResponses:
    def __init__(self, output: ExplanationContent) -> None:
        self.output = output
        self.calls: list[dict[str, Any]] = []

    def parse(self, **kwargs: Any) -> SimpleNamespace:
        self.calls.append(kwargs)
        return SimpleNamespace(output_parsed=self.output)


def test_provider_uses_responses_structured_output_and_no_tools() -> None:
    output = ExplanationContent(
        title="Recorded result",
        summary="The stored checks currently pass.",
        points=("The identified process is Form 31.",),
        disclaimer="AI did not determine the decision.",
    )
    responses = RecordingResponses(output)
    client = SimpleNamespace(responses=responses)
    sanitized = SanitizedExplanationInput(
        journey_label="Partial withdrawal",
        decision_state=DecisionState.PASS,
        state_label="Ready to proceed",
        summary="The configured checks currently pass.",
        prerequisite_summaries=("Bank ready: Ready to proceed.",),
        issue_summaries=(),
        resolution_summary=None,
        official_process="Form 31",
        safety_notes=("AI did not determine this result.",),
        source_ids=("SRC-EPFO-PARTIAL-2026",),
    )
    provider = OpenAIExplanationProvider(
        api_key="not-used-by-mock",
        model="gpt-5.6-luna",
        timeout_seconds=4.0,
        client=client,
    )

    result = provider.generate(sanitized, ExplanationMode.SIMPLE_ENGLISH)

    assert result == output
    assert len(responses.calls) == 1
    request = responses.calls[0]
    assert request["model"] == "gpt-5.6-luna"
    assert request["text_format"] is ExplanationContent
    assert request["tools"] == []
    assert request["tool_choice"] == "none"
    assert request["parallel_tool_calls"] is False
    assert request["store"] is False
    assert request["timeout"] == 4.0
    assert request["reasoning"] == {"effort": "low"}
    assert request["verbosity"] == "low"
    assert len(request["input"]) == 1
    payload = json.loads(request["input"][0]["content"])
    assert payload == sanitized.model_dump(mode="json")
    serialized = request["input"][0]["content"].casefold()
    assert all(
        forbidden not in serialized
        for forbidden in (
            "citizen_state",
            "citizen_id",
            "aadhaar",
            "uan",
            "pan",
            "bank_account",
            "balance",
            "requested_amount",
            "exit_date",
            "service_months",
        )
    )


def test_explanation_schema_is_closed_and_bounded() -> None:
    schema = ExplanationContent.model_json_schema()

    assert schema["additionalProperties"] is False
    assert set(schema["required"]) == {
        "title",
        "summary",
        "points",
        "disclaimer",
    }
    assert schema["properties"]["title"]["maxLength"] == 80
    assert schema["properties"]["summary"]["maxLength"] == 600
    assert schema["properties"]["points"]["minItems"] == 1
    assert schema["properties"]["points"]["maxItems"] == 4
