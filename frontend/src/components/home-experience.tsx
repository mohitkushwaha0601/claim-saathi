"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { ClaimSaathiApiError } from "@/lib/api/client";
import { listDemoPersonas } from "@/lib/api/demo";
import { createJourney } from "@/lib/api/journeys";
import {
  bindPersonasToIntents,
  DemoConfigurationError,
  type BoundIntent,
} from "@/lib/demo-intents";
import { validatePositiveIntegerRupees } from "@/lib/rupees";

import { useAppPreferences } from "./app-providers";
import { ErrorState } from "./error-state";
import { IntentCard } from "./intent-card";
import { LoadingState } from "./loading-state";
import { PrimaryButton } from "./primary-button";
import { SafetyNotice } from "./safety-notice";

type PersonaLoadState =
  | { status: "loading" }
  | { status: "ready"; intents: BoundIntent[] }
  | { status: "error"; kind: "network" | "configuration" | "generic" };

interface FailedCreation {
  intent: BoundIntent;
  requestedAmountRupees?: number;
}

export function demoServiceUnavailableMessage(
  environment: string | undefined,
  developmentMessage = "Start the backend service and try again.",
  productionMessage =
    "The demo service is temporarily unavailable. Please try again shortly.",
): string {
  return environment === "production"
    ? productionMessage
    : developmentMessage;
}

async function fetchBoundIntents(): Promise<BoundIntent[]> {
  const response = await listDemoPersonas();
  return bindPersonasToIntents(response.personas);
}

function personaLoadErrorKind(
  error: unknown,
): "network" | "configuration" | "generic" {
  if (
    error instanceof ClaimSaathiApiError &&
    error.code === "NETWORK_ERROR"
  ) {
    return "network";
  }
  return error instanceof DemoConfigurationError ? "configuration" : "generic";
}

export function HomeExperience() {
  const router = useRouter();
  const t = useTranslations("Home");
  const errorT = useTranslations("Errors");
  const networkT = useTranslations("Network");
  const { online, saveData } = useAppPreferences();
  const [loadState, setLoadState] = useState<PersonaLoadState>({
    status: "loading",
  });
  const [selectedIntent, setSelectedIntent] = useState<BoundIntent | null>(null);
  const [amount, setAmount] = useState("");
  const [amountError, setAmountError] = useState<string | null>(null);
  const [creatingGoal, setCreatingGoal] = useState<string | null>(null);
  const [creationError, setCreationError] = useState<string | null>(null);
  const [failedCreation, setFailedCreation] = useState<FailedCreation | null>(
    null,
  );
  const amountInputRef = useRef<HTMLInputElement>(null);
  const loadPersonas = useCallback(async () => {
    if (!navigator.onLine) {
      setLoadState({ status: "error", kind: "network" });
      return;
    }
    try {
      setLoadState({
        status: "ready",
        intents: await fetchBoundIntents(),
      });
    } catch (error) {
      setLoadState({
        status: "error",
        kind: personaLoadErrorKind(error),
      });
    }
  }, []);

  useEffect(() => {
    let active = true;
    if (!navigator.onLine) {
      queueMicrotask(() => {
        if (active) setLoadState({ status: "error", kind: "network" });
      });
      return () => {
        active = false;
      };
    }
    fetchBoundIntents()
      .then((intents) => {
        if (active) setLoadState({ status: "ready", intents });
      })
      .catch((error: unknown) => {
        if (active) {
          setLoadState({
            status: "error",
            kind: personaLoadErrorKind(error),
          });
        }
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (selectedIntent) amountInputRef.current?.focus();
  }, [selectedIntent]);

  async function prepareJourney(
    intent: BoundIntent,
    requestedAmountRupees?: number,
  ) {
    if (!online) {
      setCreationError(errorT("offlineRequest"));
      setFailedCreation({ intent, requestedAmountRupees });
      return;
    }
    setCreationError(null);
    setFailedCreation(null);
    setCreatingGoal(intent.goal);
    try {
      const journey = await createJourney({
        persona_id: intent.persona.persona_id,
        goal: intent.goal,
        ...(requestedAmountRupees === undefined
          ? {}
          : { requested_amount_rupees: requestedAmountRupees }),
      });
      router.push(
        `/journey/${encodeURIComponent(journey.journey_instance_id)}`,
      );
    } catch {
      setCreationError(errorT("generic"));
      setFailedCreation({ intent, requestedAmountRupees });
      setCreatingGoal(null);
    }
  }

  function selectIntent(intent: BoundIntent) {
    setCreationError(null);
    if (intent.requiresAmount) {
      setSelectedIntent(intent);
      setAmountError(null);
      return;
    }
    void prepareJourney(intent);
  }

  function submitAmount(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedIntent) return;
    const validation = validatePositiveIntegerRupees(amount);
    if (!validation.ok) {
      setAmountError(
        validation.reason === "required"
          ? t("amountRequired")
          : t("amountInvalid"),
      );
      return;
    }
    setAmountError(null);
    void prepareJourney(selectedIntent, validation.value);
  }

  return (
    <main id="main-content" className="pb-16 pt-12 sm:pb-24 sm:pt-16">
      <section aria-labelledby="intent-heading">
        <p className="text-sm font-bold tracking-[0.16em] text-brand uppercase">
          {t("eyebrow")}
        </p>
        <h1
          id="intent-heading"
          className="mt-3 max-w-3xl text-4xl font-bold tracking-[-0.045em] text-ink sm:text-5xl sm:leading-[1.08]"
        >
          {t("title")}
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-muted sm:text-lg">
          {t("intro")}
        </p>

        <div className="mt-9" aria-busy={loadState.status === "loading"}>
          {loadState.status === "loading" ? (
            <LoadingState message={t("loading")} />
          ) : null}
          {loadState.status === "error" ? (
            <ErrorState
              title={
                loadState.kind === "network"
                  ? errorT("demoUnavailableTitle")
                  : undefined
              }
              message={
                loadState.kind === "network"
                  ? !online
                    ? errorT("offlineRequest")
                    : demoServiceUnavailableMessage(
                        process.env.NODE_ENV,
                        errorT("demoUnavailableDevelopment"),
                        errorT("demoUnavailableProduction"),
                      )
                  : loadState.kind === "configuration"
                    ? errorT("configuration")
                    : errorT("generic")
              }
              onRetry={() => {
                setLoadState({ status: "loading" });
                void loadPersonas();
              }}
            />
          ) : null}
          {loadState.status === "ready" ? (
            <div className="grid gap-4 lg:grid-cols-3">
              {loadState.intents.map((intent) => (
                <IntentCard
                  key={intent.goal}
                  title={t(`intents.${intent.goal}.title`)}
                  description={t(`intents.${intent.goal}.description`)}
                  personaName={intent.persona.display_name}
                  icon={intent.icon}
                  disabled={creatingGoal !== null}
                  onSelect={() => selectIntent(intent)}
                />
              ))}
            </div>
          ) : null}
        </div>

        {selectedIntent ? (
          <form
            onSubmit={submitAmount}
            className="mt-5 rounded-2xl border border-brand/25 bg-brand-soft p-5 sm:p-6"
            noValidate
          >
            <fieldset disabled={creatingGoal !== null}>
              <legend className="text-lg font-bold text-ink">
                {t("amountTitle")}
              </legend>
              <p className="mt-1 text-sm leading-6 text-muted">
                {t("amountIntro")}
              </p>
              <label
                htmlFor="requested-amount"
                className="mt-5 block text-sm font-semibold text-ink"
              >
                {t("amountLabel")}
              </label>
              <div className="mt-2 flex min-h-12 max-w-sm items-center rounded-xl border border-line-strong bg-surface px-4 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-brand">
                <span aria-hidden="true" className="mr-2 text-lg text-muted">
                  ₹
                </span>
                <input
                  ref={amountInputRef}
                  id="requested-amount"
                  name="requested_amount_rupees"
                  value={amount}
                  onChange={(event) => {
                    setAmount(event.target.value);
                    setAmountError(null);
                  }}
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="80,000"
                  aria-describedby={amountError ? "amount-error" : "amount-help"}
                  aria-invalid={amountError ? true : undefined}
                  className="min-h-12 w-full bg-transparent text-lg font-semibold text-ink outline-none placeholder:font-normal placeholder:text-slate-400"
                />
              </div>
              <p id="amount-help" className="mt-2 text-xs leading-5 text-muted">
                {t("amountHelp")}
              </p>
              {amountError ? (
                <p
                  id="amount-error"
                  role="alert"
                  className="mt-2 text-sm font-semibold text-rose-800"
                >
                  {amountError}
                </p>
              ) : null}
              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <PrimaryButton type="submit">
                  {creatingGoal === selectedIntent.goal
                    ? t("preparing")
                    : t("prepare")}
                </PrimaryButton>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedIntent(null);
                    setAmount("");
                    setAmountError(null);
                    setCreationError(null);
                    setFailedCreation(null);
                  }}
                  className="min-h-12 rounded-xl px-5 py-3 font-semibold text-brand underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                >
                  {t("chooseDifferent")}
                </button>
              </div>
            </fieldset>
          </form>
        ) : null}

        {creatingGoal ? (
          <p
            role="status"
            aria-live="polite"
            className="mt-4 text-sm font-semibold text-brand"
          >
            {t("preparing")}
          </p>
        ) : null}
        {creationError ? (
          <div className="mt-5">
            <ErrorState
              message={creationError}
              retrying={creatingGoal !== null}
              onRetry={
                failedCreation
                  ? () =>
                      void prepareJourney(
                        failedCreation.intent,
                        failedCreation.requestedAmountRupees,
                      )
                  : undefined
              }
            />
          </div>
        ) : null}
      </section>

      <section aria-labelledby="how-it-works" className="mt-16 sm:mt-20">
        <h2
          id="how-it-works"
          className="text-2xl font-bold tracking-[-0.025em] text-ink sm:text-3xl"
        >
          {t("worksTitle")}
        </h2>
        <div className="mt-6 grid gap-3 sm:grid-cols-4">
          {(t.raw("steps") as string[]).map(
            (step, index) => (
              <div
                key={step}
                className="flex items-center gap-3 rounded-xl border border-line bg-surface p-4 sm:block"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-soft text-sm font-bold text-brand">
                  {index + 1}
                </span>
                <span className="text-sm font-semibold text-ink sm:mt-3 sm:block">
                  {step}
                </span>
              </div>
            ),
          )}
        </div>
        <p className="mt-5 max-w-3xl text-base leading-7 text-muted">
          {t("worksCopy")}
        </p>
        {saveData ? (
          <p className="mt-3 text-sm font-semibold text-muted">
            {networkT("saveData")}
          </p>
        ) : null}
      </section>

      <div className="mt-10">
        <SafetyNotice />
      </div>
    </main>
  );
}
