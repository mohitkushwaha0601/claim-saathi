"use client";

import { useEffect, useId, useState } from "react";

import { safeApiErrorMessage } from "@/lib/api/client";
import { getPolicySource } from "@/lib/api/policy";
import type { PolicySourceResponse } from "@/lib/api/types";

import { ErrorState } from "./error-state";
import { LoadingState } from "./loading-state";

type SourceState =
  | { status: "loading" }
  | { status: "ready"; sources: PolicySourceResponse[] }
  | { status: "error"; message: string };

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
  eyebrow = "Provenance",
  heading = "Rules used for this check",
  description,
}: {
  sourceIds: string[];
  eyebrow?: string;
  heading?: string;
  description?: string;
}) {
  const [state, setState] = useState<SourceState>({ status: "loading" });
  const headingId = useId();

  useEffect(() => {
    let active = true;
    Promise.all(sourceIds.map((sourceId) => getPolicySource(sourceId)))
      .then((sources) => {
        if (active) setState({ status: "ready", sources });
      })
      .catch((error: unknown) => {
        if (active) {
          setState({ status: "error", message: safeApiErrorMessage(error) });
        }
      });
    return () => {
      active = false;
    };
  }, [sourceIds]);

  if (sourceIds.length === 0) return null;

  return (
    <section aria-labelledby={headingId}>
      <p className="text-xs font-bold tracking-[0.14em] text-brand uppercase">
        {eyebrow}
      </p>
      <h2 id={headingId} className="mt-2 text-2xl font-bold tracking-[-0.025em] text-ink">
        {heading}
      </h2>
      {description ? (
        <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">
          {description}
        </p>
      ) : null}
      <div className="mt-5">
        {state.status === "loading" ? (
          <LoadingState message="Loading reviewed source details…" />
        ) : null}
        {state.status === "error" ? <ErrorState message={state.message} /> : null}
        {state.status === "ready" ? (
          <ul className="grid gap-4">
            {state.sources.map((source) => {
              const referenceUrl = externalHttpUrl(source.reference_url);
              return (
                <li key={source.source_id} className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
                  <p className="text-xs font-bold tracking-[0.1em] text-muted uppercase">
                    {source.authority}
                  </p>
                  <h3 className="mt-2 text-lg font-bold text-ink">
                    {source.title}
                  </h3>
                  {source.verified_at ? (
                    <p className="mt-2 text-sm text-muted">
                      Verified {source.verified_at.slice(0, 10)}
                    </p>
                  ) : null}
                  {source.scope ? (
                    <p className="mt-3 text-sm leading-6 text-muted">
                      {source.scope}
                    </p>
                  ) : null}
                  {referenceUrl ? (
                    <a
                      href={referenceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 inline-flex min-h-11 items-center font-semibold text-brand underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-brand"
                    >
                      View official source <span className="ml-1" aria-hidden="true">↗</span>
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
