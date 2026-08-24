import type { DemoPersona, IntentGoal } from "@/lib/api/types";

export type IntentIcon = "funds" | "transfer" | "settlement";

export interface IntentDefinition {
  goal: IntentGoal;
  expectedPersonaId: string;
  title: string;
  description: string;
  icon: IntentIcon;
  requiresAmount: boolean;
}

export interface BoundIntent extends IntentDefinition {
  persona: DemoPersona;
}

export const INTENT_DEFINITIONS: readonly IntentDefinition[] = [
  {
    goal: "ACCESS_SOME_PF_FUNDS",
    expectedPersonaId: "RAVI_PARTIAL_READY",
    title: "I need some money from my PF",
    description:
      "Check whether your current records are ready for a partial withdrawal.",
    icon: "funds",
    requiresAmount: true,
  },
  {
    goal: "TRANSFER_PF_AFTER_EMPLOYMENT_CHANGE",
    expectedPersonaId: "PRIYA_TRANSFER_MISSING_EXIT",
    title: "I changed jobs and want to move my old PF",
    description:
      "Check your previous employment record and transfer readiness.",
    icon: "transfer",
    requiresAmount: false,
  },
  {
    goal: "FINAL_PF_SETTLEMENT",
    expectedPersonaId: "ARJUN_FINAL_SETTLEMENT",
    title: "I left my job and want my PF",
    description:
      "Check what can be safely determined from the current policy configuration.",
    icon: "settlement",
    requiresAmount: false,
  },
] as const;

export class DemoConfigurationError extends Error {
  constructor() {
    super("The synthetic demo is not configured correctly right now.");
    this.name = "DemoConfigurationError";
  }
}

export function bindPersonasToIntents(
  personas: DemoPersona[],
): BoundIntent[] {
  if (personas.length !== INTENT_DEFINITIONS.length) {
    throw new DemoConfigurationError();
  }

  const byId = new Map<string, DemoPersona>();
  for (const persona of personas) {
    if (byId.has(persona.persona_id)) throw new DemoConfigurationError();
    byId.set(persona.persona_id, persona);
  }

  return INTENT_DEFINITIONS.map((intent) => {
    const persona = byId.get(intent.expectedPersonaId);
    if (!persona || persona.compatible_goal !== intent.goal) {
      throw new DemoConfigurationError();
    }
    return { ...intent, persona };
  });
}

export function intentForGoal(goal: IntentGoal): IntentDefinition | undefined {
  return INTENT_DEFINITIONS.find((intent) => intent.goal === goal);
}
