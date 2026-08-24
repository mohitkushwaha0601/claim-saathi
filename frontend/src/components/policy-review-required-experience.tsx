import Link from "next/link";

import type {
  DecisionDetailResponse,
  DecisionSummary,
  IntentGoal,
} from "@/lib/api/types";
import { journeyLabel } from "@/lib/decision-presentation";
import { intentForGoal } from "@/lib/demo-intents";

import { DecisionAuditSummary } from "./decision-audit-summary";
import { DecisionHistory } from "./decision-history";
import { JourneyDecisionHeader } from "./journey-decision-header";
import { PolicySources } from "./policy-sources";
import { PrerequisiteList } from "./prerequisite-list";
import { SafetyNotice } from "./safety-notice";

const SAFETY_FACTS = [
  "Did not invent a waiting period",
  "Did not use AI to choose between unresolved policy interpretations",
  "Did not claim eligibility or a government outcome",
] as const;

export function PolicyReviewRequiredExperience({
  citizenGoal,
  decision,
  decisionHistory,
}: {
  citizenGoal: IntentGoal;
  decision: DecisionDetailResponse;
  decisionHistory: DecisionSummary[];
}) {
  const intent = intentForGoal(citizenGoal);

  return (
    <div>
      <JourneyDecisionHeader state={decision.state} />

      <section
        aria-labelledby="safe-stop-heading"
        className="mt-6 rounded-2xl border border-violet-200 bg-violet-50 p-5 text-violet-950 sm:p-6"
      >
        <p className="text-xs font-bold tracking-[0.14em] uppercase">
          Deliberate safe stop
        </p>
        <h3 id="safe-stop-heading" className="mt-2 text-2xl font-bold tracking-[-0.025em]">
          ClaimSaathi stopped instead of guessing.
        </h3>
        <p className="mt-3 max-w-3xl text-sm leading-6 sm:text-base">
          ClaimSaathi cannot safely determine this journey from the currently
          reviewed policy configuration. We won&apos;t guess when the policy
          basis is unresolved.
        </p>
      </section>

      <section className="mt-8" aria-labelledby="not-done-heading">
        <p className="text-xs font-bold tracking-[0.14em] text-brand uppercase">
          Safety boundary
        </p>
        <h3 id="not-done-heading" className="mt-2 text-2xl font-bold tracking-[-0.025em] text-ink">
          What ClaimSaathi did not do
        </h3>
        <ul className="mt-5 grid gap-3 sm:grid-cols-3">
          {SAFETY_FACTS.map((fact) => (
            <li key={fact} className="flex items-start gap-3 rounded-2xl border border-line bg-surface p-4 text-sm font-semibold leading-6 text-ink">
              <span aria-hidden="true" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand">
                ✓
              </span>
              <span>{fact}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8 grid gap-5 lg:grid-cols-2" aria-label="Policy review result boundaries">
        <article className="rounded-2xl border border-brand/25 bg-brand-soft p-5 sm:p-6">
          <p className="text-xs font-bold tracking-[0.14em] text-brand uppercase">
            What we can determine
          </p>
          <dl className="mt-5 grid gap-4">
            <div className="rounded-xl border border-line bg-surface p-4">
              <dt className="text-xs font-bold tracking-[0.1em] text-muted uppercase">
                Your goal maps to
              </dt>
              <dd className="mt-2 text-lg font-bold text-ink">
                {intent?.summary ?? journeyLabel(decision.journey_id)}
              </dd>
            </div>
            <div className="rounded-xl border border-brand/25 bg-surface p-4">
              <dt className="text-xs font-bold tracking-[0.1em] text-muted uppercase">
                Identified official process
              </dt>
              <dd className="mt-2 text-3xl font-bold tracking-[-0.03em] text-ink">
                {decision.official_process.label}
              </dd>
              <dd className="mt-1 text-sm font-semibold text-brand">
                {journeyLabel(decision.journey_id)}
              </dd>
            </div>
          </dl>
          <p className="mt-4 text-sm font-semibold leading-6 text-ink">
            Process identification does not mean the journey is currently
            verified as ready.
          </p>
        </article>

        <article className="rounded-2xl border border-violet-200 bg-violet-50 p-5 sm:p-6">
          <p className="text-xs font-bold tracking-[0.14em] text-violet-800 uppercase">
            What we cannot safely determine
          </p>
          <h3 className="mt-3 text-xl font-bold leading-7 text-violet-950">
            Whether the currently reviewed policy configuration supports a
            final eligibility or readiness decision.
          </h3>
          <p className="mt-4 text-sm leading-6 text-violet-900">
            No automated resolution is configured for this policy-review
            state.
          </p>
        </article>
      </section>

      <div className="mt-8 grid items-start gap-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.85fr)]">
        <PrerequisiteList prerequisites={decision.prerequisites} />
        <div className="grid gap-6">
          <DecisionAuditSummary decision={decision} />
          <DecisionHistory decisions={decisionHistory} />
        </div>
      </div>

      <details className="mt-8 rounded-2xl border border-line bg-surface p-5 sm:p-6">
        <summary className="min-h-11 cursor-pointer text-lg font-bold text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand">
          Why did ClaimSaathi stop?
        </summary>
        <div className="mt-3 max-w-3xl text-sm leading-6 text-muted">
          <p className="font-semibold text-ink">Sometimes a trustworthy system should stop.</p>
          <p className="mt-2">
            The configured policy evidence for this journey requires review
            before ClaimSaathi can make a deterministic readiness decision.
            Policy verification required means the reviewed policy basis needs
            human or configuration review. It is different from being unable
            to verify a required trusted record.
          </p>
          <Link href="/how-it-works#safe-stop" className="mt-4 inline-flex min-h-11 items-center font-semibold text-brand underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-brand">
            See how ClaimSaathi handles uncertainty
          </Link>
        </div>
      </details>

      {decision.sources.length > 0 ? (
        <div className="mt-10">
          <PolicySources
            sourceIds={decision.sources}
            eyebrow="Decision evidence"
            heading="Sources used by evaluated rules"
            description="These source IDs come from the stored decision. Their presence does not by itself resolve the policy-review state."
          />
        </div>
      ) : (
        <p className="mt-10 rounded-xl border border-line bg-surface p-4 text-sm leading-6 text-muted">
          No rule source is attached to the policy-review marker in this
          decision. The process metadata source below supports only the
          identified form label.
        </p>
      )}

      <div className="mt-8">
        <PolicySources
          sourceIds={[decision.official_process.source_id]}
          eyebrow="Process metadata"
          heading="Identified-process source"
          description={`This source supports the ${decision.official_process.label} process label. It does not establish that this journey is ready or resolve the policy-review state.`}
        />
      </div>

      <nav className="mt-10 flex flex-col gap-3 border-t border-line pt-8 sm:flex-row" aria-label="Policy review next steps">
        <Link href="/how-it-works#safe-stop" className="inline-flex min-h-12 items-center justify-center rounded-xl bg-brand px-5 py-3 font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-brand">
          Review how this decision was made
        </Link>
        <Link href="/" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-line-strong bg-surface px-5 py-3 font-semibold text-ink focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-brand">
          Start another journey
        </Link>
      </nav>

      <div className="mt-8">
        <SafetyNotice compact />
      </div>
    </div>
  );
}
