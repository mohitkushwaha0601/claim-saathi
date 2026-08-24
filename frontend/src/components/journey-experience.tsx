"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import {
  ClaimSaathiApiError,
  safeApiErrorMessage,
} from "@/lib/api/client";
import { listDemoPersonas } from "@/lib/api/demo";
import {
  evaluateJourney,
  getDecisionDetail,
  getJourney,
} from "@/lib/api/journeys";
import type {
  DemoPersona,
  JourneyEvaluationResponse,
  JourneyResponse,
} from "@/lib/api/types";
import { DemoConfigurationError, intentForGoal } from "@/lib/demo-intents";

import { ErrorState } from "./error-state";
import { JourneyDecision } from "./journey-decision";
import { LoadingState } from "./loading-state";
import { PrimaryButton } from "./primary-button";
import { SafetyNotice } from "./safety-notice";

interface LoadedJourney {
  journey: JourneyResponse;
  persona: DemoPersona;
  decision: JourneyEvaluationResponse | null;
}

type JourneyLoadState =
  | { status: "loading" }
  | { status: "ready"; value: LoadedJourney }
  | { status: "not-found" }
  | { status: "error"; message: string };

function isNotFound(error: unknown): boolean {
  return error instanceof ClaimSaathiApiError && error.status === 404;
}

export function JourneyExperience({
  journeyInstanceId,
}: {
  journeyInstanceId: string;
}) {
  const [loadState, setLoadState] = useState<JourneyLoadState>({
    status: "loading",
  });
  const [evaluating, setEvaluating] = useState(false);
  const [evaluationError, setEvaluationError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const [journey, personaResponse] = await Promise.all([
          getJourney(journeyInstanceId),
          listDemoPersonas(),
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
        if (active) {
          setLoadState({
            status: "ready",
            value: { journey, persona, decision },
          });
        }
      } catch (error) {
        if (!active) return;
        if (isNotFound(error)) {
          setLoadState({ status: "not-found" });
        } else {
          setLoadState({
            status: "error",
            message:
              error instanceof DemoConfigurationError
                ? error.message
                : safeApiErrorMessage(error),
          });
        }
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [journeyInstanceId]);

  async function checkJourney() {
    if (loadState.status !== "ready" || evaluating) return;
    setEvaluating(true);
    setEvaluationError(null);
    try {
      const decision = await evaluateJourney(journeyInstanceId);
      setLoadState({
        status: "ready",
        value: { ...loadState.value, decision },
      });
    } catch {
      setEvaluationError("We couldn't check this journey right now.");
    } finally {
      setEvaluating(false);
    }
  }

  if (loadState.status === "loading") {
    return (
      <main id="main-content" className="py-12 sm:py-16">
        <LoadingState message="Loading your synthetic journey…" />
      </main>
    );
  }

  if (loadState.status === "not-found") {
    return (
      <main id="main-content" className="py-12 sm:py-16">
        <section className="rounded-2xl border border-line bg-surface p-6 sm:p-8">
          <h1 className="text-3xl font-bold tracking-[-0.03em] text-ink">
            Journey not found
          </h1>
          <p className="mt-3 max-w-xl leading-7 text-muted">
            Demo journeys reset when the backend restarts.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex min-h-12 items-center rounded-xl bg-brand px-5 py-3 font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-brand"
          >
            Start a new journey
          </Link>
        </section>
      </main>
    );
  }

  if (loadState.status === "error") {
    return (
      <main id="main-content" className="py-12 sm:py-16">
        <ErrorState message={loadState.message} />
        <Link
          className="mt-6 inline-flex min-h-11 items-center font-semibold text-brand underline underline-offset-4"
          href="/"
        >
          Return to the start
        </Link>
      </main>
    );
  }

  const { journey, persona, decision } = loadState.value;
  const intent = intentForGoal(journey.citizen_goal);
  if (!intent) {
    return (
      <main id="main-content" className="py-12 sm:py-16">
        <ErrorState message="The synthetic demo is not configured correctly right now." />
      </main>
    );
  }

  return (
    <main id="main-content" className="py-12 sm:py-16">
      <p className="text-sm font-bold tracking-[0.16em] text-brand uppercase">
        Synthetic journey
      </p>
      <h1 className="mt-3 text-4xl font-bold tracking-[-0.045em] text-ink sm:text-5xl">
        Your PF journey
      </h1>

      <dl className="mt-7 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-3">
        <div className="bg-surface p-5">
          <dt className="text-xs font-bold tracking-[0.1em] text-muted uppercase">
            Synthetic demo persona
          </dt>
          <dd className="mt-2 text-lg font-semibold text-ink">
            {persona.display_name}
          </dd>
        </div>
        <div className="bg-surface p-5">
          <dt className="text-xs font-bold tracking-[0.1em] text-muted uppercase">
            Goal
          </dt>
          <dd className="mt-2 text-lg font-semibold text-ink">
            {intent.summary}
          </dd>
        </div>
        <div className="bg-surface p-5">
          <dt className="text-xs font-bold tracking-[0.1em] text-muted uppercase">
            Status
          </dt>
          <dd className="mt-2 text-lg font-semibold text-ink">
            {decision ? "Checked" : "Not checked yet"}
          </dd>
        </div>
      </dl>

      {decision ? (
        <div className="mt-8">
          <JourneyDecision
            citizenGoal={journey.citizen_goal}
            decision={decision}
            evaluating={evaluating}
            evaluationError={evaluationError}
            onEvaluate={() => void checkJourney()}
          />
        </div>
      ) : (
        <section className="mt-8 rounded-2xl border border-line bg-surface p-6 sm:p-8" aria-labelledby="check-heading">
          <h2 id="check-heading" className="text-2xl font-bold tracking-[-0.025em] text-ink">
            Ready for a deterministic check
          </h2>
          <p className="mt-3 max-w-2xl leading-7 text-muted">
            ClaimSaathi can now check the reviewed rules and synthetic records
            for this journey.
          </p>
          <PrimaryButton
            className="mt-6"
            type="button"
            disabled={evaluating}
            onClick={() => void checkJourney()}
          >
            {evaluating ? "Checking your journey…" : "Check my journey"}
          </PrimaryButton>
          {evaluating ? (
            <p role="status" aria-live="polite" className="mt-3 text-sm text-muted">
              Reviewing configured rules and synthetic records.
            </p>
          ) : null}
          {evaluationError ? (
            <div className="mt-5">
              <ErrorState message={evaluationError} onRetry={() => void checkJourney()} />
            </div>
          ) : null}
          <p className="mt-5 text-sm font-medium text-muted">
            No real EPFO claim is submitted.
          </p>
        </section>
      )}

      {!decision ? (
        <div className="mt-8">
          <SafetyNotice compact />
        </div>
      ) : null}
    </main>
  );
}
