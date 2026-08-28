import { apiRequest, ClaimSaathiApiError } from "./client";
import { hasSafeDemoMetadata } from "./contracts";
import type {
  DecisionState,
  ExecutionTraceResponse,
  ExecutionTraceStage,
  IntentGoal,
  JourneyId,
  TraceGraphNodeResponse,
  TraceRuleResponse,
  TraceStageDetails,
  TraceStageState,
  TraceStageType,
} from "./types";

const DECISION_STATES: readonly DecisionState[] = [
  "PASS",
  "ACTION_REQUIRED",
  "NOT_ELIGIBLE",
  "UNABLE_TO_VERIFY",
  "NOT_APPLICABLE",
  "POLICY_REVIEW_REQUIRED",
];

const INTENT_GOALS: readonly IntentGoal[] = [
  "ACCESS_SOME_PF_FUNDS",
  "TRANSFER_PF_AFTER_EMPLOYMENT_CHANGE",
  "FINAL_PF_SETTLEMENT",
];

const JOURNEY_IDS: readonly JourneyId[] = [
  "PF_PARTIAL_WITHDRAWAL",
  "PF_TRANSFER",
  "PF_FINAL_SETTLEMENT",
];

const STAGE_TYPES: readonly TraceStageType[] = [
  "INTENT",
  "JOURNEY_PLANNER",
  "POLICY_ENGINE",
  "PREREQUISITE_GRAPH",
  "DECISION_RECORD",
];

const STAGE_STATES: readonly TraceStageState[] = [
  "RECORDED",
  ...DECISION_STATES,
];

function isString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === "string";
}

function isDecisionState(value: unknown): value is DecisionState {
  return (
    typeof value === "string" &&
    DECISION_STATES.includes(value as DecisionState)
  );
}

function isRule(value: unknown): value is TraceRuleResponse {
  if (!value || typeof value !== "object") return false;
  const rule = value as Record<string, unknown>;
  return (
    isString(rule.rule_id) &&
    isDecisionState(rule.state) &&
    isNullableString(rule.issue_code) &&
    isNullableString(rule.source_id)
  );
}

function isGraphNode(value: unknown): value is TraceGraphNodeResponse {
  if (!value || typeof value !== "object") return false;
  const node = value as Record<string, unknown>;
  return (
    isString(node.node_id) &&
    isString(node.label) &&
    isDecisionState(node.state) &&
    Array.isArray(node.children_ids) &&
    node.children_ids.every(isString) &&
    isNullableString(node.rule_id)
  );
}

function hasValidGraphStructure(
  rootNodeId: string,
  nodes: TraceGraphNodeResponse[],
): boolean {
  const byId = new Map(nodes.map((node) => [node.node_id, node]));
  if (byId.size !== nodes.length || !byId.has(rootNodeId)) return false;
  if (nodes.some((node) => node.children_ids.some((id) => !byId.has(id)))) {
    return false;
  }

  const visiting = new Set<string>();
  const visited = new Set<string>();
  function visit(nodeId: string): boolean {
    if (visiting.has(nodeId)) return false;
    if (visited.has(nodeId)) return true;
    visiting.add(nodeId);
    const node = byId.get(nodeId);
    if (!node || node.children_ids.some((child) => !visit(child))) return false;
    visiting.delete(nodeId);
    visited.add(nodeId);
    return true;
  }
  return visit(rootNodeId) && visited.size === nodes.length;
}

function isStageDetails(
  value: unknown,
  stageType: TraceStageType,
): value is TraceStageDetails {
  if (!value || typeof value !== "object") return false;
  const details = value as Record<string, unknown>;
  if (details.detail_type !== stageType) return false;

  if (stageType === "INTENT") {
    return (
      INTENT_GOALS.includes(details.citizen_goal as IntentGoal) &&
      details.ai_used === false
    );
  }
  if (stageType === "JOURNEY_PLANNER") {
    return (
      INTENT_GOALS.includes(details.citizen_goal as IntentGoal) &&
      JOURNEY_IDS.includes(details.journey_id as JourneyId) &&
      details.method === "EXACT_REVIEWED_CONFIGURATION" &&
      details.ai_used === false
    );
  }
  if (stageType === "POLICY_ENGINE") {
    return (
      isString(details.policy_version) &&
      Array.isArray(details.rules) &&
      details.rules.every(isRule) &&
      details.ai_used === false
    );
  }
  if (stageType === "PREREQUISITE_GRAPH") {
    return (
      isString(details.graph_version) &&
      isString(details.root_node_id) &&
      Array.isArray(details.nodes) &&
      details.nodes.every(isGraphNode) &&
      hasValidGraphStructure(
        details.root_node_id,
        details.nodes as TraceGraphNodeResponse[],
      ) &&
      details.ai_used === false
    );
  }
  return (
    isString(details.decision_id) &&
    typeof details.citizen_state_revision === "number" &&
    isString(details.policy_version) &&
    isString(details.graph_version) &&
    typeof details.journey_definition_version === "number" &&
    isString(details.evaluated_at) &&
    details.ai_used_for_decision === false
  );
}

function isStage(value: unknown): value is ExecutionTraceStage {
  if (!value || typeof value !== "object") return false;
  const stage = value as Record<string, unknown>;
  if (
    !STAGE_TYPES.includes(stage.stage_type as TraceStageType) ||
    stage.stage_id !== stage.stage_type ||
    !STAGE_STATES.includes(stage.state as TraceStageState) ||
    !isString(stage.label) ||
    !isString(stage.state_display) ||
    !isString(stage.short_description) ||
    !isString(stage.input_summary) ||
    !isString(stage.output_summary)
  ) {
    return false;
  }
  return isStageDetails(stage.details, stage.stage_type as TraceStageType);
}

function assertTrace(value: ExecutionTraceResponse): ExecutionTraceResponse {
  const stages = value?.stages;
  if (
    !value ||
    !isString(value.journey_instance_id) ||
    !isString(value.decision_id) ||
    !JOURNEY_IDS.includes(value.journey_id) ||
    !INTENT_GOALS.includes(value.citizen_goal) ||
    !isString(value.official_process?.label) ||
    !isString(value.official_process?.source_id) ||
    !isDecisionState(value.decision_state) ||
    typeof value.citizen_state_revision !== "number" ||
    !isString(value.policy_version) ||
    !isString(value.graph_version) ||
    typeof value.journey_definition_version !== "number" ||
    value.ai_used_for_decision !== false ||
    !Array.isArray(stages) ||
    stages.length !== STAGE_TYPES.length ||
    !stages.every(isStage) ||
    !STAGE_TYPES.every((type, index) => stages[index]?.stage_type === type) ||
    !hasSafeDemoMetadata(value.demo)
  ) {
    throw new ClaimSaathiApiError(
      "INVALID_EXECUTION_TRACE_RESPONSE",
      "The execution trace could not be displayed safely.",
      200,
    );
  }
  const intent = stages[0].details;
  const planner = stages[1].details;
  const policy = stages[2].details;
  const graph = stages[3].details;
  const decision = stages[4].details;
  const rootNode =
    graph.detail_type === "PREREQUISITE_GRAPH"
      ? graph.nodes.find((node) => node.node_id === graph.root_node_id)
      : undefined;
  if (
    intent.detail_type !== "INTENT" ||
    intent.citizen_goal !== value.citizen_goal ||
    planner.detail_type !== "JOURNEY_PLANNER" ||
    planner.citizen_goal !== value.citizen_goal ||
    planner.journey_id !== value.journey_id ||
    policy.detail_type !== "POLICY_ENGINE" ||
    policy.policy_version !== value.policy_version ||
    graph.detail_type !== "PREREQUISITE_GRAPH" ||
    graph.graph_version !== value.graph_version ||
    rootNode?.state !== value.decision_state ||
    decision.detail_type !== "DECISION_RECORD" ||
    decision.decision_id !== value.decision_id ||
    decision.citizen_state_revision !== value.citizen_state_revision ||
    decision.policy_version !== value.policy_version ||
    decision.graph_version !== value.graph_version ||
    decision.journey_definition_version !==
      value.journey_definition_version ||
    decision.ai_used_for_decision !== value.ai_used_for_decision
  ) {
    throw new ClaimSaathiApiError(
      "INVALID_EXECUTION_TRACE_RESPONSE",
      "The execution trace could not be displayed safely.",
      200,
    );
  }
  return value;
}

export async function getExecutionTrace(
  journeyInstanceId: string,
  decisionId: string,
): Promise<ExecutionTraceResponse> {
  const response = await apiRequest<ExecutionTraceResponse>(
    `/api/v1/journeys/${encodeURIComponent(journeyInstanceId)}/decisions/${encodeURIComponent(decisionId)}/trace`,
  );
  return assertTrace(response);
}
