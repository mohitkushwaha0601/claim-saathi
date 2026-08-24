import { apiRequest, ClaimSaathiApiError } from "./client";
import type { PolicySourceResponse } from "./types";

function assertPolicySource(value: PolicySourceResponse): PolicySourceResponse {
  const nullableStrings = [
    value?.published_at,
    value?.effective_from,
    value?.effective_to,
    value?.reference_url,
    value?.verified_at,
    value?.scope,
    value?.notes,
  ];
  if (
    !value ||
    typeof value.source_id !== "string" ||
    typeof value.authority !== "string" ||
    typeof value.title !== "string" ||
    typeof value.document_type !== "string" ||
    !nullableStrings.every(
      (item) => item === null || typeof item === "string",
    ) ||
    !Array.isArray(value.corroborating_urls) ||
    !value.corroborating_urls.every((item) => typeof item === "string") ||
    !["ACTIVE", "INACTIVE", "SUPERSEDED", "REVIEW_REQUIRED"].includes(
      value.status,
    ) ||
    value.demo?.environment !== "DEMO" ||
    value.demo.synthetic_data !== true ||
    value.demo.real_government_action_performed !== false
  ) {
    throw new ClaimSaathiApiError(
      "INVALID_POLICY_SOURCE_RESPONSE",
      "The reviewed source could not be displayed safely.",
      200,
    );
  }
  return value;
}

export async function getPolicySource(
  sourceId: string,
): Promise<PolicySourceResponse> {
  const response = await apiRequest<PolicySourceResponse>(
    `/api/v1/policy/sources/${encodeURIComponent(sourceId)}`,
  );
  return assertPolicySource(response);
}
