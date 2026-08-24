"use client";

import { useTranslations } from "next-intl";
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
  const t = useTranslations("Resolution");
  return (
    <aside className="rounded-2xl border-2 border-dashed border-violet-300 bg-violet-50 p-5 sm:p-6" aria-labelledby="demo-correction-heading">
      <p className="inline-flex rounded-full bg-violet-900 px-3 py-1 text-xs font-bold tracking-[0.14em] text-white uppercase">
        {t("demoOnly")}
      </p>
      <h3 id="demo-correction-heading" className="mt-4 text-xl font-bold text-violet-950">
        {t("demoTitle")}
      </h3>
      <p className="mt-2 text-sm leading-6 text-violet-950">
        {t("demoCopy")}
      </p>
      <PrimaryButton
        className="mt-5 w-full sm:w-auto"
        type="button"
        disabled={pending}
        onClick={onSimulate}
      >
        {pending ? t("demoUpdating") : t("demoAction")}
      </PrimaryButton>
      {result ? (
        <div role="status" aria-live="polite" className="mt-4 rounded-xl border border-violet-200 bg-white/70 p-4 text-sm text-violet-950">
          <p className="font-bold">{t("demoUpdated")}</p>
          <p className="mt-1">{t("realAction")}</p>
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
