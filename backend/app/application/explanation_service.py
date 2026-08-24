"""Downstream, non-authoritative explanation orchestration."""

from __future__ import annotations

import re
from dataclasses import dataclass
from enum import Enum
from typing import Annotated, Any, Literal, Protocol

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.domain import DecisionState

from .journey_service import JourneyEvaluationView, JourneyService


class ExplanationMode(str, Enum):
    """Closed set of citizen-selectable explanation transformations."""

    SIMPLE_ENGLISH = "SIMPLE_ENGLISH"
    HINDI = "HINDI"


ShortText = Annotated[str, Field(min_length=1, max_length=180)]


class CanonicalExplanation(BaseModel):
    """Authoritative deterministic explanation of one stored decision."""

    model_config = ConfigDict(
        extra="forbid",
        frozen=True,
        str_strip_whitespace=True,
    )

    decision_id: str = Field(min_length=1)
    journey_label: str = Field(min_length=1, max_length=120)
    decision_state: DecisionState
    state_label: str = Field(min_length=1, max_length=120)
    summary: str = Field(min_length=1, max_length=600)
    prerequisite_summaries: tuple[ShortText, ...]
    issue_summaries: tuple[ShortText, ...]
    resolution_summary: str | None = Field(default=None, max_length=240)
    official_process: str | None = Field(default=None, max_length=120)
    safety_notes: tuple[ShortText, ...]
    source_ids: tuple[str, ...]


class SanitizedExplanationInput(BaseModel):
    """Positive allowlist and the only decision data an AI provider receives."""

    model_config = ConfigDict(
        extra="forbid",
        frozen=True,
        str_strip_whitespace=True,
    )

    journey_label: str = Field(min_length=1, max_length=120)
    decision_state: DecisionState
    state_label: str = Field(min_length=1, max_length=120)
    summary: str = Field(min_length=1, max_length=600)
    prerequisite_summaries: tuple[ShortText, ...]
    issue_summaries: tuple[ShortText, ...]
    resolution_summary: str | None = Field(default=None, max_length=240)
    official_process: str | None = Field(default=None, max_length=120)
    safety_notes: tuple[ShortText, ...]
    source_ids: tuple[str, ...]


class ExplanationContent(BaseModel):
    """Strict structured content returned by a provider or deterministic fallback."""

    model_config = ConfigDict(
        extra="forbid",
        frozen=True,
        str_strip_whitespace=True,
    )

    title: str = Field(min_length=1, max_length=80)
    summary: str = Field(min_length=1, max_length=600)
    points: tuple[ShortText, ...] = Field(min_length=1, max_length=4)
    disclaimer: str = Field(min_length=1, max_length=300)

    @field_validator("summary")
    @classmethod
    def limit_summary_sentences(cls, value: str) -> str:
        sentence_endings = re.findall(r"[.!?।](?:\s|$)", value)
        if len(sentence_endings) > 3:
            raise ValueError("summary must contain at most three sentences")
        return value


class ExplanationProvider(Protocol):
    """Narrow infrastructure boundary for optional explanation transforms."""

    def generate(
        self,
        input: SanitizedExplanationInput,
        mode: ExplanationMode,
    ) -> ExplanationContent: ...


class UnsafeExplanationError(ValueError):
    """Provider output introduced authority not present in canonical input."""


@dataclass(frozen=True)
class ExplanationResult:
    decision_id: str
    mode: ExplanationMode
    content: ExplanationContent
    ai_used_for_decision: Literal[False]
    ai_used_for_explanation: bool
    fallback_used: bool


_STATE_LABELS: dict[DecisionState, str] = {
    DecisionState.PASS: "Ready to proceed",
    DecisionState.ACTION_REQUIRED: "Action required",
    DecisionState.NOT_ELIGIBLE: "Not currently eligible",
    DecisionState.UNABLE_TO_VERIFY: "Unable to verify",
    DecisionState.NOT_APPLICABLE: "This journey does not currently apply",
    DecisionState.POLICY_REVIEW_REQUIRED: "Policy verification required",
}

_STATE_SUMMARIES: dict[DecisionState, str] = {
    DecisionState.PASS: (
        "All prerequisites represented in this configured ClaimSaathi journey "
        "currently pass."
    ),
    DecisionState.ACTION_REQUIRED: (
        "One or more configured prerequisites need attention before this "
        "journey can proceed."
    ),
    DecisionState.NOT_ELIGIBLE: (
        "A configured prerequisite is not currently met for this journey."
    ),
    DecisionState.UNABLE_TO_VERIFY: (
        "ClaimSaathi could not verify all required trusted information."
    ),
    DecisionState.NOT_APPLICABLE: (
        "A configured fact indicates that this journey does not currently apply."
    ),
    DecisionState.POLICY_REVIEW_REQUIRED: (
        "ClaimSaathi cannot safely determine this from the currently reviewed "
        "policy configuration."
    ),
}

_ISSUE_SUMMARIES = {
    "EXIT_DATE_MISSING": "Previous employment Date of Exit is missing.",
}

_ALWAYS_PROHIBITED_PATTERNS = (
    re.compile(
        r"\b(?:you|your\s+claim|this\s+claim|the\s+claim|request)\s+"
        r"(?:are|is|was|has\s+been)\s+(?:approved|rejected)\b",
        re.IGNORECASE,
    ),
    re.compile(r"(?:^|[.!?]\s*)(?:approved|rejected)[.!?]", re.IGNORECASE),
    re.compile(r"(?:आप|दावा).{0,24}(?:स्वीकृत|मंजूर|अस्वीकृत)(?:\s+हैं|\s+है|\s+हो गया)"),
    re.compile(
        r"\b(?:guaranteed?|definitely\s+succeed|certain\s+to\s+succeed)\b",
        re.IGNORECASE,
    ),
    re.compile(r"(?:गारंटी|निश्चित\s+रूप\s+से\s+सफल|सफलता\s+निश्चित)"),
    re.compile(
        r"\b(?:you\s+are|you're)\s+(?:not\s+)?eligible\b",
        re.IGNORECASE,
    ),
    re.compile(r"आप\s+(?:पात्र|अपात्र)\s+हैं"),
    re.compile(r"(?:https?://|www\.)", re.IGNORECASE),
    re.compile(r"<[^>]+>"),
    re.compile(r"\[[^\]]+\]\([^)]+\)"),
)

_NUMBERED_AUTHORITY_PATTERNS = (
    re.compile(
        r"(?:₹|\b(?:rs\.?|inr|rupees?)\s*)\s*[\d,]+(?:\.\d+)?",
        re.IGNORECASE,
    ),
    re.compile(r"\b\d+(?:\.\d+)?\s*(?:%|percent|percentage|प्रतिशत)\b", re.IGNORECASE),
    re.compile(
        r"\b\d+\s*(?:days?|weeks?|months?|years?|दिन|हफ्ते|सप्ताह|महीने?|वर्ष)\b",
        re.IGNORECASE,
    ),
    re.compile(r"\b\d{1,4}[-/.]\d{1,2}[-/.]\d{1,4}\b"),
    re.compile(
        r"\b(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|"
        r"jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|"
        r"dec(?:ember)?)\s+\d{1,2}(?:,\s*\d{4})?\b",
        re.IGNORECASE,
    ),
)

_ACTION_PATTERNS = (
    re.compile(
        r"(?:^|[.!?]\s*)(?:please\s+)?(?:submit|apply|upload|contact|visit|"
        r"call|withdraw|file|update|change|correct)\b",
        re.IGNORECASE,
    ),
    re.compile(
        r"\b(?:you|the\s+citizen)\s+(?:should|must|can|need\s+to)\s+"
        r"(?:submit|apply|upload|contact|visit|call|withdraw|file|update|"
        r"change|correct)\b",
        re.IGNORECASE,
    ),
    re.compile(r"(?:जमा\s+करें|आवेदन\s+करें|अपलोड\s+करें|संपर्क\s+करें|निकालें|बदलें|सुधारें)"),
)

_FORM_PATTERN = re.compile(r"\bForm\s+\d+[A-Za-z]?\b", re.IGNORECASE)


def build_canonical_explanation(
    view: JourneyEvaluationView,
) -> CanonicalExplanation:
    """Project stored decision artifacts into approved presentation facts only."""

    record = view.evaluation.decision_record
    state = record.journey_state
    issue_summaries = tuple(
        _ISSUE_SUMMARIES.get(
            issue_code,
            "A journey prerequisite needs attention.",
        )
        for issue_code in record.issue_codes
    )
    resolution_summary = (
        "Use the configured resolution shown by ClaimSaathi for this recorded issue."
        if view.evaluation.journey_decision.resolution_ids
        else None
    )
    official_process = view.definition.official_process_label
    summary = _STATE_SUMMARIES[state]
    if state is DecisionState.PASS:
        summary = f"{summary} The process identified for this demo is {official_process}."

    return CanonicalExplanation(
        decision_id=record.decision_id,
        journey_label=view.definition.display_name,
        decision_state=state,
        state_label=_STATE_LABELS[state],
        summary=summary,
        prerequisite_summaries=tuple(
            f"{item.label}: {_STATE_LABELS[DecisionState(item.state)]}."
            for item in view.prerequisites
        ),
        issue_summaries=issue_summaries,
        resolution_summary=resolution_summary,
        official_process=official_process,
        safety_notes=(
            "This is a ClaimSaathi journey result, not a government approval or rejection.",
            "AI did not determine this result.",
        ),
        source_ids=record.source_ids,
    )


def sanitize_explanation(
    canonical: CanonicalExplanation,
) -> SanitizedExplanationInput:
    """Copy only explicitly approved canonical fields across the AI boundary."""

    prerequisite_summaries = tuple(
        summary
        for summary in canonical.prerequisite_summaries
        if not any(
            sensitive_label in summary.casefold()
            for sensitive_label in ("aadhaar", "uan", "pan")
        )
    )
    return SanitizedExplanationInput(
        journey_label=canonical.journey_label,
        decision_state=canonical.decision_state,
        state_label=canonical.state_label,
        summary=canonical.summary,
        prerequisite_summaries=prerequisite_summaries,
        issue_summaries=canonical.issue_summaries,
        resolution_summary=canonical.resolution_summary,
        official_process=canonical.official_process,
        safety_notes=canonical.safety_notes,
        source_ids=canonical.source_ids,
    )


def _all_text(content: ExplanationContent) -> str:
    return " ".join(
        (content.title, content.summary, *content.points, content.disclaimer)
    )


def _canonical_text(input: SanitizedExplanationInput) -> str:
    return " ".join(
        (
            input.journey_label,
            input.state_label,
            input.summary,
            *input.prerequisite_summaries,
            *input.issue_summaries,
            input.resolution_summary or "",
            input.official_process or "",
            *input.safety_notes,
            *input.source_ids,
        )
    )


def validate_explanation_output(
    content: ExplanationContent,
    input: SanitizedExplanationInput,
    mode: ExplanationMode,
) -> None:
    """Conservatively reject new authoritative claims or instructions."""

    output_text = _all_text(content)
    canonical_text = _canonical_text(input)

    if any(pattern.search(output_text) for pattern in _ALWAYS_PROHIBITED_PATTERNS):
        raise UnsafeExplanationError("prohibited authoritative claim")

    for pattern in _NUMBERED_AUTHORITY_PATTERNS:
        for match in pattern.findall(output_text):
            rendered = "".join(match) if isinstance(match, tuple) else match
            if rendered.casefold() not in canonical_text.casefold():
                raise UnsafeExplanationError("new numeric authoritative fact")

    allowed_forms = {
        form.casefold() for form in _FORM_PATTERN.findall(canonical_text)
    }
    generated_forms = {
        form.casefold() for form in _FORM_PATTERN.findall(output_text)
    }
    if not generated_forms.issubset(allowed_forms):
        raise UnsafeExplanationError("new government form identifier")

    for pattern in _ACTION_PATTERNS:
        for match in pattern.findall(output_text):
            rendered = "".join(match) if isinstance(match, tuple) else match
            if rendered.casefold() not in canonical_text.casefold():
                raise UnsafeExplanationError("new resolution action")

    if input.decision_state is not DecisionState.PASS and re.search(
        r"(?:ready\s+to\s+proceed|journey\s+is\s+ready|आगे\s+बढ़ने\s+के\s+लिए\s+तैयार)",
        output_text,
        re.IGNORECASE,
    ):
        raise UnsafeExplanationError("decision state was strengthened")

    if input.decision_state is DecisionState.POLICY_REVIEW_REQUIRED:
        if re.search(
            r"(?:submit\s+now|ready\s+to\s+submit|policy\s+interpretation\s+is\s+correct|"
            r"अभी\s+जमा\s+करें|जमा\s+करने\s+के\s+लिए\s+तैयार|नीति\s+की\s+व्याख्या\s+सही\s+है)",
            output_text,
            re.IGNORECASE,
        ):
            raise UnsafeExplanationError("policy safe stop was removed")
        preserves_stop = (
            re.search(r"\b(?:cannot|can't|unable)\b", output_text, re.IGNORECASE)
            and re.search(r"\bpolicy\b", output_text, re.IGNORECASE)
        ) or ("नहीं" in output_text and "नीति" in output_text)
        if not preserves_stop:
            raise UnsafeExplanationError("policy safe stop was not preserved")

    if mode is ExplanationMode.HINDI and not re.search(
        r"[\u0900-\u097F]",
        output_text,
    ):
        raise UnsafeExplanationError("Hindi mode did not produce Hindi text")


def deterministic_fallback(
    canonical: CanonicalExplanation,
    mode: ExplanationMode,
) -> ExplanationContent:
    """Return approved wording without any provider dependency."""

    if mode is ExplanationMode.SIMPLE_ENGLISH:
        points = canonical.issue_summaries or canonical.prerequisite_summaries[:4]
        if canonical.resolution_summary and len(points) < 4:
            points = (*points, canonical.resolution_summary)
        if not points:
            points = (canonical.state_label,)
        return ExplanationContent(
            title=canonical.state_label,
            summary=canonical.summary,
            points=points[:4],
            disclaimer=(
                "This explanation does not change the stored result. "
                "AI did not determine the decision."
            ),
        )

    hindi_summary = {
        DecisionState.PASS: (
            "कॉन्फ़िगर की गई ClaimSaathi जाँचों में सभी आवश्यक शर्तें वर्तमान में "
            "पूरी हैं। पहचानी गई प्रक्रिया "
            f"{canonical.official_process} है।"
        ),
        DecisionState.ACTION_REQUIRED: (
            "एक या अधिक कॉन्फ़िगर की गई आवश्यक शर्तों पर ध्यान देना ज़रूरी है। "
            "यह यात्रा अभी आगे नहीं बढ़ सकती।"
        ),
        DecisionState.NOT_ELIGIBLE: (
            "इस यात्रा की एक कॉन्फ़िगर की गई आवश्यक शर्त अभी पूरी नहीं है।"
        ),
        DecisionState.UNABLE_TO_VERIFY: (
            "ClaimSaathi सभी ज़रूरी भरोसेमंद जानकारी की पुष्टि नहीं कर सका।"
        ),
        DecisionState.NOT_APPLICABLE: (
            "एक कॉन्फ़िगर किया गया तथ्य बताता है कि यह यात्रा अभी लागू नहीं होती।"
        ),
        DecisionState.POLICY_REVIEW_REQUIRED: (
            "ClaimSaathi अभी समीक्षा की गई नीति कॉन्फ़िगरेशन के आधार पर इसे सुरक्षित "
            "रूप से निर्धारित नहीं कर सकता।"
        ),
    }[canonical.decision_state]
    hindi_title = {
        DecisionState.PASS: "ClaimSaathi जाँच पूरी हुई",
        DecisionState.ACTION_REQUIRED: "अभी ध्यान देना ज़रूरी है",
        DecisionState.NOT_ELIGIBLE: "एक आवश्यक शर्त पूरी नहीं है",
        DecisionState.UNABLE_TO_VERIFY: "पुष्टि नहीं हो सकी",
        DecisionState.NOT_APPLICABLE: "यह यात्रा अभी लागू नहीं होती",
        DecisionState.POLICY_REVIEW_REQUIRED: "नीति की पुष्टि ज़रूरी है",
    }[canonical.decision_state]
    points: tuple[str, ...]
    if canonical.issue_summaries:
        points = ("पिछली नौकरी की Date of Exit दर्ज नहीं है।",)
    elif canonical.decision_state is DecisionState.POLICY_REVIEW_REQUIRED:
        points = ("सिस्टम ने अनिश्चितता को सुरक्षित रूप से बनाए रखा है।",)
    else:
        points = ("यह विवरण केवल स्टोर किए गए ClaimSaathi परिणाम पर आधारित है।",)
    if canonical.resolution_summary and len(points) < 4:
        points = (*points, "ClaimSaathi में दिखाई गई कॉन्फ़िगर की गई समाधान प्रक्रिया देखें।")
    return ExplanationContent(
        title=hindi_title,
        summary=hindi_summary,
        points=points,
        disclaimer=(
            "यह सरकारी स्वीकृति या सरकारी परिणाम नहीं है। AI ने यह निर्णय नहीं लिया।"
        ),
    )


class ExplanationService:
    """Explain an immutable decision and fail quickly to deterministic wording."""

    def __init__(
        self,
        *,
        journey_service: JourneyService,
        provider: ExplanationProvider | None,
    ) -> None:
        self._journey_service = journey_service
        self._provider = provider

    def explain(
        self,
        journey_instance_id: str,
        decision_id: str,
        mode: ExplanationMode,
    ) -> ExplanationResult:
        view = self._journey_service.decision_detail(
            journey_instance_id,
            decision_id,
        )
        canonical = build_canonical_explanation(view)
        sanitized = sanitize_explanation(canonical)

        if self._provider is not None:
            try:
                generated = ExplanationContent.model_validate(
                    self._provider.generate(sanitized, mode)
                )
                validate_explanation_output(generated, sanitized, mode)
            except Exception:
                pass
            else:
                return ExplanationResult(
                    decision_id=canonical.decision_id,
                    mode=mode,
                    content=generated,
                    ai_used_for_decision=False,
                    ai_used_for_explanation=True,
                    fallback_used=False,
                )

        return ExplanationResult(
            decision_id=canonical.decision_id,
            mode=mode,
            content=deterministic_fallback(canonical, mode),
            ai_used_for_decision=False,
            ai_used_for_explanation=False,
            fallback_used=True,
        )


def provider_input_dict(input: SanitizedExplanationInput) -> dict[str, Any]:
    """Expose the exact JSON-safe allowlist used by provider adapters."""

    return input.model_dump(mode="json")
