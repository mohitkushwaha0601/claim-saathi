"use client";

import { useEffect, useId, useState } from "react";
import { useTranslations } from "next-intl";

import { getPolicySource } from "@/lib/api/policy";
import type { PolicySourceResponse } from "@/lib/api/types";

import { ErrorState } from "./error-state";
import { LoadingState } from "./loading-state";

const inFlightSourceRequests = new Map<
  string,
  Promise<PolicySourceResponse>
>();

function loadPolicySource(sourceId: string): Promise<PolicySourceResponse> {
  const existing = inFlightSourceRequests.get(sourceId);
  if (existing) return existing;

  const request = getPolicySource(sourceId).finally(() => {
    inFlightSourceRequests.delete(sourceId);
  });
  inFlightSourceRequests.set(sourceId, request);
  return request;
}

type SourceState =
  | { status: "loading" }
  | { status: "ready"; sources: PolicySourceResponse[] }
  | { status: "error" };

function externalHttpUrl(value: string | null): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:"
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

export function PolicySources({
  sourceIds,
  eyebrow,
  heading,
  description,
}: {
  sourceIds: string[];
  eyebrow?: string;
  heading?: string;
  description?: string;
}) {
  const t = useTranslations("Sources");
  const errorT = useTranslations("Errors");
  const [state, setState] = useState<SourceState>({ status: "loading" });
  const [requestSequence, setRequestSequence] = useState(0);
  const headingId = useId();

  useEffect(() => {
    let active = true;
    Promise.all(sourceIds.map((sourceId) => loadPolicySource(sourceId)))
      .then((sources) => {
        if (active) setState({ status: "ready", sources });
      })
      .catch(() => {
        if (active) {
          setState({ status: "error" });
        }
      });
    return () => {
      active = false;
    };
  }, [requestSequence, sourceIds]);

  if (sourceIds.length === 0) return null;

  return (
    <section aria-labelledby={headingId}>
      <p className="text-xs font-bold tracking-[0.14em] text-brand uppercase">
        {eyebrow ?? t("provenance")}
      </p>
      <h2 id={headingId} className="mt-2 text-2xl font-bold tracking-[-0.025em] text-ink">
        {heading ?? t("rules")}
      </h2>
      {description ? (
        <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">
          {description}
        </p>
      ) : null}
      <div className="mt-5">
        {state.status === "loading" ? (
          <LoadingState message={t("loading")} />
        ) : null}
        {state.status === "error" ? (
          <ErrorState
            message={errorT("generic")}
            onRetry={() => {
              setState({ status: "loading" });
              setRequestSequence((current) => current + 1);
            }}
          />
        ) : null}
        {state.status === "ready" ? (
          <ul className="grid gap-4">
            {state.sources.map((source) => {
              const referenceUrl = externalHttpUrl(source.reference_url);
              const titleKey = `titles.${source.source_id}`;
              const scopeKey = `scopes.${source.source_id}`;
              const localizedTitle = t.has(titleKey)
                ? t(titleKey)
                : source.title;
              return (
                <li key={source.source_id} className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
                  <p className="text-xs font-bold tracking-[0.1em] text-muted uppercase">
                    {source.authority}
                  </p>
                  <h3 className="mt-2 text-lg font-bold text-ink">
                    {localizedTitle}
                  </h3>
                  {source.verified_at ? (
                    <p className="mt-2 text-sm text-muted">
                      {t("verified", { date: source.verified_at.slice(0, 10) })}
                    </p>
                  ) : null}
                  {source.scope ? (
                    <p className="mt-3 text-sm leading-6 text-muted">
                      {t.has(scopeKey) ? t(scopeKey) : source.scope}
                    </p>
                  ) : null}
                  {referenceUrl ? (
                    <a
                      href={referenceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={t("viewLabel", { title: localizedTitle })}
                      className="mt-4 inline-flex min-h-11 items-center font-semibold text-brand underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-brand"
                    >
                      {t("view")} <span className="ml-1" aria-hidden="true">↗</span>
                    </a>
                  ) : null}
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>
    </section>
  );
}
