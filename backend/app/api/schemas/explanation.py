"""Closed public contract for optional decision explanations."""

from typing import Annotated, Literal

from pydantic import Field

from app.application import ExplanationMode, ExplanationResult

from .common import ApiModel, DemoMetadata

ExplanationPoint = Annotated[str, Field(min_length=1, max_length=180)]


class CreateExplanationRequest(ApiModel):
    mode: ExplanationMode


class ExplanationResponse(ApiModel):
    decision_id: str = Field(min_length=1)
    mode: ExplanationMode
    title: str = Field(min_length=1, max_length=80)
    summary: str = Field(min_length=1, max_length=600)
    points: tuple[ExplanationPoint, ...] = Field(min_length=1, max_length=4)
    disclaimer: str = Field(min_length=1, max_length=300)
    ai_used_for_decision: Literal[False]
    ai_used_for_explanation: bool
    fallback_used: bool
    demo: DemoMetadata = DemoMetadata()

    @classmethod
    def from_result(cls, result: ExplanationResult) -> "ExplanationResponse":
        return cls(
            decision_id=result.decision_id,
            mode=result.mode,
            title=result.content.title,
            summary=result.content.summary,
            points=result.content.points,
            disclaimer=result.content.disclaimer,
            ai_used_for_decision=result.ai_used_for_decision,
            ai_used_for_explanation=result.ai_used_for_explanation,
            fallback_used=result.fallback_used,
        )
