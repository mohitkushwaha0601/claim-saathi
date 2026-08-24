import type { DecisionSummary } from "@/lib/api/types";
import { DECISION_PRESENTATION } from "@/lib/decision-presentation";

export function DecisionHistory({ decisions }: { decisions: DecisionSummary[] }) {
  if (decisions.length < 2) return null;
  const earlier = decisions[0];
  const latest = decisions[decisions.length - 1];

  return (
    <section className="rounded-2xl border border-line bg-surface p-5 sm:p-6" aria-labelledby="history-heading">
      <h2 id="history-heading" className="text-xl font-bold text-ink">
        Journey checks
      </h2>
      <dl className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl bg-canvas p-4">
          <dt className="text-sm text-muted">Earlier check</dt>
          <dd className="mt-1 font-bold text-ink">
            {DECISION_PRESENTATION[earlier.state].label}
          </dd>
        </div>
        <div className="rounded-xl bg-brand-soft p-4">
          <dt className="text-sm text-muted">Latest check</dt>
          <dd className="mt-1 font-bold text-ink">
            {DECISION_PRESENTATION[latest.state].label}
          </dd>
        </div>
      </dl>
      <details className="mt-5 border-t border-line pt-4">
        <summary className="min-h-11 cursor-pointer font-semibold text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand">
          How this works
        </summary>
        <p className="mt-2 text-sm leading-6 text-muted">
          Fixing a blocker does not rewrite an earlier decision. ClaimSaathi
          runs all checks again and creates a new decision.
        </p>
      </details>
    </section>
  );
}
