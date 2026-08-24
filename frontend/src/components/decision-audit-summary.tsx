import type { JourneyEvaluationResponse } from "@/lib/api/types";
import { formatCheckedAt } from "@/lib/decision-presentation";

export function DecisionAuditSummary({
  decision,
}: {
  decision: JourneyEvaluationResponse;
}) {
  return (
    <section className="rounded-2xl border border-line bg-surface p-5 sm:p-6" aria-labelledby="trust-heading">
      <h2 id="trust-heading" className="text-xl font-bold text-ink">
        Why you can trust this check
      </h2>
      <p className="mt-3 text-sm font-semibold leading-6 text-brand">
        Decision checks were deterministic. AI was not used to determine this
        result.
      </p>
      <p className="mt-2 text-sm leading-6 text-muted">
        ClaimSaathi used reviewed rules, synthetic records, and versioned
        configuration supplied by the backend.
      </p>
      <details className="mt-5 border-t border-line pt-4">
        <summary className="min-h-11 cursor-pointer font-semibold text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand">
          Technical details
        </summary>
        <dl className="mt-3 grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted">Decision ID</dt>
            <dd className="mt-1 break-all font-medium text-ink">
              {decision.decision_id}
            </dd>
          </div>
          <div>
            <dt className="text-muted">Checked at</dt>
            <dd className="mt-1 font-medium text-ink">
              {formatCheckedAt(decision.evaluated_at)} UTC
            </dd>
          </div>
          <div>
            <dt className="text-muted">Policy version</dt>
            <dd className="mt-1 break-all font-medium text-ink">
              {decision.policy_version}
            </dd>
          </div>
          <div>
            <dt className="text-muted">Graph version</dt>
            <dd className="mt-1 break-all font-medium text-ink">
              {decision.graph_version}
            </dd>
          </div>
        </dl>
      </details>
    </section>
  );
}
