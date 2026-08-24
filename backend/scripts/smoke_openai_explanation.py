"""Explicit opt-in smoke test for the real explanation provider."""

from __future__ import annotations

import os

from app.application import (
    ExplanationMode,
    SanitizedExplanationInput,
)
from app.application.explanation_service import validate_explanation_output
from app.domain import DecisionState
from app.infrastructure.integrations import OpenAIExplanationProvider


def main() -> None:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise SystemExit("OPENAI_API_KEY is not configured; smoke test skipped.")
    model = os.getenv("AI_MODEL", "gpt-5.6-luna")
    timeout_seconds = float(
        os.getenv("AI_TIMEOUT_SECONDS", "5.0")
    )
    sanitized = SanitizedExplanationInput(
        journey_label="Partial withdrawal",
        decision_state=DecisionState.PASS,
        state_label="Ready to proceed",
        summary=(
            "All prerequisites represented in this configured ClaimSaathi "
            "journey currently pass. The process identified for this demo is "
            "Form 31."
        ),
        prerequisite_summaries=("Bank ready: Ready to proceed.",),
        issue_summaries=(),
        resolution_summary=None,
        official_process="Form 31",
        safety_notes=("AI did not determine this result.",),
        source_ids=("SRC-EPFO-PARTIAL-2026",),
    )
    provider = OpenAIExplanationProvider(
        api_key=api_key,
        model=model,
        timeout_seconds=timeout_seconds,
    )
    content = provider.generate(sanitized, ExplanationMode.SIMPLE_ENGLISH)
    validate_explanation_output(
        content,
        sanitized,
        ExplanationMode.SIMPLE_ENGLISH,
    )
    print("Manual OpenAI explanation smoke test passed.")


if __name__ == "__main__":
    main()
