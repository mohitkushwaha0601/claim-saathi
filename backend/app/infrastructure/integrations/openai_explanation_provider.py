"""OpenAI Responses API adapter for non-authoritative explanations only."""

from __future__ import annotations

import json
from typing import Any

from openai import OpenAI

from app.application.explanation_service import (
    ExplanationContent,
    ExplanationMode,
    SanitizedExplanationInput,
    provider_input_dict,
)


_BASE_INSTRUCTIONS = """You provide a low-authority explanation of an already stored ClaimSaathi decision.
Restate only the supplied sanitized facts. Do not infer eligibility. Do not add government requirements, policy interpretations, amounts, dates, percentages, durations, form identifiers, links, or actions. Do not alter or strengthen the decision state. Preserve uncertainty and keep official-process semantics unchanged. Never claim approval, rejection, payment, or a guaranteed outcome. Return only the requested structured content."""

_MODE_INSTRUCTIONS = {
    ExplanationMode.SIMPLE_ENGLISH: (
        "Use short, plain English. Simplify the canonical meaning without "
        "adding or removing facts."
    ),
    ExplanationMode.HINDI: (
        "Use natural, readable Hindi. Translate and simplify the canonical "
        "meaning without reinterpreting it. Preserve identifiers such as "
        "Form 31, Form 13, and Form 19 exactly when supplied."
    ),
}


class OpenAIExplanationProvider:
    """Schema-constrained provider with no model tools and no retry loop."""

    def __init__(
        self,
        *,
        api_key: str,
        model: str,
        timeout_seconds: float,
        client: Any | None = None,
    ) -> None:
        self._model = model
        self._timeout_seconds = timeout_seconds
        self._client = client or OpenAI(
            api_key=api_key,
            timeout=timeout_seconds,
            max_retries=0,
        )

    def generate(
        self,
        input: SanitizedExplanationInput,
        mode: ExplanationMode,
    ) -> ExplanationContent:
        sanitized_json = json.dumps(
            provider_input_dict(input),
            ensure_ascii=False,
            separators=(",", ":"),
        )
        response = self._client.responses.parse(
            model=self._model,
            instructions=f"{_BASE_INSTRUCTIONS}\n{_MODE_INSTRUCTIONS[mode]}",
            input=[
                {
                    "role": "user",
                    "content": sanitized_json,
                }
            ],
            text_format=ExplanationContent,
            tools=[],
            tool_choice="none",
            parallel_tool_calls=False,
            max_output_tokens=500,
            reasoning={"effort": "low"},
            verbosity="low",
            store=False,
            timeout=self._timeout_seconds,
        )
        parsed = response.output_parsed
        if parsed is None:
            raise ValueError("OpenAI returned no structured explanation")
        return ExplanationContent.model_validate(parsed)
