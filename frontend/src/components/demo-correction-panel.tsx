import type { DemoEventResponse } from "@/lib/api/types";

import { PrimaryButton } from "./primary-button";

export function DemoCorrectionPanel({
  pending,
  result,
  error,
  onSimulate,
}: {
  pending: boolean;
  result: DemoEventResponse | null;
  error: string | null;
  onSimulate: () => void;
}) {
  return (
    <aside className="rounded-2xl border-2 border-dashed border-violet-300 bg-violet-50 p-5 sm:p-6" aria-labelledby="demo-correction-heading">
      <p className="inline-flex rounded-full bg-violet-900 px-3 py-1 text-xs font-bold tracking-[0.14em] text-white uppercase">
        Demo only
      </p>
      <h3 id="demo-correction-heading" className="mt-4 text-xl font-bold text-violet-950">
        Simulate official record update
      </h3>
      <p className="mt-2 text-sm leading-6 text-violet-950">
        This changes only Priya&apos;s isolated synthetic demo record. No EPFO
        system is contacted.
      </p>
      <PrimaryButton
        className="mt-5 w-full sm:w-auto"
        type="button"
        disabled={pending}
        onClick={onSimulate}
      >
        {pending ? "Updating synthetic record…" : "Simulate Date of Exit update"}
      </PrimaryButton>
      {result ? (
        <div role="status" aria-live="polite" className="mt-4 rounded-xl border border-violet-200 bg-white/70 p-4 text-sm text-violet-950">
          <p className="font-bold">Synthetic record updated.</p>
          <p className="mt-1">Real government action performed: false</p>
        </div>
      ) : null}
      {error ? (
        <p role="alert" className="mt-4 text-sm font-semibold text-rose-800">
          {error}
        </p>
      ) : null}
    </aside>
  );
}
