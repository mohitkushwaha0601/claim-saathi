"use client";

import { useTranslations } from "next-intl";
import type { DecisionSummary } from "@/lib/api/types";

export function DecisionHistory({ decisions }: { decisions: DecisionSummary[] }) {
  const t = useTranslations();
  if (decisions.length < 2) return null;
  const earlier = decisions[0];
  const latest = decisions[decisions.length - 1];

  return (
    <section className="rounded-2xl border border-line bg-surface p-5 sm:p-6" aria-labelledby="history-heading">
      <h2 id="history-heading" className="text-xl font-bold text-ink">
        {t("History.title")}
      </h2>
      <dl className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl bg-canvas p-4">
          <dt className="text-sm text-muted">{t("History.earlier")}</dt>
          <dd className="mt-1 font-bold text-ink">
            {t(`DecisionStates.${earlier.state}.label`)}
          </dd>
        </div>
        <div className="rounded-xl bg-brand-soft p-4">
          <dt className="text-sm text-muted">{t("History.latest")}</dt>
          <dd className="mt-1 font-bold text-ink">
            {t(`DecisionStates.${latest.state}.label`)}
          </dd>
        </div>
      </dl>
      <details className="mt-5 border-t border-line pt-4">
        <summary className="min-h-11 cursor-pointer font-semibold text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand">
          {t("History.how")}
        </summary>
        <p className="mt-2 text-sm leading-6 text-muted">
          {t("History.copy")}
        </p>
      </details>
    </section>
  );
}
