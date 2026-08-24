import type { DecisionState } from "@/lib/api/types";
import {
  DECISION_PRESENTATION,
  DECISION_VISUALS,
} from "@/lib/decision-presentation";

export function JourneyDecisionHeader({ state }: { state: DecisionState }) {
  const presentation = DECISION_PRESENTATION[state];
  const visual = DECISION_VISUALS[state];
  return (
    <section
      aria-labelledby="decision-heading"
      className={`rounded-3xl border p-6 sm:p-8 ${visual.classes}`}
    >
      <div className="flex items-start gap-4">
        <span
          aria-hidden="true"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-current/20 bg-white/60"
        >
          <span className="text-xl font-bold">{visual.icon}</span>
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
