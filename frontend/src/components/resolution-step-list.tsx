"use client";

import { useTranslations } from "next-intl";
import type { ApprovedResolutionStepResponse } from "@/lib/api/types";

export function ResolutionStepList({
  steps,
}: {
  steps: ApprovedResolutionStepResponse[];
}) {
  const t = useTranslations("Resolution");
  const reviewedRoute = t.raw("route") as string[];
  return (
    <section aria-labelledby="resolution-steps-heading">
      <h3 id="resolution-steps-heading" className="text-xl font-bold text-ink">
        {t("approvedSteps")}
      </h3>
      <ol className="mt-4 grid gap-4">
        {steps.map((step, index) => (
          <li key={step.step_id} className="flex min-w-0 gap-4 rounded-2xl border border-line bg-surface p-4 sm:p-5">
            <span
              aria-hidden="true"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-soft font-bold text-brand"
            >
              {index + 1}
            </span>
            <div className="min-w-0">
              <h4 className="font-bold text-ink">
                {t.has(`steps.${step.step_id}.title`)
                  ? t(`steps.${step.step_id}.title`)
                  : step.title}
              </h4>
              <p className="mt-1 text-sm leading-6 text-muted">
                {t.has(`steps.${step.step_id}.guidance`)
                  ? t(`steps.${step.step_id}.guidance`)
                  : step.canonical_guidance}
              </p>
              {step.official_route.length > 0 ? (
                <div className="mt-4 rounded-xl border border-brand/20 bg-brand-soft p-4">
                  <p className="text-xs font-bold tracking-[0.1em] text-brand uppercase">
                    {t("officialRoute")}
                  </p>
                  <ol className="mt-3 grid gap-2 text-sm text-ink">
                    {step.official_route.map((routeItem, routeIndex) => (
                      <li key={`${step.step_id}-${routeIndex}`} className="flex gap-2">
                        <span aria-hidden="true" className="font-bold text-brand">
                          {routeIndex + 1}.
                        </span>
                        <span className="min-w-0 break-words">
                          {step.step_id === "FOLLOW_OFFICIAL_MARK_EXIT_PROCESS"
                            ? reviewedRoute[routeIndex] ?? routeItem
                            : routeItem}
                        </span>
                      </li>
                    ))}
                  </ol>
                </div>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
