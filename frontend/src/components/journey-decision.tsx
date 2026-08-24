import type {
  DecisionDetailResponse,
  DecisionSummary,
  IntentGoal,
  ResolutionResponse,
} from "@/lib/api/types";

import { DecisionHistory } from "./decision-history";
import { DecisionAuditSummary } from "./decision-audit-summary";
import { ErrorState } from "./error-state";
import { JourneyIssues } from "./journey-issues";
import { JourneyDecisionHeader } from "./journey-decision-header";
import { OfficialProcessCard } from "./official-process-card";
import { PolicySources } from "./policy-sources";
import { PrerequisiteList } from "./prerequisite-list";
import { PrimaryButton } from "./primary-button";
import { ResolutionNavigator } from "./resolution-navigator";
import { SafetyNotice } from "./safety-notice";

export function JourneyDecision({
  citizenGoal,
  journeyInstanceId,
  decision,
  decisionHistory,
  activeResolution,
  evaluating,
  evaluationError,
  onEvaluate,
}: {
  citizenGoal: IntentGoal;
  journeyInstanceId: string;
  decision: DecisionDetailResponse;
  decisionHistory: DecisionSummary[];
  activeResolution: ResolutionResponse | null;
  evaluating: boolean;
  evaluationError: string | null;
  onEvaluate: () => Promise<boolean>;
}) {
  const hasResolutionOpportunity = decision.rule_results.some(
    (result) =>
      result.issue_code !== null &&
      result.resolution_id !== null &&
      decision.issue_codes.includes(result.issue_code) &&
      decision.resolution_ids.includes(result.resolution_id),
  );

  return (
    <div aria-busy={evaluating}>
      <JourneyDecisionHeader state={decision.state} />

      <JourneyIssues decision={decision} />

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
          <DecisionHistory decisions={decisionHistory} />
        </div>
      </div>

      {decision.sources.length > 0 ? (
        <div className="mt-10">
          <PolicySources
            key={decision.decision_id}
            sourceIds={decision.sources}
            eyebrow="Decision evidence"
            heading="Rule source"
          />
        </div>
      ) : null}

      {decision.state === "ACTION_REQUIRED" &&
      (hasResolutionOpportunity || activeResolution) ? (
        <ResolutionNavigator
          journeyInstanceId={journeyInstanceId}
          decision={decision}
          initialResolution={activeResolution}
          onJourneyReevaluate={onEvaluate}
        />
      ) : null}

      {!(decision.state === "ACTION_REQUIRED" && (hasResolutionOpportunity || activeResolution)) ? (
      <div className="mt-10 border-t border-line pt-8">
        <PrimaryButton type="button" disabled={evaluating} onClick={() => void onEvaluate()}>
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
      ) : null}

      <div className="mt-8">
        <SafetyNotice compact />
      </div>
    </div>
  );
}
