import type { DecisionDetailResponse } from "@/lib/api/types";
import { issuePresentation } from "@/lib/decision-presentation";

export function JourneyIssues({ decision }: { decision: DecisionDetailResponse }) {
  if (decision.issue_codes.length === 0) return null;

  return (
    <section
      className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 sm:p-6"
      aria-labelledby="issues-heading"
    >
      <p className="text-xs font-bold tracking-[0.14em] text-amber-900 uppercase">
        What the check found
      </p>
      <h2 id="issues-heading" className="mt-2 text-2xl font-bold text-amber-950">
        Attention needed
      </h2>
      <div className="mt-5 grid gap-4">
        {decision.issue_codes.map((issueCode) => {
          const issue = issuePresentation(issueCode);
          return (
            <article key={issueCode} className="rounded-xl border border-amber-200 bg-white/70 p-4">
              <h3 className="text-lg font-bold text-amber-950">{issue.title}</h3>
              <p className="mt-2 text-sm leading-6 text-amber-950">
                {issue.supportingCopy}
              </p>
              {issue.whyItMatters ? (
                <div className="mt-4 border-t border-amber-200 pt-4">
                  <h4 className="font-bold text-amber-950">Why this matters</h4>
                  <p className="mt-1 text-sm leading-6 text-amber-950">
                    {issue.whyItMatters}
                  </p>
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}
