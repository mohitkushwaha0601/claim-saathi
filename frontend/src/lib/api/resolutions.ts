import { apiRequest, ClaimSaathiApiError } from "./client";
import { hasSafeDemoMetadata } from "./contracts";
import type {
  ApprovedResolutionStepResponse,
  ResolutionHistoryResponse,
  ResolutionResponse,
  ResolutionState,
  ResolutionStepType,
  StartResolutionRequest,
} from "./types";

const RESOLUTION_STATES: readonly ResolutionState[] = [
  "CREATED",
  "CITIZEN_ACTION_REQUIRED",
  "EXTERNAL_ACTION_REQUIRED",
  "WAITING_FOR_UPDATE",
  "RECHECKING",
  "RESOLVED",
  "STILL_BLOCKED",
];

const STEP_TYPES: readonly ResolutionStepType[] = [
  "INFORMATION",
  "EXTERNAL_ACTION",
  "WAIT",
  "SYSTEM_ACTION",
];

function isApprovedStep(value: unknown): value is ApprovedResolutionStepResponse {
  if (!value || typeof value !== "object") return false;
  const step = value as Record<string, unknown>;
  return (
    typeof step.step_id === "string" &&
    typeof step.step_type === "string" &&
    STEP_TYPES.includes(step.step_type as ResolutionStepType) &&
    typeof step.title === "string" &&
    typeof step.canonical_guidance === "string" &&
    Array.isArray(step.official_route) &&
    step.official_route.every((item) => typeof item === "string")
  );
}

function assertResolution(value: ResolutionResponse): ResolutionResponse {
  if (
    !value ||
    typeof value.resolution_instance_id !== "string" ||
    typeof value.resolution_id !== "string" ||
    typeof value.issue_code !== "string" ||
    !RESOLUTION_STATES.includes(value.state) ||
    typeof value.title !== "string" ||
    !Array.isArray(value.approved_steps) ||
    !value.approved_steps.every(isApprovedStep) ||
    !Array.isArray(value.official_sources) ||
    !value.official_sources.every((item) => typeof item === "string") ||
    typeof value.workflow_version !== "number" ||
    typeof value.created_at !== "string" ||
    typeof value.updated_at !== "string" ||
    !(
      value.last_checked_citizen_state_version === null ||
      typeof value.last_checked_citizen_state_version === "string"
    ) ||
    !hasSafeDemoMetadata(value.demo)
  ) {
    throw new ClaimSaathiApiError(
      "INVALID_RESOLUTION_RESPONSE",
      "The resolution could not be displayed safely.",
      200,
    );
  }
  return value;
}

export async function listResolutions(
  journeyInstanceId: string,
): Promise<ResolutionHistoryResponse> {
  const response = await apiRequest<ResolutionHistoryResponse>(
    `/api/v1/journeys/${encodeURIComponent(journeyInstanceId)}/resolutions`,
  );
  if (
    !response ||
    response.journey_instance_id !== journeyInstanceId ||
    !Array.isArray(response.resolutions) ||
    !hasSafeDemoMetadata(response.demo)
  ) {
    throw new ClaimSaathiApiError(
      "INVALID_RESOLUTION_HISTORY_RESPONSE",
      "Existing resolution progress could not be restored safely.",
      200,
    );
  }
  response.resolutions.forEach(assertResolution);
  return response;
}

export async function startResolution(
  journeyInstanceId: string,
  request: StartResolutionRequest,
): Promise<ResolutionResponse> {
  const response = await apiRequest<ResolutionResponse>(
    `/api/v1/journeys/${encodeURIComponent(journeyInstanceId)}/resolutions`,
    { method: "POST", body: JSON.stringify(request) },
  );
  return assertResolution(response);
}

export async function getResolution(
  journeyInstanceId: string,
  resolutionInstanceId: string,
): Promise<ResolutionResponse> {
  const response = await apiRequest<ResolutionResponse>(
    `/api/v1/journeys/${encodeURIComponent(journeyInstanceId)}/resolutions/${encodeURIComponent(resolutionInstanceId)}`,
  );
  return assertResolution(response);
}

export async function confirmExternalStepStarted(
  journeyInstanceId: string,
  resolutionInstanceId: string,
): Promise<ResolutionResponse> {
  const response = await apiRequest<ResolutionResponse>(
    `/api/v1/journeys/${encodeURIComponent(journeyInstanceId)}/resolutions/${encodeURIComponent(resolutionInstanceId)}/confirm-external-step-started`,
    { method: "POST" },
  );
  return assertResolution(response);
}

export async function recheckResolution(
  journeyInstanceId: string,
  resolutionInstanceId: string,
): Promise<ResolutionResponse> {
  const response = await apiRequest<ResolutionResponse>(
    `/api/v1/journeys/${encodeURIComponent(journeyInstanceId)}/resolutions/${encodeURIComponent(resolutionInstanceId)}/recheck`,
    { method: "POST" },
  );
  return assertResolution(response);
}
