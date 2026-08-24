import type {
  IntentGoal,
  JourneyEvaluationResponse,
} from "@/lib/api/types";
import { issueWording } from "@/lib/decision-presentation";

import { DecisionAuditSummary } from "./decision-audit-summary";
import { ErrorState } from "./error-state";
import { JourneyDecisionHeader } from "./journey-decision-header";
import { OfficialProcessCard } from "./official-process-card";
import { PolicySources } from "./policy-sources";
import { PrerequisiteList } from "./prerequisite-list";
import { PrimaryButton } from "./primary-button";
import { SafetyNotice } from "./safety-notice";

export function JourneyDecision({
  citizenGoal,
  decision,
  evaluating,
  evaluationError,
  onEvaluate,
}: {
  citizenGoal: IntentGoal;
  decision: JourneyEvaluationResponse;
  evaluating: boolean;
  evaluationError: string | null;
  onEvaluate: () => void;
}) {
  return (
    <div aria-busy={evaluating}>
      <JourneyDecisionHeader state={decision.state} />

      {decision.issue_codes.length > 0 ? (
        <section className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5" aria-labelledby="issues-heading">
          <h2 id="issues-heading" className="font-bold text-amber-950">
            What the check found
          </h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-amber-950">
            {decision.issue_codes.map((issueCode) => (
              <li key={issueCode}>{issueWording(issueCode)}</li>
            ))}
          </ul>
          {decision.resolution_ids.length > 0 ? (
            <p className="mt-3 text-sm font-semibold text-amber-950">
              A reviewed resolution is available. No recovery workflow has been
              started.
            </p>
          ) : null}
        </section>
      ) : null}

      <div className="mt-8 grid items-start gap-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.85fr)]">
        <PrerequisiteList prerequisites={decision.prerequisites} />
        <div className="grid gap-6">
          {decision.state === "PASS" ? (
            <OfficialProcessCard
              citizenGoal={citizenGoal}
              journeyId={decision.journey_id}
              officialProcess={decision.official_process}
            />
          ) : null}
          <DecisionAuditSummary decision={decision} />
        </div>
      </div>

      {decision.sources.length > 0 ? (
        <div className="mt-10">
          <PolicySources key={decision.decision_id} sourceIds={decision.sources} />
        </div>
      ) : null}

      <div className="mt-10 border-t border-line pt-8">
        <PrimaryButton type="button" disabled={evaluating} onClick={onEvaluate}>
          {evaluating ? "Checking your journey…" : "Check again"}
        </PrimaryButton>
        {evaluating ? (
          <p role="status" aria-live="polite" className="mt-3 text-sm text-muted">
            Reviewing configured rules and synthetic records.
          </p>
        ) : null}
        {evaluationError ? (
          <div className="mt-5">
            <ErrorState message={evaluationError} onRetry={onEvaluate} />
          </div>
        ) : null}
      </div>

      <div className="mt-8">
        <SafetyNotice compact />
      </div>
    </div>
  );
}
