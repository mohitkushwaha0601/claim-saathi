import { apiRequest, ClaimSaathiApiError } from "./client";
import { hasSafeDemoMetadata } from "./contracts";
import type { ExplanationMode, ExplanationResponse } from "./types";

const EXPLANATION_MODES: readonly ExplanationMode[] = [
  "SIMPLE_ENGLISH",
  "HINDI",
];

function isExplanationMode(value: unknown): value is ExplanationMode {
  return (
    typeof value === "string" &&
    EXPLANATION_MODES.includes(value as ExplanationMode)
  );
}

function assertExplanation(value: ExplanationResponse): ExplanationResponse {
  if (
    !value ||
    typeof value.decision_id !== "string" ||
    !isExplanationMode(value.mode) ||
    typeof value.title !== "string" ||
    typeof value.summary !== "string" ||
    !Array.isArray(value.points) ||
    value.points.length < 1 ||
    value.points.length > 4 ||
    !value.points.every((point) => typeof point === "string") ||
    typeof value.disclaimer !== "string" ||
    value.ai_used_for_decision !== false ||
    typeof value.ai_used_for_explanation !== "boolean" ||
    typeof value.fallback_used !== "boolean" ||
    value.ai_used_for_explanation === value.fallback_used ||
    !hasSafeDemoMetadata(value.demo)
  ) {
    throw new ClaimSaathiApiError(
      "INVALID_EXPLANATION_RESPONSE",
      "The explanation could not be displayed safely.",
      200,
    );
  }
  return value;
}

export async function createDecisionExplanation(
  journeyInstanceId: string,
  decisionId: string,
  mode: ExplanationMode,
): Promise<ExplanationResponse> {
  const response = await apiRequest<ExplanationResponse>(
    `/api/v1/journeys/${encodeURIComponent(journeyInstanceId)}` +
      `/decisions/${encodeURIComponent(decisionId)}/explanations`,
    {
      method: "POST",
      body: JSON.stringify({ mode }),
    },
  );
  const explanation = assertExplanation(response);
  if (explanation.decision_id !== decisionId || explanation.mode !== mode) {
    throw new ClaimSaathiApiError(
      "INVALID_EXPLANATION_RESPONSE",
      "The explanation could not be displayed safely.",
      200,
    );
  }
  return explanation;
}
