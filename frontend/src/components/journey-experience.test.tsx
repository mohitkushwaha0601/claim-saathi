import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ClaimSaathiApiError } from "@/lib/api/client";
import {
  listDemoPersonas,
  simulatePreviousExitDateUpdate,
} from "@/lib/api/demo";
import {
  evaluateJourney,
  getDecisionDetail,
  getJourney,
  listDecisions,
} from "@/lib/api/journeys";
import { getPolicySource } from "@/lib/api/policy";
import {
  confirmExternalStepStarted,
  listResolutions,
  recheckResolution,
  startResolution,
} from "@/lib/api/resolutions";
import type {
  DecisionDetailResponse,
  DecisionState,
  DemoPersonaListResponse,
  JourneyEvaluationResponse,
  JourneyResponse,
  PolicySourceResponse,
  ResolutionResponse,
} from "@/lib/api/types";

import { JourneyExperience } from "./journey-experience";

vi.mock("@/lib/api/demo", () => ({
  listDemoPersonas: vi.fn(),
  simulatePreviousExitDateUpdate: vi.fn(),
}));
vi.mock("@/lib/api/journeys", () => ({
  evaluateJourney: vi.fn(),
  getDecisionDetail: vi.fn(),
  getJourney: vi.fn(),
  listDecisions: vi.fn(),
}));
vi.mock("@/lib/api/policy", () => ({ getPolicySource: vi.fn() }));
vi.mock("@/lib/api/resolutions", () => ({
  confirmExternalStepStarted: vi.fn(),
  listResolutions: vi.fn(),
  recheckResolution: vi.fn(),
  startResolution: vi.fn(),
}));

const getJourneyMock = vi.mocked(getJourney);
const evaluateJourneyMock = vi.mocked(evaluateJourney);
const getDecisionDetailMock = vi.mocked(getDecisionDetail);
const listDemoPersonasMock = vi.mocked(listDemoPersonas);
const simulatePreviousExitDateUpdateMock = vi.mocked(
  simulatePreviousExitDateUpdate,
);
const getPolicySourceMock = vi.mocked(getPolicySource);
const listDecisionsMock = vi.mocked(listDecisions);
const listResolutionsMock = vi.mocked(listResolutions);
const startResolutionMock = vi.mocked(startResolution);
const confirmExternalStepStartedMock = vi.mocked(
  confirmExternalStepStarted,
);
const recheckResolutionMock = vi.mocked(recheckResolution);

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
    {
      persona_id: "PRIYA_TRANSFER_MISSING_EXIT",
      display_name: "Priya",
      scenario: "Synthetic transfer scenario with a missing Date of Exit",
      compatible_goal: "TRANSFER_PF_AFTER_EMPLOYMENT_CHANGE",
    },
    {
      persona_id: "ARJUN_FINAL_SETTLEMENT",
      display_name: "Arjun",
      scenario: "Final PF settlement with unresolved policy configuration",
      compatible_goal: "FINAL_PF_SETTLEMENT",
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

const PRIYA_JOURNEY: JourneyResponse = {
  journey_instance_id: "JRN-PRIYA-TEST",
  persona_id: "PRIYA_TRANSFER_MISSING_EXIT",
  citizen_goal: "TRANSFER_PF_AFTER_EMPLOYMENT_CHANGE",
  journey_id: "PF_TRANSFER",
  journey_definition_version: 1,
  created_at: "2026-08-24T06:00:00Z",
  official_process: {
    label: "Form 13",
    source_id: "SRC-EPFO-FORMS",
  },
  citizen_state_revision: 1,
  demo: DEMO,
  latest_decision: null,
};

const PRIYA_DECISION: DecisionDetailResponse = {
  journey_instance_id: PRIYA_JOURNEY.journey_instance_id,
  decision_id: "DEC-PRIYA-ACTION",
  journey_id: "PF_TRANSFER",
  state: "ACTION_REQUIRED",
  state_display: "Action required",
  official_process: PRIYA_JOURNEY.official_process,
  issue_codes: ["EXIT_DATE_MISSING"],
  resolution_ids: ["RES_EXIT"],
  policy_version: "1.0.0",
  graph_version: "1.0.0",
  journey_definition_version: 1,
  citizen_state_revision: 1,
  evaluated_at: "2026-08-24T06:30:00Z",
  prerequisites: [
    {
      node_id: "PREVIOUS_EXIT_DATE",
      label: "Previous employment Date of Exit recorded",
      state: "ACTION_REQUIRED",
      state_display: "Action required",
    },
    {
      node_id: "UAN_READY",
      label: "UAN ready",
      state: "PASS",
      state_display: "Ready to proceed",
    },
    {
      node_id: "TRANSFER_ROUTE_READY",
      label: "Transfer route available",
      state: "PASS",
      state_display: "Ready to proceed",
    },
  ],
  sources: ["SRC-EPFO-TRANSFER-DOE"],
  ai_used_for_decision: false,
  demo: DEMO,
  rule_results: [
    {
      rule_id: "T13-EXIT-DATE-001",
      state: "ACTION_REQUIRED",
      issue_code: "EXIT_DATE_MISSING",
      resolution_id: "RES_EXIT",
      source_id: "SRC-EPFO-TRANSFER-DOE",
      policy_version: "1.0.0",
    },
  ],
};

const ARJUN_JOURNEY: JourneyResponse = {
  journey_instance_id: "JRN-ARJUN-TEST",
  persona_id: "ARJUN_FINAL_SETTLEMENT",
  citizen_goal: "FINAL_PF_SETTLEMENT",
  journey_id: "PF_FINAL_SETTLEMENT",
  journey_definition_version: 1,
  created_at: "2026-08-24T06:00:00Z",
  official_process: {
    label: "Form 19",
    source_id: "SRC-EPFO-FORMS",
  },
  citizen_state_revision: 1,
  demo: DEMO,
  latest_decision: null,
};

const ARJUN_DECISION: DecisionDetailResponse = {
  journey_instance_id: ARJUN_JOURNEY.journey_instance_id,
  decision_id: "DEC-ARJUN-REVIEW",
  journey_id: "PF_FINAL_SETTLEMENT",
  state: "POLICY_REVIEW_REQUIRED",
  state_display: "Policy verification required",
  official_process: ARJUN_JOURNEY.official_process,
  issue_codes: [],
  resolution_ids: [],
  policy_version: "CONFLICT-DEMO-1",
  graph_version: "CONFLICT-DEMO-1",
  journey_definition_version: 1,
  citizen_state_revision: 1,
  evaluated_at: "2026-08-24T06:30:00Z",
  prerequisites: [
    {
      node_id: "FINAL_SETTLEMENT_POLICY_READY",
      label: "Final-settlement policy ready",
      state: "POLICY_REVIEW_REQUIRED",
      state_display: "Policy verification required",
    },
  ],
  sources: [],
  ai_used_for_decision: false,
  demo: DEMO,
  rule_results: [
    {
      rule_id: "FINAL_SETTLEMENT_WAIT_PERIOD",
      state: "POLICY_REVIEW_REQUIRED",
      issue_code: null,
      resolution_id: null,
      source_id: null,
      policy_version: "CONFLICT-DEMO-1",
    },
  ],
};

const APPROVED_STEPS = [
  {
    step_id: "REVIEW_RECORD",
    step_type: "INFORMATION" as const,
    title: "Review the previous employment record",
    canonical_guidance:
      "Confirm that Date of Exit is missing for the previous employment record.",
    official_route: [],
  },
  {
    step_id: "FOLLOW_OFFICIAL_MARK_EXIT_PROCESS",
    step_type: "EXTERNAL_ACTION" as const,
    title: "Follow the official Mark Exit process",
    canonical_guidance:
      "EPFO provides a self-service Mark Exit process after the applicable 60-day condition is satisfied.",
    official_route: [
      "Member Unified Portal",
      "Manage",
      "Mark Exit",
      "Select previous employment",
      "Enter Date of Exit and Reason of Exit",
      "Authenticate using Aadhaar-linked OTP",
    ],
  },
  {
    step_id: "WAIT_FOR_OFFICIAL_RECORD_UPDATE",
    step_type: "WAIT" as const,
    title: "Wait for the official record update",
    canonical_guidance:
      "ClaimSaathi is waiting for the trusted EPFO-style citizen state to reflect the correction.",
    official_route: [],
  },
  {
    step_id: "RECHECK_TRUSTED_STATE",
    step_type: "SYSTEM_ACTION" as const,
    title: "Recheck trusted citizen state",
    canonical_guidance:
      "Reload trusted CitizenState and verify whether the missing Date of Exit now exists.",
    official_route: [],
  },
];

function resolutionInState(
  state: ResolutionResponse["state"],
): ResolutionResponse {
  return {
    resolution_instance_id: "RES-PRIYA-INSTANCE",
    resolution_id: "RES_EXIT",
    issue_code: "EXIT_DATE_MISSING",
    state,
    title: "Update previous employment Date of Exit",
    approved_steps: APPROVED_STEPS,
    official_sources: ["SRC-EPFO-EXIT-RESOLUTION"],
    workflow_version: 1,
    created_at: "2026-08-24T06:31:00Z",
    updated_at: "2026-08-24T06:32:00Z",
    last_checked_citizen_state_version:
      state === "STILL_BLOCKED" || state === "RESOLVED"
        ? "priya-synthetic-v1"
        : null,
    demo: DEMO,
  };
}

const PRIYA_PASS: DecisionDetailResponse = {
  ...PRIYA_DECISION,
  decision_id: "DEC-PRIYA-PASS",
  state: "PASS",
  state_display: "Ready to proceed",
  issue_codes: [],
  resolution_ids: [],
  citizen_state_revision: 2,
  evaluated_at: "2026-08-24T07:00:00Z",
  prerequisites: PRIYA_DECISION.prerequisites.map((item) => ({
    ...item,
    state: "PASS",
    state_display: "Ready to proceed",
  })),
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

const FORMS_SOURCE: PolicySourceResponse = {
  ...SOURCE,
  source_id: "SRC-EPFO-FORMS",
  authority: "Employees' Provident Fund Organisation",
  title: "EPFO process and form labels",
  document_type: "OFFICIAL_WEB_PAGE",
  reference_url: "https://www.epfindia.gov.in/example",
  scope: "Form and process labels only; no eligibility rule.",
};

function decisionWithState(state: DecisionState): DecisionDetailResponse {
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
    rule_results:
      state === "ACTION_REQUIRED"
        ? [
            {
              rule_id: "T13-EXIT-DATE-001",
              state: "ACTION_REQUIRED",
              issue_code: "EXIT_DATE_MISSING",
              resolution_id: "RES_EXIT",
              source_id: "SRC-EPFO-TRANSFER-DOE",
              policy_version: "1.0.0",
            },
          ]
        : [],
  };
}

function renderJourney() {
  return render(<JourneyExperience journeyInstanceId="JRN-RAVI-TEST" />);
}

describe("journey evaluation experience", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    getJourneyMock.mockResolvedValue(JOURNEY);
    listDemoPersonasMock.mockResolvedValue(PERSONAS);
    evaluateJourneyMock.mockResolvedValue(PASS_DECISION);
    getDecisionDetailMock.mockResolvedValue(DECISION_DETAIL);
    getPolicySourceMock.mockResolvedValue(SOURCE);
    listDecisionsMock.mockResolvedValue({
      journey_instance_id: JOURNEY.journey_instance_id,
      decisions: [],
      demo: DEMO,
    });
    listResolutionsMock.mockResolvedValue({
      journey_instance_id: JOURNEY.journey_instance_id,
      resolutions: [],
      demo: DEMO,
    });
    getPolicySourceMock.mockImplementation(async (sourceId) => ({
      ...(sourceId === "SRC-EPFO-FORMS" ? FORMS_SOURCE : SOURCE),
      source_id: sourceId,
      title: sourceId === "SRC-EPFO-EXIT-RESOLUTION"
        ? "EPFO Mark Exit guidance"
        : sourceId === "SRC-EPFO-FORMS"
          ? FORMS_SOURCE.title
          : SOURCE.title,
    }));
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
    const resultHeading = await screen.findByRole("heading", { name: "Ready to proceed" });
    expect(resultHeading).toBeTruthy();
    expect(document.activeElement?.contains(resultHeading)).toBe(true);
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

    expect(await screen.findByRole("heading", { name: "Demo journey expired" })).toBeTruthy();
    expect(screen.getByText("Demo journeys reset when the backend restarts.")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Start a new journey" })).toBeTruthy();
    expect(screen.queryByText("Unable to verify")).toBeNull();
  });

  it("retries an infrastructure load failure without evaluating the journey", async () => {
    getJourneyMock
      .mockRejectedValueOnce(new Error("private network detail"))
      .mockResolvedValueOnce(JOURNEY);
    renderJourney();

    expect(
      await screen.findByText("We couldn't load this demo journey"),
    ).toBeTruthy();
    expect(screen.queryByText("private network detail")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));

    expect(
      await screen.findByRole("heading", { name: "Your PF journey" }),
    ).toBeTruthy();
    expect(evaluateJourneyMock).not.toHaveBeenCalled();
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
    const actionRequired = decisionWithState("ACTION_REQUIRED");
    evaluateJourneyMock.mockResolvedValue(actionRequired);
    getDecisionDetailMock.mockResolvedValue(actionRequired);
    renderJourney();
    fireEvent.click(await screen.findByRole("button", { name: "Check my journey" }));

    expect(await screen.findByRole("heading", { name: "Action required" })).toBeTruthy();
    expect(screen.getByText("Previous employment Date of Exit is missing")).toBeTruthy();
    expect(screen.queryByText(/whole journey, not only the failure/i)).toBeNull();
    expect(screen.getByText("Resolution available")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Start resolution" })).toBeTruthy();
    expect(screen.queryByText("Form 31")).toBeNull();
  });

  it("renders the generic POLICY_REVIEW_REQUIRED experience from backend state", async () => {
    const reviewRequired = decisionWithState("POLICY_REVIEW_REQUIRED");
    evaluateJourneyMock.mockResolvedValue(reviewRequired);
    getDecisionDetailMock.mockResolvedValue(reviewRequired);
    renderJourney();
    fireEvent.click(await screen.findByRole("button", { name: "Check my journey" }));

    expect(
      await screen.findByRole("heading", { name: "Policy verification required" }),
    ).toBeTruthy();
    expect(screen.getByText("ClaimSaathi stopped instead of guessing.")).toBeTruthy();
    expect(screen.getByText("AI was not used to fill the policy gap.")).toBeTruthy();
  });

  it("keeps Form 19 hidden until Arjun explicitly requests evaluation", async () => {
    getJourneyMock.mockResolvedValue(ARJUN_JOURNEY);
    render(<JourneyExperience journeyInstanceId={ARJUN_JOURNEY.journey_instance_id} />);

    expect(await screen.findByText("Final PF settlement")).toBeTruthy();
    expect(screen.getByText("Not checked yet")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Check my journey" })).toBeTruthy();
    expect(screen.queryByText("Form 19")).toBeNull();
    expect(evaluateJourneyMock).not.toHaveBeenCalled();
  });

  it("renders Arjun's backend policy-review safe stop without inventing readiness or resolution", async () => {
    getJourneyMock.mockResolvedValue(ARJUN_JOURNEY);
    evaluateJourneyMock.mockResolvedValue(ARJUN_DECISION);
    getDecisionDetailMock.mockResolvedValue(ARJUN_DECISION);
    listDecisionsMock.mockResolvedValue({
      journey_instance_id: ARJUN_JOURNEY.journey_instance_id,
      decisions: [ARJUN_DECISION],
      demo: DEMO,
    });

    const view = render(
      <JourneyExperience journeyInstanceId={ARJUN_JOURNEY.journey_instance_id} />,
    );
    fireEvent.click(await screen.findByRole("button", { name: "Check my journey" }));

    expect(evaluateJourneyMock).toHaveBeenCalledOnce();
    expect(evaluateJourneyMock).toHaveBeenCalledWith(ARJUN_JOURNEY.journey_instance_id);
    expect(await screen.findByRole("heading", { name: "Policy verification required" })).toBeTruthy();
    expect(screen.getByText("ClaimSaathi stopped instead of guessing.")).toBeTruthy();
    expect(screen.getByText("Did not invent a waiting period")).toBeTruthy();
    expect(screen.getByText(/Did not use AI to choose/)).toBeTruthy();
    expect(screen.getByText("AI was not used to fill the policy gap.")).toBeTruthy();
    expect(screen.getByText("AI used for decision")).toBeTruthy();
    expect(screen.getByText("false")).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "Ready to proceed" })).toBeNull();
    expect(screen.getByText("Form 19")).toBeTruthy();
    expect(screen.getByText(/Process identification does not mean/)).toBeTruthy();
    expect(screen.getByText(/No automated resolution is configured/)).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Start resolution/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /Check again/i })).toBeNull();
    expect(screen.getByRole("link", { name: "Review how this decision was made" }).getAttribute("href")).toBe("/how-it-works#safe-stop");
    expect(screen.getByRole("link", { name: "See how ClaimSaathi handles uncertainty" }).getAttribute("href")).toBe("/how-it-works#safe-stop");

    const pageText = view.container.textContent ?? "";
    expect(pageText).not.toMatch(/\b\d+\s*(?:days?|months?)\b/i);
    expect(pageText).not.toMatch(/\b(?:approved|rejected|guaranteed)\b/i);

    expect(await screen.findByText(FORMS_SOURCE.title)).toBeTruthy();
    expect(getPolicySourceMock).toHaveBeenCalledTimes(1);
    expect(getPolicySourceMock).toHaveBeenCalledWith("SRC-EPFO-FORMS");
    expect(screen.getByText(/supports the Form 19 process label/)).toBeTruthy();
    expect(screen.getByText(/No rule source is attached/)).toBeTruthy();
  });

  it("restores Arjun's policy-review result with read-only requests", async () => {
    getJourneyMock.mockResolvedValue({
      ...ARJUN_JOURNEY,
      latest_decision: ARJUN_DECISION,
    });
    getDecisionDetailMock.mockResolvedValue(ARJUN_DECISION);
    listDecisionsMock.mockResolvedValue({
      journey_instance_id: ARJUN_JOURNEY.journey_instance_id,
      decisions: [ARJUN_DECISION],
      demo: DEMO,
    });

    render(<JourneyExperience journeyInstanceId={ARJUN_JOURNEY.journey_instance_id} />);

    expect(await screen.findByRole("heading", { name: "Policy verification required" })).toBeTruthy();
    expect(screen.getByText("Form 19")).toBeTruthy();
    expect(getDecisionDetailMock).toHaveBeenCalledWith(
      ARJUN_JOURNEY.journey_instance_id,
      ARJUN_DECISION.decision_id,
    );
    expect(evaluateJourneyMock).not.toHaveBeenCalled();
    expect(startResolutionMock).not.toHaveBeenCalled();
  });

  it("keeps the stored policy-review result visible when source metadata fails to load", async () => {
    getJourneyMock.mockResolvedValue({
      ...ARJUN_JOURNEY,
      latest_decision: ARJUN_DECISION,
    });
    getDecisionDetailMock.mockResolvedValue(ARJUN_DECISION);
    getPolicySourceMock.mockRejectedValueOnce(new Error("private network detail"));

    render(<JourneyExperience journeyInstanceId={ARJUN_JOURNEY.journey_instance_id} />);

    expect(await screen.findByRole("heading", { name: "Policy verification required" })).toBeTruthy();
    expect(await screen.findByText("We couldn't complete that request right now.")).toBeTruthy();
    expect(screen.getByText("ClaimSaathi stopped instead of guessing.")).toBeTruthy();
    expect(screen.getByText("Form 19")).toBeTruthy();
    expect(screen.queryByText("private network detail")).toBeNull();
    expect(evaluateJourneyMock).not.toHaveBeenCalled();
  });

  it("renders Priya's complete backend-driven resolution and re-evaluation flow", async () => {
    getJourneyMock.mockResolvedValue(PRIYA_JOURNEY);
    evaluateJourneyMock
      .mockResolvedValueOnce(PRIYA_DECISION)
      .mockResolvedValueOnce(PRIYA_PASS);
    getDecisionDetailMock
      .mockResolvedValueOnce(PRIYA_DECISION)
      .mockResolvedValueOnce(PRIYA_PASS);
    listDecisionsMock
      .mockResolvedValueOnce({
        journey_instance_id: PRIYA_JOURNEY.journey_instance_id,
        decisions: [],
        demo: DEMO,
      })
      .mockResolvedValueOnce({
        journey_instance_id: PRIYA_JOURNEY.journey_instance_id,
        decisions: [PRIYA_DECISION],
        demo: DEMO,
      })
      .mockResolvedValueOnce({
        journey_instance_id: PRIYA_JOURNEY.journey_instance_id,
        decisions: [PRIYA_DECISION, PRIYA_PASS],
        demo: DEMO,
      });
    startResolutionMock.mockResolvedValue(
      resolutionInState("CITIZEN_ACTION_REQUIRED"),
    );
    confirmExternalStepStartedMock.mockResolvedValue(
      resolutionInState("WAITING_FOR_UPDATE"),
    );
    recheckResolutionMock
      .mockResolvedValueOnce(resolutionInState("STILL_BLOCKED"))
      .mockResolvedValueOnce(resolutionInState("RESOLVED"));
    simulatePreviousExitDateUpdateMock.mockResolvedValue({
      journey_instance_id: PRIYA_JOURNEY.journey_instance_id,
      event_type: "PREVIOUS_EXIT_DATE_UPDATED",
      synthetic_event: true,
      real_government_action_performed: false,
      changed: true,
      citizen_state_version: "priya-synthetic-v2",
      citizen_state_revision: 2,
      demo: DEMO,
    });

    render(<JourneyExperience journeyInstanceId={PRIYA_JOURNEY.journey_instance_id} />);
    fireEvent.click(await screen.findByRole("button", { name: "Check my journey" }));

    expect(await screen.findByRole("heading", { name: "Action required" })).toBeTruthy();
    expect(screen.getByText("Previous employment Date of Exit is missing")).toBeTruthy();
    expect(screen.queryByText("EXIT_DATE_MISSING")).toBeNull();
    expect(screen.getByText(/requires the previous employment record/)).toBeTruthy();
    expect(screen.getByText("UAN ready")).toBeTruthy();
    expect(screen.getAllByText("Ready").length).toBeGreaterThanOrEqual(2);
    expect(screen.queryByText("Form 13")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Start resolution" }));
    expect(startResolutionMock).toHaveBeenCalledWith(
      PRIYA_JOURNEY.journey_instance_id,
      {
        decision_id: PRIYA_DECISION.decision_id,
        issue_code: "EXIT_DATE_MISSING",
      },
    );
    expect(await screen.findByText("Your action is needed")).toBeTruthy();
    expect(screen.getByText(/applicable 60-day condition is satisfied/)).toBeTruthy();
    expect(screen.getByText("Member Unified Portal")).toBeTruthy();
    expect(screen.getByText("Authenticate using Aadhaar-linked OTP")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "I've started the official step" }));
    expect(await screen.findByRole("heading", { name: "Waiting for record update" })).toBeTruthy();
    expect(screen.getByText("ClaimSaathi has not verified the correction yet.")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Check for update" }));
    expect(await screen.findByRole("heading", { name: "Not updated yet" })).toBeTruthy();
    expect(screen.getByText(/still does not contain the required Date of Exit/)).toBeTruthy();
    expect(screen.queryByText(/rejected|failed/i)).toBeNull();
    expect(screen.getByText("Demo only")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Simulate Date of Exit update" }));
    expect(simulatePreviousExitDateUpdateMock).toHaveBeenCalledWith(
      PRIYA_JOURNEY.journey_instance_id,
    );
    expect(await screen.findByText("Synthetic record updated.")).toBeTruthy();
    expect(screen.getByText("Real government action performed: false")).toBeTruthy();
    expect(screen.queryByText("Blocker resolved")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "I've started the official step again" }));
    expect(await screen.findByRole("heading", { name: "Waiting for record update" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Check for update" }));
    expect(await screen.findByRole("heading", { name: "Blocker resolved" })).toBeTruthy();
    expect(screen.getByText(/does not automatically mean the whole transfer journey is ready/)).toBeTruthy();
    expect(screen.queryByText("Form 13")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Check journey again" }));
    expect(await screen.findByRole("heading", { name: "Ready to proceed" })).toBeTruthy();
    expect(screen.getByText("Form 13")).toBeTruthy();
    expect(screen.getByText("Earlier check")).toBeTruthy();
    expect(screen.getByText("Latest check")).toBeTruthy();
    expect(screen.getAllByText("Action required").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Ready to proceed").length).toBeGreaterThanOrEqual(2);
    expect(evaluateJourneyMock).toHaveBeenCalledTimes(2);
  });

  it.each([
    ["CITIZEN_ACTION_REQUIRED", "Your action is needed"],
    ["WAITING_FOR_UPDATE", "Waiting for record update"],
    ["STILL_BLOCKED", "Not updated yet"],
    ["RESOLVED", "Blocker resolved"],
  ] as const)(
    "restores %s from read-only backend state without triggering a command",
    async (resolutionState, expectedLabel) => {
      getJourneyMock.mockResolvedValue({
        ...PRIYA_JOURNEY,
        latest_decision: PRIYA_DECISION,
      });
      getDecisionDetailMock.mockResolvedValue(PRIYA_DECISION);
      listDecisionsMock.mockResolvedValue({
        journey_instance_id: PRIYA_JOURNEY.journey_instance_id,
        decisions: [PRIYA_DECISION],
        demo: DEMO,
      });
      listResolutionsMock.mockResolvedValue({
        journey_instance_id: PRIYA_JOURNEY.journey_instance_id,
        resolutions: [resolutionInState(resolutionState)],
        demo: DEMO,
      });

      render(<JourneyExperience journeyInstanceId={PRIYA_JOURNEY.journey_instance_id} />);

      expect(await screen.findByRole("heading", { name: expectedLabel })).toBeTruthy();
      expect(startResolutionMock).not.toHaveBeenCalled();
      expect(confirmExternalStepStartedMock).not.toHaveBeenCalled();
      expect(recheckResolutionMock).not.toHaveBeenCalled();
      expect(simulatePreviousExitDateUpdateMock).not.toHaveBeenCalled();
      expect(evaluateJourneyMock).not.toHaveBeenCalled();
    },
  );

  it("keeps ACTION_REQUIRED visible when starting a resolution fails", async () => {
    getJourneyMock.mockResolvedValue({
      ...PRIYA_JOURNEY,
      latest_decision: PRIYA_DECISION,
    });
    getDecisionDetailMock.mockResolvedValue(PRIYA_DECISION);
    listDecisionsMock.mockResolvedValue({
      journey_instance_id: PRIYA_JOURNEY.journey_instance_id,
      decisions: [PRIYA_DECISION],
      demo: DEMO,
    });
    startResolutionMock.mockRejectedValue(new Error("network detail"));

    render(<JourneyExperience journeyInstanceId={PRIYA_JOURNEY.journey_instance_id} />);
    fireEvent.click(await screen.findByRole("button", { name: "Start resolution" }));

    expect(await screen.findByText("We couldn't update this step right now.")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Action required" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Start resolution" })).toBeTruthy();
    expect(screen.queryByText("Your action is needed")).toBeNull();
  });

  it("does not imply a demo correction occurred when the synthetic event fails", async () => {
    getJourneyMock.mockResolvedValue({
      ...PRIYA_JOURNEY,
      latest_decision: PRIYA_DECISION,
    });
    getDecisionDetailMock.mockResolvedValue(PRIYA_DECISION);
    listDecisionsMock.mockResolvedValue({
      journey_instance_id: PRIYA_JOURNEY.journey_instance_id,
      decisions: [PRIYA_DECISION],
      demo: DEMO,
    });
    listResolutionsMock.mockResolvedValue({
      journey_instance_id: PRIYA_JOURNEY.journey_instance_id,
      resolutions: [resolutionInState("STILL_BLOCKED")],
      demo: DEMO,
    });
    simulatePreviousExitDateUpdateMock.mockRejectedValue(
      new Error("network detail"),
    );

    render(<JourneyExperience journeyInstanceId={PRIYA_JOURNEY.journey_instance_id} />);
    fireEvent.click(
      await screen.findByRole("button", {
        name: "Simulate Date of Exit update",
      }),
    );

    expect(
      await screen.findByText(
        "We couldn't update the synthetic demo record right now.",
      ),
    ).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Not updated yet" })).toBeTruthy();
    expect(screen.queryByText("Synthetic record updated.")).toBeNull();
    expect(screen.queryByText("Blocker resolved")).toBeNull();
  });
});
