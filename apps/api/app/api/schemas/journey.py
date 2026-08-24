"""Public journey requests and presentation-safe decision responses."""

from datetime import datetime
from typing import Annotated, Literal

from pydantic import Field

from app.application.journey_service import (
    JourneyEvaluationView,
    JourneySessionView,
)
from app.domain import DecisionState, IntentGoal, JourneyId, RuleResult

from .common import (
    ApiModel,
    DemoMetadata,
    OfficialProcessResponse,
    state_display_label,
)

NonNegativeRupees = Annotated[int, Field(ge=0, strict=True)]


class CreateJourneyRequest(ApiModel):
    persona_id: str = Field(
        min_length=1,
        max_length=64,
        pattern=r"^[A-Z0-9_]+$",
    )
    goal: IntentGoal
    requested_amount_rupees: NonNegativeRupees | None = None


class DecisionSummaryResponse(ApiModel):
    decision_id: str
    state: DecisionState
    state_display: str
    issue_codes: tuple[str, ...]
    resolution_ids: tuple[str, ...]
    citizen_state_revision: int
    evaluated_at: datetime

    @classmethod
    def from_view(
        cls,
        view: JourneyEvaluationView,
    ) -> "DecisionSummaryResponse":
        decision = view.evaluation.journey_decision
        record = view.evaluation.decision_record
        return cls(
            decision_id=decision.decision_id,
            state=decision.state,
            state_display=state_display_label(decision.state),
            issue_codes=decision.issue_codes,
            resolution_ids=decision.resolution_ids,
            citizen_state_revision=record.citizen_state_revision,
            evaluated_at=record.evaluated_at,
        )


class PrerequisiteResponse(ApiModel):
    node_id: str
    label: str
    state: DecisionState
    state_display: str


class RuleResultResponse(ApiModel):
    rule_id: str
    state: DecisionState
    issue_code: str | None
    resolution_id: str | None
    source_id: str | None
    policy_version: str

    @classmethod
    def from_rule_result(cls, result: RuleResult) -> "RuleResultResponse":
        return cls(
            rule_id=result.rule_id,
            state=result.state,
            issue_code=result.issue_code,
            resolution_id=result.resolution_id,
            source_id=result.source_id,
            policy_version=result.policy_version,
        )


class JourneyCreatedResponse(ApiModel):
    journey_instance_id: str
    persona_id: str
    citizen_goal: IntentGoal
    journey_id: JourneyId
    journey_definition_version: int
    created_at: datetime
    official_process: OfficialProcessResponse
    citizen_state_revision: int
    demo: DemoMetadata = DemoMetadata()

    @classmethod
    def from_view(cls, view: JourneySessionView) -> "JourneyCreatedResponse":
        instance = view.journey_instance
        return cls(
            journey_instance_id=instance.journey_instance_id,
            persona_id=view.persona_id.value,
            citizen_goal=instance.citizen_goal,
            journey_id=instance.journey_id,
            journey_definition_version=instance.journey_definition_version,
            created_at=instance.created_at,
            official_process=OfficialProcessResponse(
                label=view.definition.official_process_label,
                source_id=view.definition.official_process_source_id,
            ),
            citizen_state_revision=view.citizen_state.state_revision,
        )


class JourneyResponse(JourneyCreatedResponse):
    latest_decision: DecisionSummaryResponse | None

    @classmethod
    def from_view(cls, view: JourneySessionView) -> "JourneyResponse":
        created = JourneyCreatedResponse.from_view(view)
        latest = None
        if view.latest_evaluation is not None:
            latest = DecisionSummaryResponse.from_view(
                JourneyEvaluationView(
                    persona_id=view.persona_id,
                    journey_instance=view.journey_instance,
                    definition=view.definition,
                    evaluation=view.latest_evaluation,
                    prerequisites=(),
                )
            )
        return cls(
            **created.model_dump(),
            latest_decision=latest,
        )


class JourneyEvaluationResponse(ApiModel):
    journey_instance_id: str
    decision_id: str
    journey_id: JourneyId
    state: DecisionState
    state_display: str
    official_process: OfficialProcessResponse
    issue_codes: tuple[str, ...]
    resolution_ids: tuple[str, ...]
    policy_version: str
    graph_version: str
    journey_definition_version: int
    citizen_state_revision: int
    evaluated_at: datetime
    prerequisites: tuple[PrerequisiteResponse, ...]
    sources: tuple[str, ...]
    ai_used_for_decision: Literal[False]
    demo: DemoMetadata = DemoMetadata()

    @classmethod
    def from_view(
        cls,
        view: JourneyEvaluationView,
    ) -> "JourneyEvaluationResponse":
        decision = view.evaluation.journey_decision
        record = view.evaluation.decision_record
        return cls(
            journey_instance_id=view.journey_instance.journey_instance_id,
            decision_id=decision.decision_id,
            journey_id=decision.journey_id,
            state=decision.state,
            state_display=state_display_label(decision.state),
            official_process=OfficialProcessResponse(
                label=view.definition.official_process_label,
                source_id=view.definition.official_process_source_id,
            ),
            issue_codes=decision.issue_codes,
            resolution_ids=decision.resolution_ids,
            policy_version=decision.policy_version,
            graph_version=decision.graph_version,
            journey_definition_version=decision.journey_definition_version,
            citizen_state_revision=record.citizen_state_revision,
            evaluated_at=record.evaluated_at,
            prerequisites=tuple(
                PrerequisiteResponse(
                    node_id=item.node_id,
                    label=item.label,
                    state=DecisionState(item.state),
                    state_display=state_display_label(
                        DecisionState(item.state)
                    ),
                )
                for item in view.prerequisites
            ),
            sources=record.source_ids,
            ai_used_for_decision=record.ai_used_for_decision,
        )


class DecisionHistoryResponse(ApiModel):
    journey_instance_id: str
    decisions: tuple[DecisionSummaryResponse, ...]
    demo: DemoMetadata = DemoMetadata()


class DecisionDetailResponse(JourneyEvaluationResponse):
    rule_results: tuple[RuleResultResponse, ...]

    @classmethod
    def from_view(cls, view: JourneyEvaluationView) -> "DecisionDetailResponse":
        base = JourneyEvaluationResponse.from_view(view)
        return cls(
            **base.model_dump(),
            rule_results=tuple(
                RuleResultResponse.from_rule_result(result)
                for result in view.evaluation.decision_record.rule_results
            ),
        )
