import { describe, expect, it } from "vitest";

import type { DemoPersona } from "@/lib/api/types";

import {
  bindPersonasToIntents,
  DemoConfigurationError,
} from "./demo-intents";

const PERSONAS: DemoPersona[] = [
  {
    persona_id: "RAVI_PARTIAL_READY",
    display_name: "Ravi",
    scenario: "Synthetic funds-access scenario",
    compatible_goal: "ACCESS_SOME_PF_FUNDS",
  },
  {
    persona_id: "PRIYA_TRANSFER_MISSING_EXIT",
    display_name: "Priya",
    scenario: "Synthetic transfer scenario",
    compatible_goal: "TRANSFER_PF_AFTER_EMPLOYMENT_CHANGE",
  },
  {
    persona_id: "ARJUN_FINAL_SETTLEMENT",
    display_name: "Arjun",
    scenario: "Synthetic settlement scenario",
    compatible_goal: "FINAL_PF_SETTLEMENT",
  },
];

describe("demo intent binding", () => {
  it("binds each reviewed frontend intent to the matching backend persona", () => {
    const result = bindPersonasToIntents(PERSONAS);

    expect(result.map((intent) => intent.persona.persona_id)).toEqual([
      "RAVI_PARTIAL_READY",
      "PRIYA_TRANSFER_MISSING_EXIT",
      "ARJUN_FINAL_SETTLEMENT",
    ]);
  });

  it("fails safely when an expected persona is missing", () => {
    expect(() => bindPersonasToIntents(PERSONAS.slice(0, 2))).toThrow(
      DemoConfigurationError,
    );
  });

  it("fails safely instead of accepting a mismatched backend goal", () => {
    const mismatched = PERSONAS.map((persona) =>
      persona.persona_id === "RAVI_PARTIAL_READY"
        ? { ...persona, compatible_goal: "FINAL_PF_SETTLEMENT" }
        : persona,
    );

    expect(() => bindPersonasToIntents(mismatched)).toThrow(
      DemoConfigurationError,
    );
  });
});
