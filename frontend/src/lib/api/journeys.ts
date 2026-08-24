import { apiRequest, ClaimSaathiApiError } from "./client";
import type {
  CreateJourneyRequest,
  DecisionDetailResponse,
  DecisionHistoryResponse,
  DecisionSummary,
  DecisionState,
  JourneyCreatedResponse,
  JourneyEvaluationResponse,
  JourneyResponse,
  PrerequisiteResponse,
  RuleResultResponse,
} from "./types";

const DECISION_STATES: readonly DecisionState[] = [
  "PASS",
  "ACTION_REQUIRED",
  "NOT_ELIGIBLE",
  "UNABLE_TO_VERIFY",
  "NOT_APPLICABLE",
  "POLICY_REVIEW_REQUIRED",
];

function isDecisionState(value: unknown): value is DecisionState {
  return (
    typeof value === "string" &&
    DECISION_STATES.includes(value as DecisionState)
  );
}

function hasSafeDemoMetadata(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const demo = value as Record<string, unknown>;
  return (
    demo.environment === "DEMO" &&
    demo.synthetic_data === true &&
    demo.real_government_action_performed === false
  );
}

function isPrerequisite(value: unknown): value is PrerequisiteResponse {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.node_id === "string" &&
    typeof item.label === "string" &&
    isDecisionState(item.state) &&
    typeof item.state_display === "string"
  );
}

function isDecisionSummary(value: unknown): value is DecisionSummary {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.decision_id === "string" &&
    isDecisionState(item.state) &&
    typeof item.state_display === "string" &&
    Array.isArray(item.issue_codes) &&
    item.issue_codes.every((code) => typeof code === "string") &&
    Array.isArray(item.resolution_ids) &&
    item.resolution_ids.every((id) => typeof id === "string") &&
    typeof item.citizen_state_revision === "number" &&
    typeof item.evaluated_at === "string"
  );
}

function isRuleResult(value: unknown): value is RuleResultResponse {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.rule_id === "string" &&
    isDecisionState(item.state) &&
    (item.issue_code === null || typeof item.issue_code === "string") &&
    (item.resolution_id === null || typeof item.resolution_id === "string") &&
    (item.source_id === null || typeof item.source_id === "string") &&
    typeof item.policy_version === "string"
  );
}

function assertJourneyCreated<T extends JourneyCreatedResponse>(value: T): T {
  if (
    !value ||
    typeof value.journey_instance_id !== "string" ||
    typeof value.persona_id !== "string" ||
    typeof value.citizen_goal !== "string" ||
    typeof value.journey_id !== "string" ||
    typeof value.official_process?.label !== "string" ||
    typeof value.official_process?.source_id !== "string" ||
    !hasSafeDemoMetadata(value.demo)
  ) {
    throw new ClaimSaathiApiError(
      "INVALID_JOURNEY_RESPONSE",
      "The synthetic journey could not be prepared safely.",
      200,
    );
  }
  return value;
}

function assertDecision<T extends JourneyEvaluationResponse>(value: T): T {
  if (
    !value ||
    typeof value.journey_instance_id !== "string" ||
    typeof value.decision_id !== "string" ||
    typeof value.journey_id !== "string" ||
    !isDecisionState(value.state) ||
    typeof value.state_display !== "string" ||
    typeof value.official_process?.label !== "string" ||
    typeof value.official_process?.source_id !== "string" ||
    !Array.isArray(value.issue_codes) ||
    !value.issue_codes.every((item) => typeof item === "string") ||
    !Array.isArray(value.resolution_ids) ||
    !value.resolution_ids.every((item) => typeof item === "string") ||
    typeof value.policy_version !== "string" ||
    typeof value.graph_version !== "string" ||
    typeof value.journey_definition_version !== "number" ||
    typeof value.citizen_state_revision !== "number" ||
    typeof value.evaluated_at !== "string" ||
    !Array.isArray(value.prerequisites) ||
    !value.prerequisites.every(isPrerequisite) ||
    !Array.isArray(value.sources) ||
    !value.sources.every((item) => typeof item === "string") ||
    value.ai_used_for_decision !== false ||
    !hasSafeDemoMetadata(value.demo)
  ) {
    throw new ClaimSaathiApiError(
      "INVALID_DECISION_RESPONSE",
      "The journey result could not be displayed safely.",
      200,
    );
  }
  return value;
}

export async function createJourney(
  request: CreateJourneyRequest,
): Promise<JourneyCreatedResponse> {
  const response = await apiRequest<JourneyCreatedResponse>(
    "/api/v1/journeys",
    {
      method: "POST",
      body: JSON.stringify(request),
    },
  );
  return assertJourneyCreated(response);
}

export async function getJourney(
  journeyInstanceId: string,
): Promise<JourneyResponse> {
  const response = await apiRequest<JourneyResponse>(
    `/api/v1/journeys/${encodeURIComponent(journeyInstanceId)}`,
  );
  const journey = assertJourneyCreated(response);
  if (
    journey.latest_decision !== null &&
    !isDecisionSummary(journey.latest_decision)
  ) {
    throw new ClaimSaathiApiError(
      "INVALID_JOURNEY_RESPONSE",
      "The synthetic journey could not be prepared safely.",
      200,
    );
  }
  return journey;
}

export async function evaluateJourney(
  journeyInstanceId: string,
): Promise<JourneyEvaluationResponse> {
  const response = await apiRequest<JourneyEvaluationResponse>(
    `/api/v1/journeys/${encodeURIComponent(journeyInstanceId)}/evaluate`,
    { method: "POST" },
  );
  return assertDecision(response);
}

export async function getDecisionDetail(
  journeyInstanceId: string,
  decisionId: string,
): Promise<DecisionDetailResponse> {
  const response = await apiRequest<DecisionDetailResponse>(
    `/api/v1/journeys/${encodeURIComponent(journeyInstanceId)}/decisions/${encodeURIComponent(decisionId)}`,
  );
  const decision = assertDecision(response);
  if (
    !Array.isArray(decision.rule_results) ||
    !decision.rule_results.every(isRuleResult)
  ) {
    throw new ClaimSaathiApiError(
      "INVALID_DECISION_RESPONSE",
      "The journey result could not be displayed safely.",
      200,
    );
  }
  return decision;
}

export async function listDecisions(
  journeyInstanceId: string,
): Promise<DecisionHistoryResponse> {
  const response = await apiRequest<DecisionHistoryResponse>(
    `/api/v1/journeys/${encodeURIComponent(journeyInstanceId)}/decisions`,
  );
  if (
    !response ||
    response.journey_instance_id !== journeyInstanceId ||
    !Array.isArray(response.decisions) ||
    !response.decisions.every(isDecisionSummary) ||
    !hasSafeDemoMetadata(response.demo)
  ) {
    throw new ClaimSaathiApiError(
      "INVALID_DECISION_HISTORY_RESPONSE",
      "The journey check history could not be displayed safely.",
      200,
    );
  }
  return response;
}
