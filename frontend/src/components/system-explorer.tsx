"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

import { LiveExecutionTrace } from "./live-execution-trace";

function FlowList({ items }: { items: readonly string[] }) {
  return (
    <ol className="mt-5 grid gap-2">
      {items.map((item, index) => (
        <li key={item} className="flex items-center gap-3 rounded-xl border border-line bg-white/80 p-3 text-sm font-semibold text-ink">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-soft text-xs font-bold text-brand">
            {index + 1}
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ol>
  );
}

export function SystemExplorer() {
  const t = useTranslations("SystemExplorer");
  const formFirstSteps = t.raw("formFirstSteps") as string[];
  const claimSaathiSteps = t.raw("claimSaathiSteps") as string[];
  const transformations = t.raw("transformations") as [string, string][];
  const architectureLayers = t.raw("architectureLayers") as string[];
  const architectureBranches = t.raw("architectureBranches") as [string, string][];
  const decisionPath = t.raw("decisionPath") as string[];
  const explanationPath = t.raw("explanationPath") as string[];
  return (
    <main id="main-content" className="pb-20 pt-12 sm:pb-28 sm:pt-16">
      <section aria-labelledby="explorer-heading">
        <p className="text-sm font-bold tracking-[0.16em] text-brand uppercase">
          {t("eyebrow")}
        </p>
        <h1 id="explorer-heading" className="mt-3 max-w-4xl text-4xl font-bold tracking-[-0.045em] text-ink sm:text-6xl sm:leading-[1.04]">
          {t("title")}
        </h1>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-muted">
          {t("intro")}
        </p>
        <p className="mt-4 max-w-3xl rounded-xl border border-line bg-surface p-4 text-sm font-semibold leading-6 text-ink">
          {t("boundary")}
        </p>
        <nav className="mt-6" aria-label={t("shortcuts")}>
          <a
            href="#live-trace"
            className="inline-flex min-h-12 items-center justify-center rounded-xl bg-brand px-5 py-3 font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-brand"
          >
            {t("explore")}
          </a>
        </nav>
      </section>

      <section className="mt-20" aria-labelledby="comparison-heading">
        <p className="text-xs font-bold tracking-[0.14em] text-brand uppercase">
          {t("comparisonEyebrow")}
        </p>
        <h2 id="comparison-heading" className="mt-2 text-3xl font-bold tracking-[-0.035em] text-ink sm:text-4xl">
          {t("comparisonTitle")}
        </h2>
        <div className="mt-7 grid gap-5 lg:grid-cols-2">
          <article className="rounded-3xl border border-line bg-surface p-5 sm:p-7">
            <p className="text-xs font-bold tracking-[0.12em] text-muted uppercase">
              {t("formFirstLabel")}
            </p>
            <h3 className="mt-2 text-2xl font-bold text-ink">{t("typical")}</h3>
            <FlowList items={formFirstSteps} />
          </article>
          <article className="rounded-3xl border border-brand/30 bg-brand-soft p-5 sm:p-7">
            <p className="text-xs font-bold tracking-[0.12em] text-brand uppercase">
              {t("intentFirst")}
            </p>
            <h3 className="mt-2 text-2xl font-bold text-ink">{t("with")}</h3>
            <FlowList items={claimSaathiSteps} />
          </article>
        </div>
        <p className="mt-4 text-sm leading-6 text-muted">
          {t("comparisonNote")}
        </p>

        <div className="mt-8 grid overflow-hidden rounded-3xl border border-line lg:grid-cols-2">
          <div className="bg-surface p-6 sm:p-8">
            <p className="text-xs font-bold tracking-[0.14em] text-muted uppercase">
              {t("traditional")}
            </p>
            <p className="mt-3 text-2xl font-bold leading-tight text-ink sm:text-3xl">
              {t("citizenOrchestrates")}
            </p>
          </div>
          <div className="border-t border-line bg-brand-soft p-6 sm:p-8 lg:border-t-0 lg:border-l">
            <p className="text-xs font-bold tracking-[0.14em] text-brand uppercase">
              ClaimSaathi
            </p>
            <p className="mt-3 text-2xl font-bold leading-tight text-ink sm:text-3xl">
              {t("systemOrchestrates")}
            </p>
          </div>
        </div>
      </section>

      <section className="mt-20" aria-labelledby="changed-heading">
        <h2 id="changed-heading" className="text-3xl font-bold tracking-[-0.035em] text-ink sm:text-4xl">
          {t("changesTitle")}
        </h2>
        <p className="mt-3 max-w-3xl leading-7 text-muted">
          {t("changesCopy")}
        </p>
        <dl className="mt-7 divide-y divide-line overflow-hidden rounded-3xl border border-line bg-surface">
          {transformations.map(([before, after]) => (
            <div key={before} className="grid gap-3 p-5 sm:grid-cols-[minmax(0,0.8fr)_2rem_minmax(0,1.2fr)] sm:items-center sm:p-6">
              <div>
                <dt className="text-xs font-bold tracking-[0.1em] text-muted uppercase">{t("before")}</dt>
                <dd className="mt-1 font-semibold text-ink">{before}</dd>
              </div>
              <span aria-hidden="true" className="hidden text-center text-xl font-bold text-brand sm:block">→</span>
              <div>
                <dt className="text-xs font-bold tracking-[0.1em] text-brand uppercase">ClaimSaathi</dt>
                <dd className="mt-1 font-bold text-ink">{after}</dd>
              </div>
            </div>
          ))}
        </dl>
      </section>

      <section className="mt-20" aria-labelledby="architecture-heading">
        <p className="text-xs font-bold tracking-[0.14em] text-brand uppercase">
          {t("architectureEyebrow")}
        </p>
        <h2 id="architecture-heading" className="mt-2 text-3xl font-bold tracking-[-0.035em] text-ink sm:text-4xl">
          {t("architectureTitle")}
        </h2>
        <div className="mt-7 rounded-3xl border border-line bg-surface p-5 sm:p-8">
          <ol className="grid gap-3 text-center" aria-label={t("architectureLabel")}>
            {architectureLayers.map((label, index) => (
              <li key={label}>
                <div className="rounded-xl border border-line bg-canvas p-4 font-bold text-ink">{label}</div>
                {index < 3 ? <div aria-hidden="true" className="py-1 font-bold text-brand">↓</div> : null}
              </li>
            ))}
          </ol>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            {architectureBranches.map(([label, copy]) => (
              <div key={label} className="rounded-xl border border-brand/25 bg-brand-soft p-4 text-center">
                <p className="font-bold text-ink">{label}</p>
                <p className="mt-1 text-sm leading-5 text-muted">{copy}</p>
              </div>
            ))}
          </div>
          <div aria-hidden="true" className="py-2 text-center font-bold text-brand">↓</div>
          <div className="rounded-xl border border-brand/40 bg-brand-soft p-4 text-center font-bold text-ink">{t("immutable")}</div>
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-[1.25fr_0.75fr]">
          <article className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
            <h3 className="text-xl font-bold text-ink">{t("artifactTitle")}</h3>
            <ul className="mt-4 grid gap-3 text-sm leading-6 text-muted sm:grid-cols-3">
              <li><span className="font-bold text-ink">policies/</span><br />{t("policyArtifact")}</li>
              <li><span className="font-bold text-ink">journeys/</span><br />{t("journeyArtifact")}</li>
              <li><span className="font-bold text-ink">resolutions/</span><br />{t("resolutionArtifact")}</li>
            </ul>
            <p className="mt-5 border-t border-line pt-4 text-sm leading-6 text-muted">
              {t("artifactCopy")}
            </p>
          </article>
          <article className="rounded-2xl border-2 border-dashed border-sky-200 bg-sky-50 p-5 sm:p-6">
            <p className="text-xs font-bold tracking-[0.12em] text-sky-900 uppercase">{t("syntheticBoundary")}</p>
            <h3 className="mt-2 text-xl font-bold text-sky-950">fixtures/</h3>
            <p className="mt-2 text-sm leading-6 text-sky-950">
              {t("syntheticCopy")}
            </p>
          </article>
        </div>
      </section>

      <section id="live-trace" className="mt-20 scroll-mt-24" aria-labelledby="live-trace-heading">
        <p className="text-xs font-bold tracking-[0.14em] text-brand uppercase">
          {t("traceEyebrow")}
        </p>
        <h2 id="live-trace-heading" className="mt-2 text-3xl font-bold tracking-[-0.035em] text-ink sm:text-4xl">
          {t("traceTitle")}
        </h2>
        <p className="mt-4 max-w-3xl leading-7 text-muted">
          {t("traceCopy")}
        </p>
        <div className="mt-8">
          <LiveExecutionTrace />
        </div>
      </section>

      <section id="safe-stop" className="mt-20 scroll-mt-24" aria-labelledby="uncertainty-heading">
        <p className="text-xs font-bold tracking-[0.14em] text-brand uppercase">
          {t("uncertaintyEyebrow")}
        </p>
        <h2 id="uncertainty-heading" className="mt-2 text-3xl font-bold tracking-[-0.035em] text-ink sm:text-4xl">
          {t("uncertaintyTitle")}
        </h2>
        <div className="mt-7 grid gap-4 sm:grid-cols-2">
          <article className="min-w-0 rounded-2xl border border-slate-300 bg-slate-50 p-5 sm:p-6">
            <h3 className="text-xl font-bold text-slate-950 [overflow-wrap:anywhere]">UNABLE_TO_VERIFY</h3>
            <p className="mt-2 text-sm leading-6 text-slate-800">
              {t("unableCopy")}
            </p>
          </article>
          <article className="min-w-0 rounded-2xl border border-violet-200 bg-violet-50 p-5 sm:p-6">
            <h3 className="text-xl font-bold text-violet-950 [overflow-wrap:anywhere]">POLICY_REVIEW_REQUIRED</h3>
            <p className="mt-2 text-sm leading-6 text-violet-900">
              {t("reviewCopy")}
            </p>
          </article>
        </div>
        <p className="mt-4 text-sm leading-6 text-muted">
          {t("stateNote")}
        </p>
      </section>

      <section className="mt-20" aria-labelledby="ai-boundary-heading">
        <p className="text-xs font-bold tracking-[0.14em] text-brand uppercase">
          {t("aiEyebrow")}
        </p>
        <h2 id="ai-boundary-heading" className="mt-2 text-3xl font-bold tracking-[-0.035em] text-ink sm:text-4xl">
          {t("aiTitle")}
        </h2>
        <div className="mt-7 rounded-3xl border border-line bg-surface p-5 sm:p-8">
          <p className="inline-flex rounded-full bg-brand-soft px-3 py-1 text-xs font-bold tracking-[0.1em] text-brand uppercase">
            {t("deterministic")}
          </p>
          <ol className="mt-5 grid gap-2 sm:grid-cols-5 sm:items-center" aria-label={t("decisionPathLabel")}>
            {decisionPath.map((item, index) => (
              <li key={item} className="flex min-w-0 items-center gap-2 sm:block sm:text-center">
                <span className="block min-w-0 flex-1 rounded-xl border border-brand/25 bg-brand-soft p-3 text-xs font-bold leading-5 text-ink">{item}</span>
                {index < 4 ? (
                  <span aria-hidden="true" className="font-bold text-brand sm:mt-2 sm:block sm:rotate-90">→</span>
                ) : null}
              </li>
            ))}
          </ol>
        </div>
        <div className="mt-5 rounded-3xl border-2 border-dashed border-line-strong bg-canvas p-5 sm:p-8">
          <p className="inline-flex rounded-full bg-slate-200 px-3 py-1 text-xs font-bold tracking-[0.1em] text-slate-800 uppercase">
            {t("notGovernmentDecision")}
          </p>
          <h3 className="mt-4 text-xl font-bold text-ink">{t("oneWay")}</h3>
          <ol className="mt-4 grid gap-2 sm:grid-cols-4 sm:items-center" aria-label={t("explanationPathLabel")}>
            {explanationPath.map((item, index) => (
              <li key={item} className="flex min-w-0 items-center gap-2 sm:block sm:text-center">
                <span className="block min-w-0 flex-1 rounded-xl border border-line bg-surface p-3 text-xs font-bold leading-5 text-ink">{item}</span>
                {index < 3 ? (
                  <span aria-hidden="true" className="font-bold text-slate-600 sm:mt-2 sm:block sm:rotate-90">→</span>
                ) : null}
              </li>
            ))}
          </ol>
          <p className="mt-4 text-sm font-bold leading-6 text-ink">
            {t("noPath")}
          </p>
          <p className="mt-2 text-sm leading-6 text-muted">
            {t("aiCopy")}
          </p>
        </div>
      </section>

      <section className="mt-20 rounded-3xl border border-brand/30 bg-brand-soft p-6 sm:p-10" aria-labelledby="explorer-cta-heading">
        <p className="text-xs font-bold tracking-[0.14em] text-brand uppercase">
          ClaimSaathi
        </p>
        <h2 id="explorer-cta-heading" className="mt-2 text-3xl font-bold tracking-[-0.035em] text-ink sm:text-4xl">
          {t("ctaTitle")}
        </h2>
        <p className="mt-3 max-w-2xl text-base leading-7 text-muted">
          {t("ctaCopy")}
        </p>
        <Link href="/" prefetch={false} className="mt-6 inline-flex min-h-12 items-center rounded-xl bg-brand px-5 py-3 font-bold text-white transition hover:bg-brand-strong focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-brand">
          {t("cta")}
        </Link>
      </section>
    </main>
  );
}
