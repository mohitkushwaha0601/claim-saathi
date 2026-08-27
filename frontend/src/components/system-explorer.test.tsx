import { fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import HowItWorksPage from "@/app/how-it-works/page";
import { listDemoPersonas } from "@/lib/api/demo";
import { createJourney, evaluateJourney } from "@/lib/api/journeys";
import { getPolicySource } from "@/lib/api/policy";
import { getExecutionTrace } from "@/lib/api/traces";
import type {
  DecisionState,
  DemoPersonaListResponse,
  ExecutionTraceResponse,
  JourneyCreatedResponse,
  JourneyEvaluationResponse,
} from "@/lib/api/types";
import { renderWithProviders } from "@/test/render";

import { AppHeader } from "./app-header";

vi.mock("@/lib/api/demo", () => ({ listDemoPersonas: vi.fn() }));
vi.mock("@/lib/api/journeys", () => ({
  createJourney: vi.fn(),
  evaluateJourney: vi.fn(),
}));
vi.mock("@/lib/api/traces", () => ({ getExecutionTrace: vi.fn() }));
vi.mock("@/lib/api/policy", () => ({ getPolicySource: vi.fn() }));

const listDemoPersonasMock = vi.mocked(listDemoPersonas);
const createJourneyMock = vi.mocked(createJourney);
const evaluateJourneyMock = vi.mocked(evaluateJourney);
const getExecutionTraceMock = vi.mocked(getExecutionTrace);
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
      scenario: "Synthetic ready path",
      compatible_goal: "ACCESS_SOME_PF_FUNDS",
    },
    {
      persona_id: "PRIYA_TRANSFER_MISSING_EXIT",
      display_name: "Priya",
      scenario: "Synthetic blocker path",
      compatible_goal: "TRANSFER_PF_AFTER_EMPLOYMENT_CHANGE",
    },
    {
      persona_id: "ARJUN_FINAL_SETTLEMENT",
      display_name: "Arjun",
      scenario: "Synthetic safety path",
      compatible_goal: "FINAL_PF_SETTLEMENT",
    },
  ],
  demo: DEMO,
};

const SCENARIO_DATA = {
  RAVI_PARTIAL_READY: {
    goal: "ACCESS_SOME_PF_FUNDS",
    journeyId: "PF_PARTIAL_WITHDRAWAL",
    journeyInstanceId: "JRN-RAVI-TRACE",
    decisionId: "DEC-RAVI-TRACE",
    state: "PASS",
    process: "Form 31",
    rules: [
      ["P31-UAN-001", "PASS", null, null],
      ["P31-AADHAAR-001", "PASS", null, null],
      ["P31-BANK-001", "PASS", null, null],
      ["P31-SERVICE-001", "PASS", null, "SRC-EPFO-PARTIAL-2026"],
      ["P31-AMOUNT-001", "PASS", null, "SRC-EPFO-PARTIAL-2026"],
    ],
  },
  PRIYA_TRANSFER_MISSING_EXIT: {
    goal: "TRANSFER_PF_AFTER_EMPLOYMENT_CHANGE",
    journeyId: "PF_TRANSFER",
    journeyInstanceId: "JRN-PRIYA-TRACE",
    decisionId: "DEC-PRIYA-TRACE",
    state: "ACTION_REQUIRED",
    process: "Form 13",
    rules: [
      [
        "T13-DOE-001",
        "ACTION_REQUIRED",
        "EXIT_DATE_MISSING",
        "SRC-EPFO-TRANSFER-DOE",
      ],
    ],
  },
  ARJUN_FINAL_SETTLEMENT: {
    goal: "FINAL_PF_SETTLEMENT",
    journeyId: "PF_FINAL_SETTLEMENT",
    journeyInstanceId: "JRN-ARJUN-TRACE",
    decisionId: "DEC-ARJUN-TRACE",
    state: "POLICY_REVIEW_REQUIRED",
    process: "Form 19",
    rules: [
      [
        "FINAL_SETTLEMENT_WAIT_PERIOD",
        "POLICY_REVIEW_REQUIRED",
        null,
        null,
      ],
    ],
  },
} as const;

type ScenarioKey = keyof typeof SCENARIO_DATA;

function scenarioForJourney(journeyInstanceId: string) {
  return Object.values(SCENARIO_DATA).find(
    (item) => item.journeyInstanceId === journeyInstanceId,
  )!;
}

function journeyResponse(personaId: ScenarioKey): JourneyCreatedResponse {
  const item = SCENARIO_DATA[personaId];
  return {
    journey_instance_id: item.journeyInstanceId,
    persona_id: personaId,
    citizen_goal: item.goal,
    journey_id: item.journeyId,
    journey_definition_version: 1,
    created_at: "2026-08-24T06:00:00Z",
    official_process: { label: item.process, source_id: "SRC-EPFO-FORMS" },
    citizen_state_revision: 1,
    demo: DEMO,
  };
}

function evaluationResponse(
  journeyInstanceId: string,
): JourneyEvaluationResponse {
  const item = scenarioForJourney(journeyInstanceId);
  return {
    journey_instance_id: item.journeyInstanceId,
    decision_id: item.decisionId,
    journey_id: item.journeyId,
    state: item.state,
    state_display: item.state.replaceAll("_", " "),
    official_process: { label: item.process, source_id: "SRC-EPFO-FORMS" },
    issue_codes: item.state === "ACTION_REQUIRED" ? ["EXIT_DATE_MISSING"] : [],
    resolution_ids: item.state === "ACTION_REQUIRED" ? ["RES_EXIT"] : [],
    policy_version: "1.0.0",
    graph_version: "1.0.0",
    journey_definition_version: 1,
    citizen_state_revision: 1,
    evaluated_at: "2026-08-24T06:30:00Z",
    prerequisites: [],
    sources: [],
    ai_used_for_decision: false,
    demo: DEMO,
  };
}

function traceResponse(journeyInstanceId: string): ExecutionTraceResponse {
  const item = scenarioForJourney(journeyInstanceId);
  const state = item.state as DecisionState;
  const leafIds =
    item.journeyId === "PF_PARTIAL_WITHDRAWAL"
      ? ["UAN_READY", "AADHAAR_READY", "BANK_READY"]
      : ["POLICY_LEAF"];
  const graphNodes = [
    {
      node_id: "ROOT",
      label:
        item.journeyId === "PF_PARTIAL_WITHDRAWAL"
          ? "Partial withdrawal prerequisites"
          : item.journeyId === "PF_TRANSFER"
            ? "Transfer prerequisites"
            : "Final settlement prerequisites",
      state,
      children_ids: leafIds,
      rule_id: null,
    },
    ...leafIds.map((nodeId, index) => ({
      node_id: nodeId,
      label:
        nodeId === "UAN_READY"
          ? "UAN"
          : nodeId === "AADHAAR_READY"
            ? "Aadhaar"
            : nodeId === "BANK_READY"
              ? "Bank"
              : item.journeyId === "PF_TRANSFER"
                ? "Previous employment Date of Exit"
                : "Policy verified",
      state: item.journeyId === "PF_PARTIAL_WITHDRAWAL" ? ("PASS" as const) : state,
      children_ids: [],
      rule_id: item.rules[index]?.[0] ?? item.rules[0][0],
    })),
  ];
  const stageState = state;
  return {
    journey_instance_id: item.journeyInstanceId,
    decision_id: item.decisionId,
    journey_id: item.journeyId,
    citizen_goal: item.goal,
    official_process: { label: item.process, source_id: "SRC-EPFO-FORMS" },
    decision_state: state,
    citizen_state_revision: 1,
    policy_version: "1.0.0",
    graph_version: "1.0.0",
    journey_definition_version: 1,
    ai_used_for_decision: false,
    demo: DEMO,
    stages: [
      {
        stage_id: "INTENT",
        stage_type: "INTENT",
        label: "Intent",
        state: "RECORDED",
        state_display: "Recorded",
        short_description: "The typed citizen goal was recorded.",
        input_summary: "Citizen-selected goal",
        output_summary: `Typed CitizenIntent: ${item.goal}`,
        details: { detail_type: "INTENT", citizen_goal: item.goal, ai_used: false },
      },
      {
        stage_id: "JOURNEY_PLANNER",
        stage_type: "JOURNEY_PLANNER",
        label: "Journey Planner",
        state: "RECORDED",
        state_display: "Recorded",
        short_description: "Exact mapping selected the journey.",
        input_summary: item.goal,
        output_summary: item.journeyId,
        details: {
          detail_type: "JOURNEY_PLANNER",
          citizen_goal: item.goal,
          journey_id: item.journeyId,
          method: "EXACT_REVIEWED_CONFIGURATION",
          ai_used: false,
        },
      },
      {
        stage_id: "POLICY_ENGINE",
        stage_type: "POLICY_ENGINE",
        label: "Policy Engine",
        state: stageState,
        state_display: state === "PASS" ? "Ready" : state.replaceAll("_", " "),
        short_description: "Stored rule results from reviewed policy.",
        input_summary: "Pinned policy 1.0.0",
        output_summary: `${item.rules.length} stored rule results`,
        details: {
          detail_type: "POLICY_ENGINE",
          policy_version: "1.0.0",
          rules: item.rules.map(([ruleId, ruleState, issueCode, sourceId]) => ({
            rule_id: ruleId,
            state: ruleState,
            issue_code: issueCode,
            source_id: sourceId,
          })),
          ai_used: false,
        },
      },
      {
        stage_id: "PREREQUISITE_GRAPH",
        stage_type: "PREREQUISITE_GRAPH",
        label: "Prerequisite Graph",
        state: stageState,
        state_display: state === "PASS" ? "Ready" : state.replaceAll("_", " "),
        short_description: "The pinned graph combined stored results.",
        input_summary: "Pinned graph 1.0.0",
        output_summary: `Root state: ${state}`,
        details: {
          detail_type: "PREREQUISITE_GRAPH",
          graph_version: "1.0.0",
          root_node_id: "ROOT",
          nodes: graphNodes,
          ai_used: false,
        },
      },
      {
        stage_id: "DECISION_RECORD",
        stage_type: "DECISION_RECORD",
        label: "Decision",
        state: stageState,
        state_display: state === "PASS" ? "Ready" : state.replaceAll("_", " "),
        short_description: "The result was recorded immutably.",
        input_summary: "Stored deterministic artifacts",
        output_summary: `${state} · ${item.decisionId}`,
        details: {
          detail_type: "DECISION_RECORD",
          decision_id: item.decisionId,
          citizen_state_revision: 1,
          policy_version: "1.0.0",
          graph_version: "1.0.0",
          journey_definition_version: 1,
          evaluated_at: "2026-08-24T06:30:00Z",
          ai_used_for_decision: false,
        },
      },
    ],
  };
}

describe("Phase 7D system explorer", () => {
  beforeEach(() => {
    listDemoPersonasMock.mockResolvedValue(PERSONAS);
    createJourneyMock.mockImplementation(async (request) =>
      journeyResponse(request.persona_id as ScenarioKey),
    );
    evaluateJourneyMock.mockImplementation(async (journeyId) =>
      evaluationResponse(journeyId),
    );
    getExecutionTraceMock.mockImplementation(async (journeyId) =>
      traceResponse(journeyId),
    );
    getPolicySourceMock.mockResolvedValue({
      source_id: "SRC-EPFO-PARTIAL-2026",
      authority: "Reviewed public authority",
      title: "Reviewed source metadata",
      document_type: "PRESS_RELEASE",
      published_at: null,
      effective_from: null,
      effective_to: null,
      reference_url: "https://example.test/source",
      corroborating_urls: [],
      verified_at: "2026-08-24T00:00:00Z",
      scope: "Narrow rule scope",
      notes: null,
      status: "ACTIVE",
      demo: DEMO,
    });
  });

  it("renders the /how-it-works narrative, comparison, scenarios, and navigation", () => {
    renderWithProviders(<HowItWorksPage />);

    expect(screen.getByRole("heading", { name: "From form hunting to guided journeys" })).toBeTruthy();
    expect(screen.getByText("Typical process today")).toBeTruthy();
    expect(screen.getByText("With ClaimSaathi")).toBeTruthy();
    expect(screen.getByText("The citizen performs the orchestration.")).toBeTruthy();
    expect(screen.getByText(/The system performs the orchestration/)).toBeTruthy();
    expect(screen.getByRole("button", { name: /Ravi.*Ready path/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Priya.*Blocker path/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Arjun.*Safety path/ })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Try the citizen journey" }).getAttribute("href")).toBe("/");
    expect(screen.getByText("One-way explanation path")).toBeTruthy();
    expect(screen.getByText("Canonical explanation")).toBeTruthy();
    expect(screen.getByText("Sanitizer")).toBeTruthy();
    expect(screen.getByText("NO PATH BACK TO DECISION")).toBeTruthy();
    expect(screen.getByText(/AI is optional and explanation-only/)).toBeTruthy();
    expect(listDemoPersonasMock).not.toHaveBeenCalled();

    renderWithProviders(<AppHeader />);
    expect(screen.getByRole("link", { name: "How it works" }).getAttribute("href")).toBe("/how-it-works");
    expect(screen.getByRole("link", { name: "Start a task" }).getAttribute("href")).toBe("/#start-a-task");
    expect(screen.getByRole("link", { name: "Safety" }).getAttribute("href")).toBe("/how-it-works#safe-stop");
  });

  it("runs the real demo API sequence and renders Ravi's backend trace", async () => {
    renderWithProviders(<HowItWorksPage />);
    fireEvent.click(screen.getByRole("button", { name: "Generate synthetic trace" }));

    expect(await screen.findByText("Ravi's stored decision")).toBeTruthy();
    expect(createJourneyMock).toHaveBeenCalledWith({
      persona_id: "RAVI_PARTIAL_READY",
      goal: "ACCESS_SOME_PF_FUNDS",
    });
    expect(evaluateJourneyMock).toHaveBeenCalledWith("JRN-RAVI-TRACE");
    expect(getExecutionTraceMock).toHaveBeenCalledWith(
      "JRN-RAVI-TRACE",
      "DEC-RAVI-TRACE",
    );
    expect(createJourneyMock.mock.invocationCallOrder[0]).toBeLessThan(
      evaluateJourneyMock.mock.invocationCallOrder[0],
    );
    expect(evaluateJourneyMock.mock.invocationCallOrder[0]).toBeLessThan(
      getExecutionTraceMock.mock.invocationCallOrder[0],
    );
    expect(screen.getByText("Form 31", { exact: false })).toBeTruthy();
  });

  it("shows actual policy rules, source metadata, AI No, and keyboard-operable stage buttons", async () => {
    renderWithProviders(<HowItWorksPage />);
    fireEvent.click(screen.getByRole("button", { name: "Generate synthetic trace" }));
    await screen.findByText("Ravi's stored decision");

    const policyButton = screen.getByRole("button", { name: /Stage 3.*Policy Engine/ });
    expect(policyButton.tagName).toBe("BUTTON");
    fireEvent.click(policyButton);

    expect(await screen.findByText("P31-UAN-001")).toBeTruthy();
    expect(screen.getByText("P31-AMOUNT-001")).toBeTruthy();
    expect(screen.getByText("AI used")).toBeTruthy();
    expect(screen.getAllByText("No").length).toBeGreaterThan(0);
    expect(
      await screen.findByText("Current partial-withdrawal framework"),
    ).toBeTruthy();
    expect(policyButton.getAttribute("aria-pressed")).toBe("true");
  });

  it("renders the connected prerequisite graph from backend node data", async () => {
    renderWithProviders(<HowItWorksPage />);
    fireEvent.click(screen.getByRole("button", { name: "Generate synthetic trace" }));
    await screen.findByText("Ravi's stored decision");
    fireEvent.click(screen.getByRole("button", { name: /Stage 4.*Prerequisite Graph/ }));

    expect(screen.getByLabelText("Connected prerequisite graph")).toBeTruthy();
    expect(screen.getByText("Partial withdrawal prerequisites")).toBeTruthy();
    expect(screen.getByText("UAN")).toBeTruthy();
    expect(screen.getByText("Aadhaar")).toBeTruthy();
    expect(screen.getByText("Bank")).toBeTruthy();
  });

  it("renders Priya's live blocker and separates the recovery architecture", async () => {
    renderWithProviders(<HowItWorksPage />);
    fireEvent.click(screen.getByRole("button", { name: /Priya.*Blocker path/ }));
    fireEvent.click(screen.getByRole("button", { name: "Generate synthetic trace" }));
    await screen.findByText("Priya's stored decision");
    fireEvent.click(screen.getByRole("button", { name: /Stage 3.*Policy Engine/ }));

    expect(screen.getByText("T13-DOE-001")).toBeTruthy();
    expect(screen.getByText("EXIT_DATE_MISSING", { exact: false })).toBeTruthy();
    expect(screen.getByText(/Resolving one blocker does not rewrite or automatically pass/)).toBeTruthy();
    expect(screen.getByText("Architecture · not the current live trace")).toBeTruthy();
    expect(screen.getByText("whole journey is not automatically PASS")).toBeTruthy();
  });

  it("renders Arjun's backend safe stop without inventing a wait or AI fallback", async () => {
    renderWithProviders(<HowItWorksPage />);
    fireEvent.click(screen.getByRole("button", { name: /Arjun.*Safety path/ }));
    fireEvent.click(screen.getByRole("button", { name: "Generate synthetic trace" }));

    expect(await screen.findByText("The system stops instead of guessing.")).toBeTruthy();
    expect(
      screen.getAllByText("POLICY_REVIEW_REQUIRED", { exact: false }).length,
    ).toBeGreaterThan(0);
    expect(screen.getByText("AI fallback")).toBeTruthy();
    expect(screen.getByText("Not used")).toBeTruthy();
    expect(screen.getByText("Not invented")).toBeTruthy();
    expect(screen.queryByText(/60 days/i)).toBeNull();
    expect(screen.queryByText(/12 months/i)).toBeNull();
  });

  it("keeps a safe error state when trace loading fails", async () => {
    getExecutionTraceMock.mockRejectedValueOnce(new Error("raw network detail"));
    renderWithProviders(<HowItWorksPage />);
    fireEvent.click(screen.getByRole("button", { name: "Generate synthetic trace" }));

    expect((await screen.findByRole("alert")).textContent).toContain(
      "We couldn't generate this synthetic trace right now.",
    );
    expect(screen.queryByText("raw network detail")).toBeNull();
    expect(screen.getByText("No live trace generated yet")).toBeTruthy();
  });
});
