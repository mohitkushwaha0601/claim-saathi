"use client";

import { useTranslations } from "next-intl";
import type { JourneyEvaluationResponse } from "@/lib/api/types";
import { formatCheckedAt } from "@/lib/decision-presentation";

import { useAppPreferences } from "./app-providers";

export function DecisionAuditSummary({
  decision,
}: {
  decision: JourneyEvaluationResponse;
}) {
  const t = useTranslations("Audit");
  const { locale } = useAppPreferences();
  const policyReviewRequired = decision.state === "POLICY_REVIEW_REQUIRED";

  return (
    <section className="rounded-2xl border border-line bg-surface p-5 sm:p-6" aria-labelledby="trust-heading">
      <h2 id="trust-heading" className="text-xl font-bold text-ink">
        {t("title")}
      </h2>
      <p className="mt-3 text-sm font-semibold leading-6 text-brand">
        {t("deterministic")}
      </p>
      <p className="mt-2 text-sm leading-6 text-muted">
        {t("reviewed")}
      </p>
      {policyReviewRequired ? (
        <div className="mt-4 rounded-xl border border-violet-200 bg-violet-50 p-4 text-sm leading-6 text-violet-950">
          <p className="font-semibold">{t("aiGap")}</p>
          <p className="mt-1">
            {t("aiBoundary")}
          </p>
        </div>
      ) : null}
      <details className="mt-5 border-t border-line pt-4">
        <summary className="min-h-11 cursor-pointer font-semibold text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand">
          {t("technical")}
        </summary>
        <dl className="mt-3 grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted">{t("decisionId")}</dt>
            <dd className="mt-1 break-all font-medium text-ink">
              {decision.decision_id}
            </dd>
          </div>
          <div>
            <dt className="text-muted">{t("checkedAt")}</dt>
            <dd className="mt-1 font-medium text-ink">
              {formatCheckedAt(decision.evaluated_at, locale)} UTC
            </dd>
          </div>
          <div>
            <dt className="text-muted">{t("policyVersion")}</dt>
            <dd className="mt-1 break-all font-medium text-ink">
              {decision.policy_version}
            </dd>
          </div>
          <div>
            <dt className="text-muted">{t("graphVersion")}</dt>
            <dd className="mt-1 break-all font-medium text-ink">
              {decision.graph_version}
            </dd>
          </div>
          <div>
            <dt className="text-muted">{t("journeyVersion")}</dt>
            <dd className="mt-1 break-all font-medium text-ink">
              {decision.journey_definition_version}
            </dd>
          </div>
          <div>
            <dt className="text-muted">{t("aiUsed")}</dt>
            <dd className="mt-1 font-medium text-ink">
              {String(decision.ai_used_for_decision)}
            </dd>
          </div>
        </dl>
      </details>
    </section>
  );
}
