import { afterEach, describe, expect, it, vi } from "vitest";

import { ClaimSaathiApiError } from "./client";
import { getExecutionTrace } from "./traces";
import type { ExecutionTraceResponse } from "./types";

const TRACE: ExecutionTraceResponse = {
  journey_instance_id: "JRN-TRACE",
  decision_id: "DEC-TRACE",
  journey_id: "PF_PARTIAL_WITHDRAWAL",
  citizen_goal: "ACCESS_SOME_PF_FUNDS",
  official_process: { label: "Form 31", source_id: "SRC-EPFO-FORMS" },
  decision_state: "PASS",
  citizen_state_revision: 1,
  policy_version: "1.0.0",
  graph_version: "1.0.0",
  journey_definition_version: 1,
  ai_used_for_decision: false,
  demo: {
    environment: "DEMO",
    synthetic_data: true,
    real_government_action_performed: false,
  },
  stages: [
    {
      stage_id: "INTENT",
      stage_type: "INTENT",
      label: "Intent",
      state: "RECORDED",
      state_display: "Recorded",
      short_description: "Typed goal recorded.",
      input_summary: "Citizen goal",
      output_summary: "Typed CitizenIntent",
      details: {
        detail_type: "INTENT",
        citizen_goal: "ACCESS_SOME_PF_FUNDS",
        ai_used: false,
      },
    },
    {
      stage_id: "JOURNEY_PLANNER",
      stage_type: "JOURNEY_PLANNER",
      label: "Journey Planner",
      state: "RECORDED",
      state_display: "Recorded",
      short_description: "Exact mapping recorded.",
      input_summary: "ACCESS_SOME_PF_FUNDS",
      output_summary: "PF_PARTIAL_WITHDRAWAL",
      details: {
        detail_type: "JOURNEY_PLANNER",
        citizen_goal: "ACCESS_SOME_PF_FUNDS",
        journey_id: "PF_PARTIAL_WITHDRAWAL",
        method: "EXACT_REVIEWED_CONFIGURATION",
        ai_used: false,
      },
    },
    {
      stage_id: "POLICY_ENGINE",
      stage_type: "POLICY_ENGINE",
      label: "Policy Engine",
      state: "PASS",
      state_display: "Ready",
      short_description: "Stored rules.",
      input_summary: "Pinned policy",
      output_summary: "1 stored result",
      details: {
        detail_type: "POLICY_ENGINE",
        policy_version: "1.0.0",
        rules: [
          {
            rule_id: "P31-UAN-001",
            state: "PASS",
            issue_code: null,
            source_id: null,
          },
        ],
        ai_used: false,
      },
    },
    {
      stage_id: "PREREQUISITE_GRAPH",
      stage_type: "PREREQUISITE_GRAPH",
      label: "Prerequisite Graph",
      state: "PASS",
      state_display: "Ready",
      short_description: "Stored graph.",
      input_summary: "Pinned graph",
      output_summary: "Root state: PASS",
      details: {
        detail_type: "PREREQUISITE_GRAPH",
        graph_version: "1.0.0",
        root_node_id: "ROOT",
        nodes: [
          {
            node_id: "ROOT",
            label: "Prerequisites",
            state: "PASS",
            children_ids: [],
            rule_id: "P31-UAN-001",
          },
        ],
        ai_used: false,
      },
    },
    {
      stage_id: "DECISION_RECORD",
      stage_type: "DECISION_RECORD",
      label: "Decision",
      state: "PASS",
      state_display: "Ready",
      short_description: "Immutable result.",
      input_summary: "Stored artifacts",
      output_summary: "PASS",
      details: {
        detail_type: "DECISION_RECORD",
        decision_id: "DEC-TRACE",
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

function successfulJson(payload: unknown) {
  return { ok: true, status: 200, json: async () => payload };
}

afterEach(() => vi.unstubAllGlobals());

describe("execution trace API boundary", () => {
  it("uses the read-only decision trace endpoint with encoded identifiers", async () => {
    const fetchMock = vi.fn().mockResolvedValue(successfulJson(TRACE));
    vi.stubGlobal("fetch", fetchMock);

    const result = await getExecutionTrace("JRN/TRACE", "DEC/TRACE");

    expect(result.ai_used_for_decision).toBe(false);
    expect(fetchMock.mock.calls[0][0]).toContain(
      "/api/v1/journeys/JRN%2FTRACE/decisions/DEC%2FTRACE/trace",
    );
    expect(fetchMock.mock.calls[0][1]?.method).toBeUndefined();
    expect(fetchMock.mock.calls[0][1]?.body).toBeUndefined();
  });

  it("rejects malformed graph structure instead of rendering invented links", async () => {
    const malformed = structuredClone(TRACE);
    const graph = malformed.stages[3].details;
    if (graph.detail_type !== "PREREQUISITE_GRAPH") throw new Error("fixture");
    graph.nodes[0].children_ids = ["UNKNOWN_NODE"];
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(successfulJson(malformed)),
    );

    const error = await getExecutionTrace("JRN-TRACE", "DEC-TRACE").catch(
      (caught) => caught,
    );

    expect(error).toBeInstanceOf(ClaimSaathiApiError);
    expect(error).toMatchObject({
      code: "INVALID_EXECUTION_TRACE_RESPONSE",
    });
  });
});
