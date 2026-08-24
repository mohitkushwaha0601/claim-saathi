import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ClaimSaathiApiError } from "@/lib/api/client";
import { listDemoPersonas } from "@/lib/api/demo";
import {
  evaluateJourney,
  getDecisionDetail,
  getJourney,
} from "@/lib/api/journeys";
import { getPolicySource } from "@/lib/api/policy";
import type {
  DecisionDetailResponse,
  DecisionState,
  DemoPersonaListResponse,
  JourneyEvaluationResponse,
  JourneyResponse,
  PolicySourceResponse,
} from "@/lib/api/types";

import { JourneyExperience } from "./journey-experience";

vi.mock("@/lib/api/demo", () => ({ listDemoPersonas: vi.fn() }));
vi.mock("@/lib/api/journeys", () => ({
  evaluateJourney: vi.fn(),
  getDecisionDetail: vi.fn(),
  getJourney: vi.fn(),
}));
vi.mock("@/lib/api/policy", () => ({ getPolicySource: vi.fn() }));

const getJourneyMock = vi.mocked(getJourney);
const evaluateJourneyMock = vi.mocked(evaluateJourney);
const getDecisionDetailMock = vi.mocked(getDecisionDetail);
const listDemoPersonasMock = vi.mocked(listDemoPersonas);
const getPolicySourceMock = vi.mocked(getPolicySource);

const DEMO = {
  environment: "DEMO",
  synthetic_data: true,
  real_government_action_performed: false,
} as const;

const PERSONAS: DemoPersonaListResponse = {
  personas: [
    {
      persona_id: "RAVI_PARTIAL_READY",
      display_name: "Ravi",
      scenario: "Synthetic partial-withdrawal readiness scenario",
      compatible_goal: "ACCESS_SOME_PF_FUNDS",
    },
  ],
  demo: DEMO,
};

const JOURNEY: JourneyResponse = {
  journey_instance_id: "JRN-RAVI-TEST",
  persona_id: "RAVI_PARTIAL_READY",
  citizen_goal: "ACCESS_SOME_PF_FUNDS",
  journey_id: "PF_PARTIAL_WITHDRAWAL",
  journey_definition_version: 1,
  created_at: "2026-08-24T06:00:00Z",
  official_process: {
    label: "Form 31",
    source_id: "SRC-EPFO-FORMS",
  },
  citizen_state_revision: 1,
  demo: DEMO,
  latest_decision: null,
};

const PASS_DECISION: JourneyEvaluationResponse = {
  journey_instance_id: "JRN-RAVI-TEST",
  decision_id: "DEC-RAVI-TEST",
  journey_id: "PF_PARTIAL_WITHDRAWAL",
  state: "PASS",
  state_display: "Ready to proceed",
  official_process: JOURNEY.official_process,
  issue_codes: [],
  resolution_ids: [],
  policy_version: "partial-withdrawal-v1",
  graph_version: "partial-withdrawal-v1",
  journey_definition_version: 1,
  citizen_state_revision: 1,
  evaluated_at: "2026-08-24T06:30:00Z",
  prerequisites: [
    {
      node_id: "ONLINE_ACCESS_READY",
      label: "Online access ready",
      state: "PASS",
      state_display: "Ready to proceed",
    },
    {
      node_id: "UAN_READY",
      label: "UAN ready",
      state: "PASS",
      state_display: "Ready to proceed",
    },
    {
      node_id: "AADHAAR_READY",
      label: "Aadhaar ready",
      state: "PASS",
      state_display: "Ready to proceed",
    },
    {
      node_id: "BANK_READY",
      label: "Bank ready",
      state: "PASS",
      state_display: "Ready to proceed",
    },
    {
      node_id: "SERVICE_REQUIREMENT",
      label: "Service requirement",
      state: "PASS",
      state_display: "Ready to proceed",
    },
    {
      node_id: "REQUEST_AMOUNT_VALID",
      label: "Requested amount valid",
      state: "PASS",
      state_display: "Ready to proceed",
    },
  ],
  sources: ["SRC-EPFO-PARTIAL-2026"],
  ai_used_for_decision: false,
  demo: DEMO,
};

const DECISION_DETAIL: DecisionDetailResponse = {
  ...PASS_DECISION,
  rule_results: [],
};

const SOURCE: PolicySourceResponse = {
  source_id: "SRC-EPFO-PARTIAL-2026",
  authority: "Ministry of Labour & Employment / PIB",
  title: "Current partial-withdrawal framework",
  document_type: "PRESS_RELEASE",
  published_at: "2026-01-01",
  effective_from: null,
  effective_to: null,
  reference_url: "https://www.pib.gov.in/example",
  corroborating_urls: [],
  verified_at: "2026-08-24T00:00:00Z",
  scope: "Only the reviewed partial-withdrawal rules used by this demo.",
  notes: null,
  status: "ACTIVE",
  demo: DEMO,
};

function decisionWithState(state: DecisionState): JourneyEvaluationResponse {
  return {
    ...PASS_DECISION,
    decision_id: `DEC-${state}`,
    state,
    issue_codes: state === "ACTION_REQUIRED" ? ["EXIT_DATE_MISSING"] : [],
    resolution_ids: state === "ACTION_REQUIRED" ? ["RES_EXIT"] : [],
    prerequisites: PASS_DECISION.prerequisites.map((item, index) =>
      index === 0 ? { ...item, state } : item,
    ),
    sources: [],
  };
}

function renderJourney() {
  return render(<JourneyExperience journeyInstanceId="JRN-RAVI-TEST" />);
}

describe("journey evaluation experience", () => {
  beforeEach(() => {
    getJourneyMock.mockResolvedValue(JOURNEY);
    listDemoPersonasMock.mockResolvedValue(PERSONAS);
    evaluateJourneyMock.mockResolvedValue(PASS_DECISION);
    getDecisionDetailMock.mockResolvedValue(DECISION_DETAIL);
    getPolicySourceMock.mockResolvedValue(SOURCE);
  });

  it("loads an existing journey without revealing its process before evaluation", async () => {
    renderJourney();

    expect(await screen.findByRole("heading", { name: "Your PF journey" })).toBeTruthy();
    expect(screen.getByText("Ravi")).toBeTruthy();
    expect(screen.getByText("Access some PF funds")).toBeTruthy();
    expect(screen.getByText("Not checked yet")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Check my journey" })).toBeTruthy();
    expect(screen.queryByText("Form 31")).toBeNull();
    expect(evaluateJourneyMock).not.toHaveBeenCalled();
  });

  it("calls the typed evaluation client once and announces its loading state", async () => {
    let resolveDecision!: (value: JourneyEvaluationResponse) => void;
    evaluateJourneyMock.mockReturnValue(
      new Promise((resolve) => {
        resolveDecision = resolve;
      }),
    );
    renderJourney();

    const button = await screen.findByRole("button", { name: "Check my journey" });
    fireEvent.click(button);
    fireEvent.click(button);

    expect(await screen.findByText("Reviewing configured rules and synthetic records.")).toBeTruthy();
    expect(evaluateJourneyMock).toHaveBeenCalledOnce();
    expect(evaluateJourneyMock).toHaveBeenCalledWith("JRN-RAVI-TEST");
    expect((screen.getByRole("button", { name: "Checking your journey…" }) as HTMLButtonElement).disabled).toBe(true);

    resolveDecision(PASS_DECISION);
    expect(await screen.findByRole("heading", { name: "Ready to proceed" })).toBeTruthy();
  });

  it("renders backend PASS prerequisites, process, trust, and source metadata", async () => {
    renderJourney();
    fireEvent.click(await screen.findByRole("button", { name: "Check my journey" }));

    expect(await screen.findByRole("heading", { name: "Ready to proceed" })).toBeTruthy();
    expect(screen.getByText("Form 31")).toBeTruthy();
    expect(screen.getByText("Partial withdrawal")).toBeTruthy();
    expect(screen.queryByText("Approved")).toBeNull();
    expect(screen.queryByText("Guaranteed")).toBeNull();
    expect(
      screen.getByText(/AI was not used to determine this result/),
    ).toBeTruthy();
    expect(screen.getAllByText("Ready").length).toBeGreaterThanOrEqual(6);
    expect(screen.getByText("UAN ready")).toBeTruthy();
    expect(screen.getByText("Requested amount valid")).toBeTruthy();
    expect(
      await screen.findByText("Current partial-withdrawal framework"),
    ).toBeTruthy();
    expect(getPolicySourceMock).toHaveBeenCalledWith(
      "SRC-EPFO-PARTIAL-2026",
    );
    const officialLink = screen.getByRole("link", { name: /View official source/ });
    expect(officialLink.getAttribute("target")).toBe("_blank");
    expect(officialLink.getAttribute("rel")).toContain("noopener");
  });

  it("restores the latest decision detail on refresh without re-evaluating", async () => {
    getJourneyMock.mockResolvedValue({
      ...JOURNEY,
      latest_decision: {
        decision_id: PASS_DECISION.decision_id,
        state: "PASS",
        state_display: "Ready to proceed",
        issue_codes: [],
        resolution_ids: [],
        citizen_state_revision: 1,
        evaluated_at: PASS_DECISION.evaluated_at,
      },
    });
    renderJourney();

    expect(await screen.findByRole("heading", { name: "Ready to proceed" })).toBeTruthy();
    expect(screen.getByText("Form 31")).toBeTruthy();
    expect(getDecisionDetailMock).toHaveBeenCalledWith(
      "JRN-RAVI-TEST",
      PASS_DECISION.decision_id,
    );
    expect(evaluateJourneyMock).not.toHaveBeenCalled();
  });

  it("explains an expired in-memory journey without treating it as uncertainty", async () => {
    getJourneyMock.mockRejectedValue(
      new ClaimSaathiApiError(
        "JOURNEY_NOT_FOUND",
        "Journey not found.",
        404,
      ),
    );
    renderJourney();

    expect(await screen.findByRole("heading", { name: "Journey not found" })).toBeTruthy();
    expect(screen.getByText("Demo journeys reset when the backend restarts.")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Start a new journey" })).toBeTruthy();
    expect(screen.queryByText("Unable to verify")).toBeNull();
  });

  it("preserves a successful decision if a later explicit check fails", async () => {
    renderJourney();
    fireEvent.click(await screen.findByRole("button", { name: "Check my journey" }));
    expect(await screen.findByRole("heading", { name: "Ready to proceed" })).toBeTruthy();

    evaluateJourneyMock.mockRejectedValueOnce(new Error("network details"));
    fireEvent.click(screen.getByRole("button", { name: "Check again" }));

    expect(
      await screen.findByText("We couldn't check this journey right now."),
    ).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Ready to proceed" })).toBeTruthy();
    expect(screen.getByText("Form 31")).toBeTruthy();
    expect(screen.queryByText("network details")).toBeNull();
  });

  it("renders ACTION_REQUIRED without starting a resolution", async () => {
    evaluateJourneyMock.mockResolvedValue(decisionWithState("ACTION_REQUIRED"));
    renderJourney();
    fireEvent.click(await screen.findByRole("button", { name: "Check my journey" }));

    expect(await screen.findByRole("heading", { name: "Action required" })).toBeTruthy();
    expect(screen.getByText("A required employment detail needs attention.")).toBeTruthy();
    expect(screen.getByText(/No recovery workflow has been started/)).toBeTruthy();
    expect(screen.queryByRole("button", { name: /resolution/i })).toBeNull();
    expect(screen.queryByText("Form 31")).toBeNull();
  });

  it("renders POLICY_REVIEW_REQUIRED without an AI fallback", async () => {
    evaluateJourneyMock.mockResolvedValue(
      decisionWithState("POLICY_REVIEW_REQUIRED"),
    );
    renderJourney();
    fireEvent.click(await screen.findByRole("button", { name: "Check my journey" }));

    expect(
      await screen.findByRole("heading", { name: "Policy verification required" }),
    ).toBeTruthy();
    expect(screen.getByText(/will not automate this result/)).toBeTruthy();
    expect(screen.queryByText(/AI fallback/i)).toBeNull();
  });
});
