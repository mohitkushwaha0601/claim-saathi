"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

import { ClaimSaathiApiError } from "@/lib/api/client";
import { listDemoPersonas } from "@/lib/api/demo";
import {
  evaluateJourney,
  getDecisionDetail,
  getJourney,
  listDecisions,
} from "@/lib/api/journeys";
import { listResolutions } from "@/lib/api/resolutions";
import type {
  DecisionDetailResponse,
  DecisionSummary,
  DemoPersona,
  JourneyResponse,
  ResolutionResponse,
} from "@/lib/api/types";
import { DemoConfigurationError, intentForGoal } from "@/lib/demo-intents";

import { useAppPreferences } from "./app-providers";
import { ErrorState } from "./error-state";
import { ExplanationPanel } from "./explanation-panel";
import { JourneyDecision } from "./journey-decision";
import { LoadingState } from "./loading-state";
import { PrimaryButton } from "./primary-button";

interface LoadedJourney {
  journey: JourneyResponse;
  persona: DemoPersona;
  decision: DecisionDetailResponse | null;
  decisionHistory: DecisionSummary[];
  activeResolution: ResolutionResponse | null;
}

type JourneyLoadState =
  | { status: "loading" }
  | { status: "ready"; value: LoadedJourney }
  | { status: "not-found" }
  | { status: "error"; kind: "configuration" | "network" | "generic" };

type EvaluationError = "offline" | "generic" | null;

function isNotFound(error: unknown): boolean {
  return error instanceof ClaimSaathiApiError && error.status === 404;
}

export function JourneyExperience({
  journeyInstanceId,
}: {
  journeyInstanceId: string;
}) {
  const t = useTranslations("Journey");
  const homeT = useTranslations("Home");
  const errorT = useTranslations("Errors");
  const networkT = useTranslations("Network");
  const { online, saveData } = useAppPreferences();
  const [loadState, setLoadState] = useState<JourneyLoadState>({
    status: "loading",
  });
  const [evaluating, setEvaluating] = useState(false);
  const [evaluationError, setEvaluationError] =
    useState<EvaluationError>(null);
  const [reloadSequence, setReloadSequence] = useState(0);
  const decisionRegionRef = useRef<HTMLDivElement>(null);
  const focusDecisionAfterEvaluation = useRef(false);

  useEffect(() => {
    let active = true;
    async function load() {
      if (!navigator.onLine) {
        queueMicrotask(() => {
          if (active) setLoadState({ status: "error", kind: "network" });
        });
        return;
      }
      try {
        const journey = await getJourney(journeyInstanceId);
        const [personaResponse, resolutionHistory, decisionHistory] = await Promise.all([
          listDemoPersonas(),
          listResolutions(journeyInstanceId),
          listDecisions(journeyInstanceId),
        ]);
        const persona = personaResponse.personas.find(
          (item) => item.persona_id === journey.persona_id,
        );
        if (!persona || persona.compatible_goal !== journey.citizen_goal) {
          throw new DemoConfigurationError();
        }
        const decision = journey.latest_decision
          ? await getDecisionDetail(
              journeyInstanceId,
              journey.latest_decision.decision_id,
            )
          : null;
        const matchingResolutions = decision
          ? resolutionHistory.resolutions.filter((resolution) =>
              decision.rule_results.some(
                (result) =>
                  result.issue_code === resolution.issue_code &&
                  result.resolution_id === resolution.resolution_id,
              ),
            )
          : [];
        const activeResolution =
          matchingResolutions[matchingResolutions.length - 1] ?? null;
        if (active) {
          setLoadState({
            status: "ready",
            value: {
              journey,
              persona,
              decision,
              decisionHistory: decisionHistory.decisions,
              activeResolution,
            },
          });
        }
      } catch (error) {
        if (!active) return;
        if (isNotFound(error)) {
          setLoadState({ status: "not-found" });
        } else {
          setLoadState({
            status: "error",
            kind:
              error instanceof DemoConfigurationError
                ? "configuration"
                : error instanceof ClaimSaathiApiError &&
                    error.code === "NETWORK_ERROR"
                  ? "network"
                  : "generic",
          });
        }
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [journeyInstanceId, reloadSequence]);

  useEffect(() => {
    if (
      focusDecisionAfterEvaluation.current &&
      loadState.status === "ready" &&
      loadState.value.decision
    ) {
      focusDecisionAfterEvaluation.current = false;
      decisionRegionRef.current?.focus();
    }
  }, [loadState]);

  async function checkJourney(): Promise<boolean> {
    if (loadState.status !== "ready" || evaluating) return false;
    if (!online) {
      setEvaluationError("offline");
      return false;
    }
    setEvaluating(true);
    setEvaluationError(null);
    try {
      const evaluated = await evaluateJourney(journeyInstanceId);
      const [decision, decisionHistory] = await Promise.all([
        getDecisionDetail(journeyInstanceId, evaluated.decision_id),
        listDecisions(journeyInstanceId),
      ]);
      setLoadState({
        status: "ready",
        value: {
          ...loadState.value,
          decision,
          decisionHistory: decisionHistory.decisions,
        },
      });
      focusDecisionAfterEvaluation.current = true;
      return true;
    } catch {
      setEvaluationError("generic");
      return false;
    } finally {
      setEvaluating(false);
    }
  }

  if (loadState.status === "loading") {
    return (
      <main id="main-content" className="py-12 sm:py-16">
        <LoadingState message={t("loading")} />
      </main>
    );
  }

  if (loadState.status === "not-found") {
    return (
      <main id="main-content" className="py-12 sm:py-16">
        <section className="rounded-2xl border border-line bg-surface p-6 sm:p-8">
          <h1 className="text-3xl font-bold tracking-[-0.03em] text-ink">
            {t("expiredTitle")}
          </h1>
          <p className="mt-3 max-w-xl leading-7 text-muted">
            {t("expiredCopy")}
          </p>
          <Link
            href="/"
            prefetch={false}
            className="mt-6 inline-flex min-h-12 items-center rounded-xl bg-brand px-5 py-3 font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-brand"
          >
            {t("startNew")}
          </Link>
        </section>
      </main>
    );
  }

  if (loadState.status === "error") {
    return (
      <main id="main-content" className="py-12 sm:py-16">
        <ErrorState
          title={errorT("journeyLoadTitle")}
          titleAsHeading
          message={
            loadState.kind === "configuration"
              ? errorT("configuration")
              : loadState.kind === "network" && !online
                ? errorT("offlineRequest")
                : errorT("generic")
          }
          onRetry={() => {
            setLoadState({ status: "loading" });
            setReloadSequence((current) => current + 1);
          }}
        />
        <Link
          className="mt-6 inline-flex min-h-11 items-center font-semibold text-brand underline underline-offset-4"
          href="/"
          prefetch={false}
        >
          {t("returnStart")}
        </Link>
      </main>
    );
  }

  const {
    journey,
    persona,
    decision,
    decisionHistory,
    activeResolution,
  } = loadState.value;
  const intent = intentForGoal(journey.citizen_goal);
  if (!intent) {
    return (
      <main id="main-content" className="py-12 sm:py-16">
        <ErrorState message={errorT("configuration")} />
      </main>
    );
  }

  return (
    <main id="main-content" className="py-12 sm:py-16">
      <p className="text-sm font-bold tracking-[0.16em] text-brand uppercase">
        {t("eyebrow")}
      </p>
      <h1 className="mt-3 text-4xl font-bold tracking-[-0.045em] text-ink sm:text-5xl">
        {t("title")}
      </h1>

      <dl className="mt-7 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-3">
        <div className="bg-surface p-5">
          <dt className="text-xs font-bold tracking-[0.1em] text-muted uppercase">
            {t("persona")}
          </dt>
          <dd className="mt-2 text-lg font-semibold text-ink">
            {persona.display_name}
          </dd>
        </div>
        <div className="bg-surface p-5">
          <dt className="text-xs font-bold tracking-[0.1em] text-muted uppercase">
            {t("goal")}
          </dt>
          <dd className="mt-2 text-lg font-semibold text-ink">
            {homeT(`intents.${journey.citizen_goal}.summary`)}
          </dd>
        </div>
        <div className="bg-surface p-5">
          <dt className="text-xs font-bold tracking-[0.1em] text-muted uppercase">
            {t("status")}
          </dt>
          <dd className="mt-2 text-lg font-semibold text-ink">
            {decision ? t("checked") : t("notChecked")}
          </dd>
        </div>
      </dl>

      {decision ? (
        <>
          {!online ? (
            <aside className="mt-8 rounded-2xl border-2 border-amber-900 bg-amber-100 p-4 text-amber-950" role="status">
              <p className="font-bold">{networkT("previouslyLoaded")}</p>
              <p className="mt-1 text-sm leading-6">
                {networkT("connectToRefresh")}
              </p>
            </aside>
          ) : null}
          <div
            ref={decisionRegionRef}
            tabIndex={-1}
            aria-labelledby="decision-heading"
            className="mt-8 outline-none"
          >
            <JourneyDecision
              citizenGoal={journey.citizen_goal}
              journeyInstanceId={journeyInstanceId}
              decision={decision}
              decisionHistory={decisionHistory}
              activeResolution={activeResolution}
              evaluating={evaluating}
              evaluationError={
                evaluationError === "offline"
                  ? errorT("offlineRequest")
                  : evaluationError === "generic"
                    ? errorT("journeyCheck")
                    : null
              }
              onEvaluate={checkJourney}
            />
          </div>
          <ExplanationPanel
            key={decision.decision_id}
            journeyInstanceId={journeyInstanceId}
            decisionId={decision.decision_id}
          />
        </>
      ) : (
        <section className="mt-8 rounded-2xl border border-line bg-surface p-6 sm:p-8" aria-labelledby="check-heading">
          <h2 id="check-heading" className="text-2xl font-bold tracking-[-0.025em] text-ink">
            {t("checkReadyTitle")}
          </h2>
          <p className="mt-3 max-w-2xl leading-7 text-muted">
            {t("checkReadyCopy")}
          </p>
          <PrimaryButton
            className="mt-6"
            type="button"
            disabled={evaluating}
            onClick={() => void checkJourney()}
          >
            {evaluating ? t("checking") : t("check")}
          </PrimaryButton>
          {evaluating ? (
            <p role="status" aria-live="polite" className="mt-3 text-sm text-muted">
              {t("reviewing")}
            </p>
          ) : null}
          {evaluating && saveData ? (
            <p className="mt-2 text-sm text-muted">{networkT("slowPending")}</p>
          ) : null}
          {evaluationError ? (
            <div className="mt-5">
              <ErrorState
                message={
                  evaluationError === "offline"
                    ? errorT("offlineRequest")
                    : errorT("journeyCheck")
                }
                onRetry={() => void checkJourney()}
              />
            </div>
          ) : null}
          <p className="mt-5 text-sm font-medium text-muted">
            {t("noClaim")}
          </p>
        </section>
      )}

    </main>
  );
}
