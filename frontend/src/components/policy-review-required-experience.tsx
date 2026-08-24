"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

import type {
  DecisionDetailResponse,
  DecisionSummary,
  IntentGoal,
} from "@/lib/api/types";

import { DecisionAuditSummary } from "./decision-audit-summary";
import { DecisionHistory } from "./decision-history";
import { JourneyDecisionHeader } from "./journey-decision-header";
import { PolicySources } from "./policy-sources";
import { PrerequisiteList } from "./prerequisite-list";
import { SafetyNotice } from "./safety-notice";

export function PolicyReviewRequiredExperience({
  citizenGoal,
  decision,
  decisionHistory,
}: {
  citizenGoal: IntentGoal;
  decision: DecisionDetailResponse;
  decisionHistory: DecisionSummary[];
}) {
  const t = useTranslations();
  const safetyFacts = t.raw("PolicyReview.facts") as string[];

  return (
    <div>
      <JourneyDecisionHeader state={decision.state} />

      <section
        aria-labelledby="safe-stop-heading"
        className="mt-6 rounded-2xl border border-violet-200 bg-violet-50 p-5 text-violet-950 sm:p-6"
      >
        <p className="text-xs font-bold tracking-[0.14em] uppercase">
          {t("PolicyReview.safeStop")}
        </p>
        <h3 id="safe-stop-heading" className="mt-2 text-2xl font-bold tracking-[-0.025em]">
          {t("PolicyReview.stopped")}
        </h3>
        <p className="mt-3 max-w-3xl text-sm leading-6 sm:text-base">
          {t("PolicyReview.copy")}
        </p>
      </section>

      <section className="mt-8" aria-labelledby="not-done-heading">
        <p className="text-xs font-bold tracking-[0.14em] text-brand uppercase">
          {t("PolicyReview.boundary")}
        </p>
        <h3 id="not-done-heading" className="mt-2 text-2xl font-bold tracking-[-0.025em] text-ink">
          {t("PolicyReview.notDone")}
        </h3>
        <ul className="mt-5 grid gap-3 sm:grid-cols-3">
          {safetyFacts.map((fact) => (
            <li key={fact} className="flex items-start gap-3 rounded-2xl border border-line bg-surface p-4 text-sm font-semibold leading-6 text-ink">
              <span aria-hidden="true" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand">
                ✓
              </span>
              <span>{fact}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8 grid gap-5 lg:grid-cols-2" aria-label={t("PolicyReview.resultBoundary")}>
        <article className="rounded-2xl border border-brand/25 bg-brand-soft p-5 sm:p-6">
          <p className="text-xs font-bold tracking-[0.14em] text-brand uppercase">
            {t("PolicyReview.can")}
          </p>
          <dl className="mt-5 grid gap-4">
            <div className="rounded-xl border border-line bg-surface p-4">
              <dt className="text-xs font-bold tracking-[0.1em] text-muted uppercase">
                {t("PolicyReview.maps")}
              </dt>
              <dd className="mt-2 text-lg font-bold text-ink">
                {t(`Home.intents.${citizenGoal}.summary`)}
              </dd>
            </div>
            <div className="rounded-xl border border-brand/25 bg-surface p-4">
              <dt className="text-xs font-bold tracking-[0.1em] text-muted uppercase">
                {t("PolicyReview.process")}
              </dt>
              <dd className="mt-2 text-3xl font-bold tracking-[-0.03em] text-ink">
                {decision.official_process.label}
              </dd>
              <dd className="mt-1 text-sm font-semibold text-brand">
                {t(`Process.journeys.${decision.journey_id}`)}
              </dd>
            </div>
          </dl>
          <p className="mt-4 text-sm font-semibold leading-6 text-ink">
            {t("PolicyReview.notReady")}
          </p>
        </article>

        <article className="rounded-2xl border border-violet-200 bg-violet-50 p-5 sm:p-6">
          <p className="text-xs font-bold tracking-[0.14em] text-violet-800 uppercase">
            {t("PolicyReview.cannot")}
          </p>
          <h3 className="mt-3 text-xl font-bold leading-7 text-violet-950">
            {t("PolicyReview.cannotCopy")}
          </h3>
          <p className="mt-4 text-sm leading-6 text-violet-900">
            {t("PolicyReview.noResolution")}
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
          {t("PolicyReview.whyStop")}
        </summary>
        <div className="mt-3 max-w-3xl text-sm leading-6 text-muted">
          <p className="font-semibold text-ink">{t("PolicyReview.trustworthyStop")}</p>
          <p className="mt-2">
            {t("PolicyReview.whyCopy")}
          </p>
          <Link href="/how-it-works#safe-stop" prefetch={false} className="mt-4 inline-flex min-h-11 items-center font-semibold text-brand underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-brand">
            {t("PolicyReview.explorer")}
          </Link>
        </div>
      </details>

      {decision.sources.length > 0 ? (
        <div className="mt-10">
          <PolicySources
            sourceIds={decision.sources}
            eyebrow={t("Sources.decisionEvidence")}
            heading={t("PolicyReview.sourcesUsed")}
            description={t("PolicyReview.sourcesDescription")}
          />
        </div>
      ) : (
        <p className="mt-10 rounded-xl border border-line bg-surface p-4 text-sm leading-6 text-muted">
          {t("PolicyReview.noRuleSourceLong")}
        </p>
      )}

      <div className="mt-8">
        <PolicySources
          sourceIds={[decision.official_process.source_id]}
          eyebrow={t("PolicyReview.processMetadata")}
          heading={t("PolicyReview.identifiedProcessSource")}
          description={t("PolicyReview.identifiedProcessDescription", { form: decision.official_process.label })}
        />
      </div>

      <nav className="mt-10 flex flex-col gap-3 border-t border-line pt-8 sm:flex-row" aria-label={t("PolicyReview.nextStepsLabel")}>
        <Link href="/how-it-works#safe-stop" prefetch={false} className="inline-flex min-h-12 items-center justify-center rounded-xl bg-brand px-5 py-3 font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-brand">
          {t("PolicyReview.reviewDecision")}
        </Link>
        <Link href="/" prefetch={false} className="inline-flex min-h-12 items-center justify-center rounded-xl border border-line-strong bg-surface px-5 py-3 font-semibold text-ink focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-brand">
          {t("PolicyReview.another")}
        </Link>
      </nav>

      <div className="mt-8">
        <SafetyNotice compact />
      </div>
    </div>
  );
}
