import type { DecisionState, JourneyId } from "@/lib/api/types";

export type DecisionTone = "positive" | "attention" | "neutral" | "review";

export interface DecisionPresentation {
  label: string;
  prerequisiteLabel: string;
  supportingCopy: string;
  tone: DecisionTone;
}

export const DECISION_PRESENTATION: Record<
  DecisionState,
  DecisionPresentation
> = {
  PASS: {
    label: "Ready to proceed",
    prerequisiteLabel: "Ready",
    supportingCopy:
      "All prerequisites represented in this ClaimSaathi journey currently pass.",
    tone: "positive",
  },
  ACTION_REQUIRED: {
    label: "Action required",
    prerequisiteLabel: "Action required",
    supportingCopy:
      "One or more configured prerequisites currently need attention.",
    tone: "attention",
  },
  NOT_ELIGIBLE: {
    label: "Not currently eligible",
    prerequisiteLabel: "Not currently eligible",
    supportingCopy:
      "A configured prerequisite is not currently met for this journey.",
    tone: "attention",
  },
  UNABLE_TO_VERIFY: {
    label: "Unable to verify",
    prerequisiteLabel: "Unable to verify",
    supportingCopy:
      "ClaimSaathi could not verify all required trusted information.",
    tone: "neutral",
  },
  NOT_APPLICABLE: {
    label: "This journey does not currently apply",
    prerequisiteLabel: "Does not currently apply",
    supportingCopy:
      "A configured fact indicates that this journey does not currently apply.",
    tone: "neutral",
  },
  POLICY_REVIEW_REQUIRED: {
    label: "Policy verification required",
    prerequisiteLabel: "Policy verification required",
    supportingCopy:
      "ClaimSaathi will not automate this result while the reviewed policy configuration is unresolved.",
    tone: "review",
  },
};

const JOURNEY_LABELS: Record<JourneyId, string> = {
  PF_PARTIAL_WITHDRAWAL: "Partial withdrawal",
  PF_TRANSFER: "PF transfer",
  PF_FINAL_SETTLEMENT: "Final PF settlement",
};

const ISSUE_WORDING: Readonly<Record<string, string>> = {
  EXIT_DATE_MISSING: "A required employment detail needs attention.",
};

export function journeyLabel(journeyId: JourneyId): string {
  return JOURNEY_LABELS[journeyId];
}

export function issueWording(issueCode: string): string {
  return ISSUE_WORDING[issueCode] ?? "Additional action is required.";
}

export function formatCheckedAt(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recorded by the backend";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(date);
}
