import { afterEach, describe, expect, it, vi } from "vitest";

import { simulatePreviousExitDateUpdate } from "./demo";
import {
  confirmExternalStepStarted,
  getResolution,
  listResolutions,
  recheckResolution,
  startResolution,
} from "./resolutions";
import type { ResolutionResponse } from "./types";

const DEMO = {
  environment: "DEMO",
  synthetic_data: true,
  real_government_action_performed: false,
} as const;

const RESOLUTION: ResolutionResponse = {
  resolution_instance_id: "RES-1",
  resolution_id: "RES_EXIT",
  issue_code: "EXIT_DATE_MISSING",
  state: "CITIZEN_ACTION_REQUIRED",
  title: "Update previous employment Date of Exit",
  approved_steps: [
    {
      step_id: "REVIEW_RECORD",
      step_type: "INFORMATION",
      title: "Review the previous employment record",
      canonical_guidance: "Review the backend-approved record guidance.",
      official_route: [],
    },
  ],
  official_sources: ["SRC-EPFO-EXIT-RESOLUTION"],
  workflow_version: 1,
  created_at: "2026-08-24T06:00:00Z",
  updated_at: "2026-08-24T06:00:00Z",
  last_checked_citizen_state_version: null,
  demo: DEMO,
};

function successfulJson(payload: unknown) {
  return {
    ok: true,
    status: 200,
    json: async () => payload,
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("resolution API boundary", () => {
  it("starts only the backend-mapped issue and sends no client-selected workflow ID", async () => {
    const fetchMock = vi.fn().mockResolvedValue(successfulJson(RESOLUTION));
    vi.stubGlobal("fetch", fetchMock);

    await startResolution("JRN/PRIYA", {
      decision_id: "DEC-1",
      issue_code: "EXIT_DATE_MISSING",
    });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/api/v1/journeys/JRN%2FPRIYA/resolutions");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual({
      decision_id: "DEC-1",
      issue_code: "EXIT_DATE_MISSING",
    });
    expect(init.body).not.toContain("resolution_id");
  });

  it("uses only the purpose-specific confirm, recheck, and read endpoints", async () => {
    const fetchMock = vi.fn().mockResolvedValue(successfulJson(RESOLUTION));
    vi.stubGlobal("fetch", fetchMock);

    await confirmExternalStepStarted("JRN-1", "RES-1");
    await recheckResolution("JRN-1", "RES-1");
    await getResolution("JRN-1", "RES-1");

    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
      expect.stringContaining(
        "/api/v1/journeys/JRN-1/resolutions/RES-1/confirm-external-step-started",
      ),
      expect.stringContaining(
        "/api/v1/journeys/JRN-1/resolutions/RES-1/recheck",
      ),
      expect.stringContaining(
        "/api/v1/journeys/JRN-1/resolutions/RES-1",
      ),
    ]);
    expect(fetchMock.mock.calls[0][1]?.method).toBe("POST");
    expect(fetchMock.mock.calls[1][1]?.method).toBe("POST");
    expect(fetchMock.mock.calls[2][1]?.method).toBeUndefined();
  });

  it("restores existing resolutions through the read-only list endpoint", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      successfulJson({
        journey_instance_id: "JRN-1",
        resolutions: [RESOLUTION],
        demo: DEMO,
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const response = await listResolutions("JRN-1");

    expect(response.resolutions[0]).toEqual(RESOLUTION);
    expect(fetchMock.mock.calls[0][0]).toContain(
      "/api/v1/journeys/JRN-1/resolutions",
    );
    expect(fetchMock.mock.calls[0][1]?.method).toBeUndefined();
  });

  it("calls only the allowlisted Priya synthetic correction endpoint", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      successfulJson({
        journey_instance_id: "JRN-1",
        event_type: "PREVIOUS_EXIT_DATE_UPDATED",
        synthetic_event: true,
        real_government_action_performed: false,
        changed: true,
        citizen_state_version: "priya-synthetic-v2",
        citizen_state_revision: 2,
        demo: DEMO,
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await simulatePreviousExitDateUpdate("JRN-1");

    expect(fetchMock.mock.calls[0][0]).toContain(
      "/api/v1/demo/journeys/JRN-1/events/previous-exit-date-updated",
    );
    expect(fetchMock.mock.calls[0][1]?.method).toBe("POST");
    expect(fetchMock.mock.calls[0][1]?.body).toBeUndefined();
  });
});
