import { apiRequest, ClaimSaathiApiError } from "./client";
import { hasSafeDemoMetadata } from "./contracts";
import type {
  DemoEventResponse,
  DemoPersona,
  DemoPersonaListResponse,
} from "./types";

function isDemoPersona(value: unknown): value is DemoPersona {
  if (!value || typeof value !== "object") return false;
  const persona = value as Record<string, unknown>;
  return (
    typeof persona.persona_id === "string" &&
    typeof persona.display_name === "string" &&
    typeof persona.scenario === "string" &&
    typeof persona.compatible_goal === "string"
  );
}

function assertPersonaResponse(
  value: DemoPersonaListResponse,
): DemoPersonaListResponse {
  if (
    !Array.isArray(value?.personas) ||
    !value.personas.every(isDemoPersona) ||
    !hasSafeDemoMetadata(value.demo)
  ) {
    throw new ClaimSaathiApiError(
      "INVALID_DEMO_RESPONSE",
      "The synthetic demo could not be loaded safely.",
      200,
    );
  }
  return value;
}

export async function listDemoPersonas(): Promise<DemoPersonaListResponse> {
  const response = await apiRequest<DemoPersonaListResponse>(
    "/api/v1/demo/personas",
  );
  return assertPersonaResponse(response);
}

export async function simulatePreviousExitDateUpdate(
  journeyInstanceId: string,
): Promise<DemoEventResponse> {
  const response = await apiRequest<DemoEventResponse>(
    `/api/v1/demo/journeys/${encodeURIComponent(journeyInstanceId)}/events/previous-exit-date-updated`,
    { method: "POST" },
  );
  if (
    !response ||
    response.journey_instance_id !== journeyInstanceId ||
    typeof response.event_type !== "string" ||
    response.synthetic_event !== true ||
    response.real_government_action_performed !== false ||
    typeof response.changed !== "boolean" ||
    typeof response.citizen_state_version !== "string" ||
    typeof response.citizen_state_revision !== "number" ||
    !hasSafeDemoMetadata(response.demo)
  ) {
    throw new ClaimSaathiApiError(
      "INVALID_DEMO_EVENT_RESPONSE",
      "The synthetic demo update could not be verified safely.",
      200,
    );
  }
  return response;
}
