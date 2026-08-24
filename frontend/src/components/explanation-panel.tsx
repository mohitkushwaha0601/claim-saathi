"use client";

import { useState } from "react";

import { createDecisionExplanation } from "@/lib/api/explanations";
import type {
  ExplanationMode,
  ExplanationResponse,
} from "@/lib/api/types";

const EXPLANATION_ERROR =
  "We couldn't load a different explanation right now. Your stored result is unchanged.";

export function ExplanationPanel({
  journeyInstanceId,
  decisionId,
}: {
  journeyInstanceId: string;
  decisionId: string;
}) {
  const [pendingMode, setPendingMode] = useState<ExplanationMode | null>(null);
  const [lastMode, setLastMode] = useState<ExplanationMode | null>(null);
  const [explanation, setExplanation] =
    useState<ExplanationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function requestExplanation(mode: ExplanationMode) {
    if (pendingMode !== null) return;
    setPendingMode(mode);
    setLastMode(mode);
    setError(null);
    try {
      const response = await createDecisionExplanation(
        journeyInstanceId,
        decisionId,
        mode,
      );
      setExplanation(response);
    } catch {
      setError(EXPLANATION_ERROR);
    } finally {
      setPendingMode(null);
    }
  }

  return (
    <section
      className="mt-10 rounded-2xl border border-line bg-canvas p-5 sm:p-6"
      aria-labelledby="explanation-controls-heading"
      aria-busy={pendingMode !== null}
    >
      <p className="text-xs font-bold tracking-[0.12em] text-muted uppercase">
        Optional explanation
      </p>
      <h2
        id="explanation-controls-heading"
        className="mt-2 text-xl font-bold text-ink"
      >
        Need this explained differently?
      </h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
        These controls explain the stored result only. They do not run or
        change the journey check.
      </p>
      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          disabled={pendingMode !== null}
          onClick={() => void requestExplanation("SIMPLE_ENGLISH")}
          className="min-h-11 rounded-xl border border-line-strong bg-surface px-4 py-2.5 font-semibold text-ink focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-brand disabled:cursor-wait disabled:opacity-60"
        >
          {pendingMode === "SIMPLE_ENGLISH" ? "Explaining…" : "Explain simply"}
        </button>
        <button
          type="button"
          disabled={pendingMode !== null}
          lang="hi"
          onClick={() => void requestExplanation("HINDI")}
          className="min-h-11 rounded-xl border border-line-strong bg-surface px-4 py-2.5 font-semibold text-ink focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-brand disabled:cursor-wait disabled:opacity-60"
        >
          {pendingMode === "HINDI" ? "समझाया जा रहा है…" : "हिंदी में समझाएँ"}
        </button>
      </div>

      {pendingMode ? (
        <p role="status" aria-live="polite" className="mt-3 text-sm text-muted">
          Preparing an optional explanation. Your result remains visible above.
        </p>
      ) : null}

      {error ? (
        <div role="alert" className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm leading-6 text-amber-950">{error}</p>
          {lastMode ? (
            <button
              type="button"
              disabled={pendingMode !== null}
              onClick={() => void requestExplanation(lastMode)}
              className="mt-3 min-h-11 font-bold text-amber-950 underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-brand"
            >
              Try explanation again
            </button>
          ) : null}
        </div>
      ) : null}

      {explanation ? (
        <article className="mt-6 rounded-xl border border-line bg-surface p-5">
          <p className="text-xs font-bold tracking-[0.1em] text-brand uppercase">
            {explanation.ai_used_for_explanation
              ? "AI-assisted explanation"
              : "Plain-language explanation"}
          </p>
          {explanation.ai_used_for_explanation ? (
            <p className="mt-2 text-sm font-semibold text-ink">
              AI did not determine this result.
            </p>
          ) : null}
          <h3 className="mt-3 text-xl font-bold text-ink">
            {explanation.title}
          </h3>
          <p className="mt-3 leading-7 text-muted">{explanation.summary}</p>
          <ul className="mt-4 grid gap-2 text-sm leading-6 text-ink">
            {explanation.points.map((point) => (
              <li key={point} className="flex gap-2">
                <span aria-hidden="true" className="font-bold text-brand">•</span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 border-t border-line pt-4 text-sm leading-6 text-muted">
            {explanation.disclaimer}
          </p>
          <p className="mt-3 text-xs font-semibold text-muted">
            AI used for decision: false
          </p>
        </article>
      ) : null}
    </section>
  );
}
