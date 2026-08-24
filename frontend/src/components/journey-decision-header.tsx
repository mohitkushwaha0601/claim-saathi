import type { DecisionState } from "@/lib/api/types";
import { DECISION_PRESENTATION } from "@/lib/decision-presentation";

const TONE_CLASSES = {
  positive: "border-emerald-200 bg-emerald-50 text-emerald-950",
  attention: "border-amber-200 bg-amber-50 text-amber-950",
  neutral: "border-slate-200 bg-slate-50 text-slate-950",
  review: "border-violet-200 bg-violet-50 text-violet-950",
} as const;

export function JourneyDecisionHeader({ state }: { state: DecisionState }) {
  const presentation = DECISION_PRESENTATION[state];
  return (
    <section
      aria-labelledby="decision-heading"
      className={`rounded-3xl border p-6 sm:p-8 ${TONE_CLASSES[presentation.tone]}`}
    >
      <div className="flex items-start gap-4">
        <span
          aria-hidden="true"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-current/20 bg-white/60"
        >
          {state === "PASS" ? (
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m6 12 4 4 8-9" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 8v5M12 16.5h.01" />
            </svg>
          )}
        </span>
        <div>
          <p className="text-xs font-bold tracking-[0.14em] uppercase">
            Deterministic journey result
          </p>
          <h2 id="decision-heading" className="mt-2 text-3xl font-bold tracking-[-0.035em] sm:text-4xl">
            {presentation.label}
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 sm:text-base">
            {presentation.supportingCopy}
          </p>
        </div>
      </div>
    </section>
  );
}
