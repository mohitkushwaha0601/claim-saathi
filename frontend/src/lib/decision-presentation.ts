import type { DecisionState, JourneyId } from "@/lib/api/types";

export type DecisionTone = "positive" | "attention" | "neutral" | "review";

export interface DecisionPresentation {
  label: string;
  prerequisiteLabel: string;
  supportingCopy: string;
  tone: DecisionTone;
}

export interface DecisionVisual {
  icon: string;
  classes: string;
}

export const DECISION_VISUALS: Record<DecisionState, DecisionVisual> = {
  PASS: {
    icon: "✓",
    classes: "border-emerald-200 bg-emerald-50 text-emerald-950",
  },
  ACTION_REQUIRED: {
    icon: "!",
    classes: "border-amber-200 bg-amber-50 text-amber-950",
  },
  NOT_ELIGIBLE: {
    icon: "!",
    classes: "border-amber-200 bg-amber-50 text-amber-950",
  },
  UNABLE_TO_VERIFY: {
    icon: "?",
    classes: "border-slate-300 bg-slate-50 text-slate-950",
  },
  NOT_APPLICABLE: {
    icon: "–",
    classes: "border-slate-300 bg-slate-50 text-slate-950",
  },
  POLICY_REVIEW_REQUIRED: {
    icon: "?",
    classes: "border-violet-200 bg-violet-50 text-violet-950",
  },
};

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
      "One or more prerequisites need attention before this journey can proceed.",
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
      "We found the relevant journey, but the reviewed policy configuration does not support a safe automated determination.",
    tone: "review",
  },
};

const JOURNEY_LABELS: Record<JourneyId, string> = {
  PF_PARTIAL_WITHDRAWAL: "Partial withdrawal",
  PF_TRANSFER: "PF transfer",
  PF_FINAL_SETTLEMENT: "Final PF settlement",
};

export interface IssuePresentation {
  title: string;
  supportingCopy: string;
  whyItMatters: string | null;
}

const ISSUE_PRESENTATION: Readonly<Record<string, IssuePresentation>> = {
  EXIT_DATE_MISSING: {
    title: "Previous employment Date of Exit is missing",
    supportingCopy:
      "This record needs attention before the transfer journey can continue.",
    whyItMatters:
      "The selected transfer journey requires the previous employment record to contain a Date of Exit.",
  },
};

export function journeyLabel(journeyId: JourneyId): string {
  return JOURNEY_LABELS[journeyId];
}

export function issuePresentation(issueCode: string): IssuePresentation {
  return (
    ISSUE_PRESENTATION[issueCode] ?? {
      title: "A journey prerequisite needs attention",
      supportingCopy:
        "ClaimSaathi found an issue that must be reviewed before this journey can continue.",
      whyItMatters: null,
    }
  );
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
