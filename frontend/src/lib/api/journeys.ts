import { apiRequest, ClaimSaathiApiError } from "./client";
import type {
  CreateJourneyRequest,
  JourneyCreatedResponse,
  JourneyResponse,
} from "./types";

function assertJourneyCreated<T extends JourneyCreatedResponse>(value: T): T {
  if (
    !value ||
    typeof value.journey_instance_id !== "string" ||
    typeof value.persona_id !== "string" ||
    typeof value.citizen_goal !== "string" ||
    typeof value.journey_id !== "string" ||
    value.demo?.environment !== "DEMO" ||
    value.demo.synthetic_data !== true ||
    value.demo.real_government_action_performed !== false
  ) {
    throw new ClaimSaathiApiError(
      "INVALID_JOURNEY_RESPONSE",
      "The synthetic journey could not be prepared safely.",
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
  return assertJourneyCreated(response);
}
