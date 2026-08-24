import Link from "next/link";

import { LiveExecutionTrace } from "./live-execution-trace";

const FORM_FIRST_STEPS = [
  "Citizen goal",
  "Discover the applicable process or form",
  "Understand prerequisites",
  "Enter the process",
  "Discover a blocker",
  "Leave the process to resolve it",
  "Return and determine what to do next",
] as const;

const CLAIMSAATHI_STEPS = [
  "Citizen goal",
  "Journey identified",
  "Prerequisites checked first",
  "Ready or a clear blocker",
  "Reviewed resolution guidance",
  "Trusted state rechecked",
  "Complete journey re-evaluated",
  "Official process revealed",
] as const;

const TRANSFORMATIONS = [
  ["Know the process or form", "Describe the goal"],
  ["Discover blockers during the journey", "Check configured prerequisites first"],
  ["Know something is wrong", "See what is blocked and the configured resolution"],
  ["Fix something and infer success", "Re-read trusted state and verify"],
  ["One current state", "Versioned immutable DecisionRecords"],
  ["Ambiguity", "Explicit UNABLE_TO_VERIFY or POLICY_REVIEW_REQUIRED"],
] as const;

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
  return (
    <main id="main-content" className="pb-20 pt-12 sm:pb-28 sm:pt-16">
      <section aria-labelledby="explorer-heading">
        <p className="text-sm font-bold tracking-[0.16em] text-brand uppercase">
          Interactive system explorer
        </p>
        <h1 id="explorer-heading" className="mt-3 max-w-4xl text-4xl font-bold tracking-[-0.045em] text-ink sm:text-6xl sm:leading-[1.04]">
          From form hunting to guided journeys
        </h1>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-muted">
          ClaimSaathi starts with what the citizen wants to do, checks the
          configured prerequisites before exposing the government process,
          guides blocker resolution, and rechecks the complete journey.
        </p>
        <p className="mt-4 max-w-3xl rounded-xl border border-line bg-surface p-4 text-sm font-semibold leading-6 text-ink">
          ClaimSaathi identifies and explains the applicable process. It does
          not perform government actions.
        </p>
      </section>

      <section className="mt-20" aria-labelledby="comparison-heading">
        <p className="text-xs font-bold tracking-[0.14em] text-brand uppercase">
          What changes for the citizen
        </p>
        <h2 id="comparison-heading" className="mt-2 text-3xl font-bold tracking-[-0.035em] text-ink sm:text-4xl">
          Current journey model vs ClaimSaathi
        </h2>
        <div className="mt-7 grid gap-5 lg:grid-cols-2">
          <article className="rounded-3xl border border-line bg-surface p-5 sm:p-7">
            <p className="text-xs font-bold tracking-[0.12em] text-muted uppercase">
              Form-first / process-first
            </p>
            <h3 className="mt-2 text-2xl font-bold text-ink">Typical process today</h3>
            <FlowList items={FORM_FIRST_STEPS} />
          </article>
          <article className="rounded-3xl border border-brand/30 bg-brand-soft p-5 sm:p-7">
            <p className="text-xs font-bold tracking-[0.12em] text-brand uppercase">
              Intent-first
            </p>
            <h3 className="mt-2 text-2xl font-bold text-ink">With ClaimSaathi</h3>
            <FlowList items={CLAIMSAATHI_STEPS} />
          </article>
        </div>
        <p className="mt-4 text-sm leading-6 text-muted">
          Simplified comparison for demonstrating the orchestration model. It
          is not an exhaustive audit of an external government system.
        </p>

        <div className="mt-8 grid overflow-hidden rounded-3xl border border-line bg-line lg:grid-cols-2 lg:gap-px">
          <div className="bg-ink p-6 text-white sm:p-8">
            <p className="text-xs font-bold tracking-[0.14em] text-white/70 uppercase">
              Traditional / form-first model
            </p>
            <p className="mt-3 text-2xl font-bold leading-tight sm:text-3xl">
              The citizen performs the orchestration.
            </p>
          </div>
          <div className="bg-brand p-6 text-white sm:p-8">
            <p className="text-xs font-bold tracking-[0.14em] text-white/75 uppercase">
              ClaimSaathi
            </p>
            <p className="mt-3 text-2xl font-bold leading-tight sm:text-3xl">
              The system performs the orchestration while government decisions
              remain authoritative.
            </p>
          </div>
        </div>
      </section>

      <section className="mt-20" aria-labelledby="changed-heading">
        <h2 id="changed-heading" className="text-3xl font-bold tracking-[-0.035em] text-ink sm:text-4xl">
          What ClaimSaathi changes
        </h2>
        <p className="mt-3 max-w-3xl leading-7 text-muted">
          These are design improvements in ClaimSaathi, not guarantees about
          every external government experience.
        </p>
        <dl className="mt-7 divide-y divide-line overflow-hidden rounded-3xl border border-line bg-surface">
          {TRANSFORMATIONS.map(([before, after]) => (
            <div key={before} className="grid gap-3 p-5 sm:grid-cols-[minmax(0,0.8fr)_2rem_minmax(0,1.2fr)] sm:items-center sm:p-6">
              <div>
                <dt className="text-xs font-bold tracking-[0.1em] text-muted uppercase">Before</dt>
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
          Technical architecture
        </p>
        <h2 id="architecture-heading" className="mt-2 text-3xl font-bold tracking-[-0.035em] text-ink sm:text-4xl">
          Deterministic layers with explicit boundaries
        </h2>
        <div className="mt-7 rounded-3xl border border-line bg-surface p-5 sm:p-8">
          <ol className="grid gap-3 text-center" aria-label="ClaimSaathi architecture">
            {[
              "Citizen-facing frontend",
              "FastAPI transport",
              "Application services",
              "Journey orchestrator",
            ].map((label, index) => (
              <li key={label}>
                <div className="rounded-xl border border-line bg-canvas p-4 font-bold text-ink">{label}</div>
                {index < 3 ? <div aria-hidden="true" className="py-1 font-bold text-brand">↓</div> : null}
              </li>
            ))}
          </ol>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            {[
              ["Policy Engine", "Versioned rule results"],
              ["Prerequisite Graph", "Configured dependency structure"],
              ["Resolution Navigator", "Reviewed guidance and reverification"],
            ].map(([label, copy]) => (
              <div key={label} className="rounded-xl border border-brand/25 bg-brand-soft p-4 text-center">
                <p className="font-bold text-ink">{label}</p>
                <p className="mt-1 text-sm leading-5 text-muted">{copy}</p>
              </div>
            ))}
          </div>
          <div aria-hidden="true" className="py-2 text-center font-bold text-brand">↓</div>
          <div className="rounded-xl bg-ink p-4 text-center font-bold text-white">Immutable DecisionRecord</div>
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-[1.25fr_0.75fr]">
          <article className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
            <h3 className="text-xl font-bold text-ink">Reviewed configuration is a system artifact</h3>
            <ul className="mt-4 grid gap-3 text-sm leading-6 text-muted sm:grid-cols-3">
              <li><span className="font-bold text-ink">policies/</span><br />Reviewed policy rules</li>
              <li><span className="font-bold text-ink">journeys/</span><br />Reviewed journey graphs</li>
              <li><span className="font-bold text-ink">resolutions/</span><br />Reviewed resolution guidance</li>
            </ul>
            <p className="mt-5 border-t border-line pt-4 text-sm leading-6 text-muted">
              These artifacts are not generated by an LLM, scraped and
              activated automatically, or inferred at runtime.
            </p>
          </article>
          <article className="rounded-2xl border-2 border-dashed border-sky-200 bg-sky-50 p-5 sm:p-6">
            <p className="text-xs font-bold tracking-[0.12em] text-sky-900 uppercase">Synthetic boundary</p>
            <h3 className="mt-2 text-xl font-bold text-sky-950">fixtures/</h3>
            <p className="mt-2 text-sm leading-6 text-sky-950">
              Demo records are isolated synthetic facts. No live EPFO data or
              action enters this prototype.
            </p>
          </article>
        </div>
      </section>

      <section className="mt-20" aria-labelledby="live-trace-heading">
        <p className="text-xs font-bold tracking-[0.14em] text-brand uppercase">
          Read-only execution trace
        </p>
        <h2 id="live-trace-heading" className="mt-2 text-3xl font-bold tracking-[-0.035em] text-ink sm:text-4xl">
          See what happens behind the screen
        </h2>
        <p className="mt-4 max-w-3xl leading-7 text-muted">
          Generate a real synthetic journey through the public demo API, then
          inspect presentation-safe data from its stored deterministic decision.
          Reading a trace does not run the planner, rules, graph, resolution, or AI.
        </p>
        <div className="mt-8">
          <LiveExecutionTrace />
        </div>
      </section>

      <section id="safe-stop" className="mt-20 scroll-mt-24" aria-labelledby="uncertainty-heading">
        <p className="text-xs font-bold tracking-[0.14em] text-brand uppercase">
          Honest uncertainty
        </p>
        <h2 id="uncertainty-heading" className="mt-2 text-3xl font-bold tracking-[-0.035em] text-ink sm:text-4xl">
          Safe systems need a way to say: we don&apos;t know.
        </h2>
        <div className="mt-7 grid gap-4 sm:grid-cols-2">
          <article className="rounded-2xl border border-slate-300 bg-slate-50 p-5 sm:p-6">
            <h3 className="text-xl font-bold text-slate-950">UNABLE_TO_VERIFY</h3>
            <p className="mt-2 text-sm leading-6 text-slate-800">
              Required trusted information is unavailable or cannot be verified.
            </p>
          </article>
          <article className="rounded-2xl border border-violet-200 bg-violet-50 p-5 sm:p-6">
            <h3 className="text-xl font-bold text-violet-950">POLICY_REVIEW_REQUIRED</h3>
            <p className="mt-2 text-sm leading-6 text-violet-900">
              The configured authoritative policy is unresolved or requires review.
            </p>
          </article>
        </div>
        <p className="mt-4 text-sm leading-6 text-muted">
          These are ClaimSaathi system states, not official EPFO status names.
        </p>
      </section>

      <section className="mt-20" aria-labelledby="ai-boundary-heading">
        <p className="text-xs font-bold tracking-[0.14em] text-brand uppercase">
          Safety and AI boundary
        </p>
        <h2 id="ai-boundary-heading" className="mt-2 text-3xl font-bold tracking-[-0.035em] text-ink sm:text-4xl">
          Where AI can — and cannot — exist
        </h2>
        <div className="mt-7 rounded-3xl border border-line bg-surface p-5 sm:p-8">
          <p className="inline-flex rounded-full bg-brand-soft px-3 py-1 text-xs font-bold tracking-[0.1em] text-brand uppercase">
            Deterministic / policy-backed
          </p>
          <ol className="mt-5 grid gap-2 sm:grid-cols-7 sm:items-center" aria-label="Deterministic decision path">
            {[
              "Citizen intent",
              "Journey Planner",
              "Policy Engine",
              "Prerequisite Graph",
              "DecisionRecord",
              "Resolution Navigator",
              "Official process identification",
            ].map((item, index) => (
              <li key={item} className="flex min-w-0 items-center gap-2 sm:block sm:text-center">
                <span className="block min-w-0 flex-1 rounded-xl border border-brand/25 bg-brand-soft p-3 text-xs font-bold leading-5 text-ink">{item}</span>
                {index < 6 ? (
                  <span aria-hidden="true" className="font-bold text-brand sm:mt-2 sm:block sm:rotate-90">→</span>
                ) : null}
              </li>
            ))}
          </ol>
        </div>
        <div className="mt-5 rounded-3xl border-2 border-dashed border-line-strong bg-canvas p-5 sm:p-8">
          <p className="inline-flex rounded-full bg-slate-200 px-3 py-1 text-xs font-bold tracking-[0.1em] text-slate-800 uppercase">
            Not part of government decision
          </p>
          <h3 className="mt-4 text-xl font-bold text-ink">Optional future explanation layer</h3>
          <p className="mt-3 text-sm font-semibold leading-6 text-ink">
            Canonical explanation → Sanitizer → AI simplification or translation
          </p>
          <p className="mt-3 text-sm leading-6 text-muted">
            Optional AI explanation features are not currently enabled. If
            introduced in a later authorized phase, they remain downstream of
            the immutable deterministic result.
          </p>
        </div>
      </section>

      <section className="mt-20 rounded-3xl bg-ink p-6 text-white sm:p-10" aria-labelledby="explorer-cta-heading">
        <h2 id="explorer-cta-heading" className="text-3xl font-bold tracking-[-0.035em]">
          See the citizen experience
        </h2>
        <p className="mt-3 max-w-2xl leading-7 text-white/80">
          Start with a citizen goal and follow the same backend truth through a
          simple guided journey.
        </p>
        <Link href="/" className="mt-6 inline-flex min-h-12 items-center rounded-xl bg-white px-5 py-3 font-bold text-ink transition hover:bg-brand-soft focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-white">
          Try the citizen journey
        </Link>
      </section>
    </main>
  );
}
