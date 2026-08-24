"""Typed, presentation-safe responses for observational execution traces."""

from datetime import datetime
from typing import Annotated, Literal

from pydantic import Field

from app.application.execution_trace_service import (
    DecisionRecordTraceDetailsView,
    ExecutionTraceStageView,
    ExecutionTraceView,
    IntentTraceDetailsView,
    PlannerMethod,
    PlannerTraceDetailsView,
    PolicyEngineTraceDetailsView,
    PrerequisiteGraphTraceDetailsView,
    TraceStageState,
    TraceStageType,
)
from app.domain import DecisionState, IntentGoal, JourneyId

from .common import ApiModel, DemoMetadata, OfficialProcessResponse


class TraceRuleResponse(ApiModel):
    rule_id: str
    state: DecisionState
    issue_code: str | None
    source_id: str | None


class TraceGraphNodeResponse(ApiModel):
    node_id: str
    label: str
    state: DecisionState
    children_ids: tuple[str, ...]
    rule_id: str | None


class IntentTraceDetailsResponse(ApiModel):
    detail_type: Literal["INTENT"] = "INTENT"
    citizen_goal: IntentGoal
    ai_used: Literal[False]


class PlannerTraceDetailsResponse(ApiModel):
    detail_type: Literal["JOURNEY_PLANNER"] = "JOURNEY_PLANNER"
    citizen_goal: IntentGoal
    journey_id: JourneyId
    method: PlannerMethod
    ai_used: Literal[False]


class PolicyEngineTraceDetailsResponse(ApiModel):
    detail_type: Literal["POLICY_ENGINE"] = "POLICY_ENGINE"
    policy_version: str
    rules: tuple[TraceRuleResponse, ...]
    ai_used: Literal[False]


class PrerequisiteGraphTraceDetailsResponse(ApiModel):
    detail_type: Literal["PREREQUISITE_GRAPH"] = "PREREQUISITE_GRAPH"
    graph_version: str
    root_node_id: str
    nodes: tuple[TraceGraphNodeResponse, ...]
    ai_used: Literal[False]


class DecisionRecordTraceDetailsResponse(ApiModel):
    detail_type: Literal["DECISION_RECORD"] = "DECISION_RECORD"
    decision_id: str
    citizen_state_revision: int
    policy_version: str
    graph_version: str
    journey_definition_version: int
    evaluated_at: datetime
    ai_used_for_decision: Literal[False]


TraceStageDetailsResponse = Annotated[
    IntentTraceDetailsResponse
    | PlannerTraceDetailsResponse
    | PolicyEngineTraceDetailsResponse
    | PrerequisiteGraphTraceDetailsResponse
    | DecisionRecordTraceDetailsResponse,
    Field(discriminator="detail_type"),
]


_TRACE_STATE_LABELS: dict[TraceStageState, str] = {
    TraceStageState.RECORDED: "Recorded",
    TraceStageState.PASS: "Ready",
    TraceStageState.ACTION_REQUIRED: "Action required",
    TraceStageState.NOT_ELIGIBLE: "Not currently eligible",
    TraceStageState.UNABLE_TO_VERIFY: "Unable to verify",
    TraceStageState.NOT_APPLICABLE: "Does not currently apply",
    TraceStageState.POLICY_REVIEW_REQUIRED: "Policy review required",
}


class ExecutionTraceStageResponse(ApiModel):
    stage_id: TraceStageType
    stage_type: TraceStageType
    label: str
    state: TraceStageState
    state_display: str
    short_description: str
    input_summary: str
    output_summary: str
    details: TraceStageDetailsResponse

    @classmethod
    def from_view(
        cls,
        view: ExecutionTraceStageView,
    ) -> "ExecutionTraceStageResponse":
        details = view.details
        if isinstance(details, IntentTraceDetailsView):
            response_details: TraceStageDetailsResponse = (
                IntentTraceDetailsResponse(
                    citizen_goal=details.citizen_goal,
                    ai_used=details.ai_used,
                )
            )
        elif isinstance(details, PlannerTraceDetailsView):
            response_details = PlannerTraceDetailsResponse(
                citizen_goal=details.citizen_goal,
                journey_id=details.journey_id,
                method=details.method,
                ai_used=details.ai_used,
            )
        elif isinstance(details, PolicyEngineTraceDetailsView):
            response_details = PolicyEngineTraceDetailsResponse(
                policy_version=details.policy_version,
                rules=tuple(
                    TraceRuleResponse(
                        rule_id=rule.rule_id,
                        state=rule.state,
                        issue_code=rule.issue_code,
                        source_id=rule.source_id,
                    )
                    for rule in details.rules
                ),
                ai_used=details.ai_used,
            )
        elif isinstance(details, PrerequisiteGraphTraceDetailsView):
            response_details = PrerequisiteGraphTraceDetailsResponse(
                graph_version=details.graph_version,
                root_node_id=details.root_node_id,
                nodes=tuple(
                    TraceGraphNodeResponse(
                        node_id=node.node_id,
                        label=node.label,
                        state=node.state,
                        children_ids=node.children_ids,
                        rule_id=node.rule_id,
                    )
                    for node in details.nodes
                ),
                ai_used=details.ai_used,
            )
        elif isinstance(details, DecisionRecordTraceDetailsView):
            response_details = DecisionRecordTraceDetailsResponse(
                decision_id=details.decision_id,
                citizen_state_revision=details.citizen_state_revision,
                policy_version=details.policy_version,
                graph_version=details.graph_version,
                journey_definition_version=(
                    details.journey_definition_version
                ),
                evaluated_at=details.evaluated_at,
                ai_used_for_decision=details.ai_used_for_decision,
            )
        else:  # pragma: no cover - closed application union
            raise TypeError("unsupported execution trace stage details")

        return cls(
            stage_id=view.stage_id,
            stage_type=view.stage_type,
            label=view.label,
            state=view.state,
            state_display=_TRACE_STATE_LABELS[view.state],
            short_description=view.short_description,
            input_summary=view.input_summary,
            output_summary=view.output_summary,
            details=response_details,
        )


class ExecutionTraceResponse(ApiModel):
    journey_instance_id: str
    decision_id: str
    journey_id: JourneyId
    citizen_goal: IntentGoal
    official_process: OfficialProcessResponse
    decision_state: DecisionState
    citizen_state_revision: int
    policy_version: str
    graph_version: str
    journey_definition_version: int
    ai_used_for_decision: Literal[False]
    stages: tuple[ExecutionTraceStageResponse, ...]
    demo: DemoMetadata = DemoMetadata()

    @classmethod
    def from_view(cls, view: ExecutionTraceView) -> "ExecutionTraceResponse":
        return cls(
            journey_instance_id=view.journey_instance_id,
            decision_id=view.decision_id,
            journey_id=view.journey_id,
            citizen_goal=view.citizen_goal,
            official_process=OfficialProcessResponse(
                label=view.official_process_label,
                source_id=view.official_process_source_id,
            ),
            decision_state=view.decision_state,
            citizen_state_revision=view.citizen_state_revision,
            policy_version=view.policy_version,
            graph_version=view.graph_version,
            journey_definition_version=view.journey_definition_version,
            ai_used_for_decision=view.ai_used_for_decision,
            stages=tuple(
                ExecutionTraceStageResponse.from_view(stage)
                for stage in view.stages
            ),
        )
