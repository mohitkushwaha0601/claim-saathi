import { apiRequest, ClaimSaathiApiError } from "./client";
import type { DemoPersona, DemoPersonaListResponse } from "./types";

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
    value.demo?.environment !== "DEMO" ||
    value.demo.synthetic_data !== true ||
    value.demo.real_government_action_performed !== false
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
