import type { IntentGoal, JourneyId, OfficialProcess } from "@/lib/api/types";
import { journeyLabel } from "@/lib/decision-presentation";
import { intentForGoal } from "@/lib/demo-intents";

export function OfficialProcessCard({
  citizenGoal,
  journeyId,
  officialProcess,
}: {
  citizenGoal: IntentGoal;
  journeyId: JourneyId;
  officialProcess: OfficialProcess;
}) {
  const intent = intentForGoal(citizenGoal);
  return (
    <section
      aria-labelledby="official-process-heading"
      className="rounded-2xl border border-brand/25 bg-brand-soft p-5 sm:p-6"
    >
      <p className="text-xs font-bold tracking-[0.14em] text-brand uppercase">
        Official process identified
      </p>
      <div className="mt-5 rounded-xl border border-line bg-surface p-4">
        <p className="text-xs font-bold tracking-[0.1em] text-muted uppercase">
          Your goal
        </p>
        <p className="mt-1 font-semibold text-ink">
          {intent?.summary ?? "Your selected PF goal"}
        </p>
      </div>
      <div className="flex justify-center py-3 text-brand" aria-hidden="true">
        ↓
      </div>
      <div className="rounded-xl border border-brand/25 bg-surface p-4">
        <p className="text-xs font-bold tracking-[0.1em] text-muted uppercase">
          Applicable official process
        </p>
        <h2 id="official-process-heading" className="mt-2 text-3xl font-bold tracking-[-0.03em] text-ink">
          {officialProcess.label}
        </h2>
        <p className="mt-1 text-sm font-semibold text-brand">
          {journeyLabel(journeyId)}
        </p>
      </div>
      <p className="mt-4 text-sm leading-6 text-muted">
        This means the configured prerequisites currently pass. It does not mean
        EPFO has approved a claim.
      </p>
    </section>
  );
}
