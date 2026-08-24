import type { PrerequisiteResponse } from "@/lib/api/types";
import { DECISION_PRESENTATION } from "@/lib/decision-presentation";

export function PrerequisiteList({
  prerequisites,
}: {
  prerequisites: PrerequisiteResponse[];
}) {
  return (
    <section aria-labelledby="prerequisites-heading">
      <div>
        <p className="text-xs font-bold tracking-[0.14em] text-brand uppercase">
          Reviewed checks
        </p>
        <h2 id="prerequisites-heading" className="mt-2 text-2xl font-bold tracking-[-0.025em] text-ink">
          Journey prerequisites
        </h2>
      </div>
      <ul className="mt-5 overflow-hidden rounded-2xl border border-line bg-surface">
        {prerequisites.map((prerequisite) => {
          const presentation = DECISION_PRESENTATION[prerequisite.state];
          return (
            <li
              key={prerequisite.node_id}
              className="flex items-center gap-4 border-b border-line p-4 last:border-b-0 sm:p-5"
            >
              <span
                aria-hidden="true"
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                  prerequisite.state === "PASS"
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-amber-100 text-amber-900"
                }`}
              >
                {prerequisite.state === "PASS" ? "✓" : "!"}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold text-ink">
                  {prerequisite.label}
                </span>
                <span className="mt-0.5 block text-sm text-muted">
                  {presentation.prerequisiteLabel}
                </span>
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
