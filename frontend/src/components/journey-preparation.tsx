"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { safeApiErrorMessage } from "@/lib/api/client";
import { listDemoPersonas } from "@/lib/api/demo";
import { getJourney } from "@/lib/api/journeys";
import type { DemoPersona, JourneyResponse } from "@/lib/api/types";
import { DemoConfigurationError, intentForGoal } from "@/lib/demo-intents";

import { ErrorState } from "./error-state";
import { LoadingState } from "./loading-state";
import { SafetyNotice } from "./safety-notice";
import { StatusBadge } from "./status-badge";

type PreparationState =
  | { status: "loading" }
  | { status: "ready"; journey: JourneyResponse; persona: DemoPersona }
  | { status: "error"; message: string };

export function JourneyPreparation({
  journeyInstanceId,
}: {
  journeyInstanceId: string;
}) {
  const [state, setState] = useState<PreparationState>({ status: "loading" });

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const [journey, personas] = await Promise.all([
          getJourney(journeyInstanceId),
          listDemoPersonas(),
        ]);
        const persona = personas.personas.find(
          (item) => item.persona_id === journey.persona_id,
        );
        if (!persona || persona.compatible_goal !== journey.citizen_goal) {
          throw new DemoConfigurationError();
        }
        if (active) setState({ status: "ready", journey, persona });
      } catch (error) {
        if (active) {
          setState({
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

  if (state.status === "loading") {
    return (
      <main id="main-content" className="py-12 sm:py-16">
        <LoadingState message="Loading your synthetic journey…" />
      </main>
    );
  }

  if (state.status === "error") {
    return (
      <main id="main-content" className="py-12 sm:py-16">
        <ErrorState message={state.message} />
        <Link
          className="mt-6 inline-flex min-h-11 items-center font-semibold text-brand underline underline-offset-4"
          href="/"
        >
          Return to the start
        </Link>
      </main>
    );
  }

  const intent = intentForGoal(state.journey.citizen_goal);
  if (!intent) {
    return (
      <main id="main-content" className="py-12 sm:py-16">
        <ErrorState message="The synthetic demo is not configured correctly right now." />
      </main>
    );
  }

  return (
    <main id="main-content" className="py-12 sm:py-16">
      <StatusBadge>Journey created</StatusBadge>
      <h1 className="mt-5 max-w-2xl text-4xl font-bold tracking-[-0.04em] text-ink sm:text-5xl">
        Your journey is ready to check
      </h1>
      <p className="mt-4 max-w-2xl text-base leading-7 text-muted sm:text-lg">
        ClaimSaathi has prepared an isolated synthetic journey. No prerequisite
        check or government action has happened yet.
      </p>

      <dl className="mt-8 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2">
        <div className="bg-surface p-5 sm:p-6">
          <dt className="text-xs font-bold tracking-[0.12em] text-muted uppercase">
            Your selected goal
          </dt>
          <dd className="mt-2 text-lg font-semibold text-ink">{intent.title}</dd>
        </div>
        <div className="bg-surface p-5 sm:p-6">
          <dt className="text-xs font-bold tracking-[0.12em] text-muted uppercase">
            Synthetic demo profile
          </dt>
          <dd className="mt-2 text-lg font-semibold text-ink">
            {state.persona.display_name}
          </dd>
        </div>
      </dl>

      <section
        className="mt-8 rounded-2xl border border-line bg-surface p-5 sm:p-6"
        aria-labelledby="next-step-heading"
      >
        <h2 id="next-step-heading" className="text-xl font-bold text-ink">
          Journey preparation complete
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
          This preparation step does not run prerequisite checks or display a
          government decision. You can safely start another synthetic journey.
        </p>
      </section>

      <div className="mt-8">
        <SafetyNotice compact />
      </div>

      <Link
        className="mt-8 inline-flex min-h-11 items-center font-semibold text-brand underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-brand"
        href="/"
      >
        Start another synthetic journey
      </Link>
    </main>
  );
}
