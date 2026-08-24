"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";

import { simulatePreviousExitDateUpdate } from "@/lib/api/demo";
import {
  confirmExternalStepStarted,
  recheckResolution,
  startResolution,
} from "@/lib/api/resolutions";
import type {
  DecisionDetailResponse,
  DemoEventResponse,
  ResolutionResponse,
  ResolutionState,
} from "@/lib/api/types";

import { useAppPreferences } from "./app-providers";
import { DemoCorrectionPanel } from "./demo-correction-panel";
import { PolicySources } from "./policy-sources";
import { PrimaryButton } from "./primary-button";
import { ResolutionStepList } from "./resolution-step-list";

type PendingAction = "start" | "confirm" | "recheck" | "demo" | "evaluate";

export function ResolutionNavigator({
  journeyInstanceId,
  decision,
  initialResolution,
  onJourneyReevaluate,
}: {
  journeyInstanceId: string;
  decision: DecisionDetailResponse;
  initialResolution: ResolutionResponse | null;
  onJourneyReevaluate: () => Promise<boolean>;
}) {
  const t = useTranslations("Resolution");
  const sourcesT = useTranslations("Sources");
  const errorT = useTranslations("Errors");
  const networkT = useTranslations("Network");
  const { online, saveData } = useAppPreferences();
  const [resolution, setResolution] = useState(initialResolution);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [commandError, setCommandError] = useState<string | null>(null);
  const [demoError, setDemoError] = useState<string | null>(null);
  const [demoResult, setDemoResult] = useState<DemoEventResponse | null>(null);
  const stateHeadingRef = useRef<HTMLHeadingElement>(null);
  const previousState = useRef<ResolutionState | null>(initialResolution?.state ?? null);

  const opportunity = useMemo(
    () =>
      decision.rule_results.find(
        (result) =>
          result.issue_code !== null &&
          result.resolution_id !== null &&
          decision.issue_codes.includes(result.issue_code) &&
          decision.resolution_ids.includes(result.resolution_id),
      ) ?? null,
    [decision],
  );

  useEffect(() => {
    const nextState = resolution?.state ?? null;
    if (nextState && previousState.current !== nextState) {
      stateHeadingRef.current?.focus();
    }
    previousState.current = nextState;
  }, [resolution?.state]);

  async function runResolutionCommand(
    action: Exclude<PendingAction, "demo" | "evaluate">,
    command: () => Promise<ResolutionResponse>,
  ) {
    if (pendingAction) return;
    if (!online) {
      setCommandError(errorT("offlineRequest"));
      return;
    }
    setPendingAction(action);
    setCommandError(null);
    try {
      setResolution(await command());
    } catch {
      setCommandError(errorT("resolutionCommand"));
    } finally {
      setPendingAction(null);
    }
  }

  async function beginResolution() {
    if (!opportunity) return;
    await runResolutionCommand("start", () =>
      startResolution(journeyInstanceId, {
        decision_id: decision.decision_id,
        issue_code: opportunity.issue_code!,
      }),
    );
  }

  async function confirmStep() {
    if (!resolution) return;
    await runResolutionCommand("confirm", () =>
      confirmExternalStepStarted(
        journeyInstanceId,
        resolution.resolution_instance_id,
      ),
    );
  }

  async function recheck() {
    if (!resolution) return;
    await runResolutionCommand("recheck", () =>
      recheckResolution(
        journeyInstanceId,
        resolution.resolution_instance_id,
      ),
    );
  }

  async function simulateCorrection() {
    if (pendingAction) return;
    if (!online) {
      setDemoError(errorT("offlineRequest"));
      return;
    }
    setPendingAction("demo");
    setDemoError(null);
    try {
      setDemoResult(await simulatePreviousExitDateUpdate(journeyInstanceId));
    } catch {
      setDemoError(errorT("demoUpdate"));
    } finally {
      setPendingAction(null);
    }
  }

  async function reevaluateJourney() {
    if (pendingAction) return;
    if (!online) {
      setCommandError(errorT("offlineRequest"));
      return;
    }
    setPendingAction("evaluate");
    setCommandError(null);
    const succeeded = await onJourneyReevaluate();
    if (!succeeded) {
      setCommandError(errorT("journeyCheck"));
      setPendingAction(null);
    }
  }

  if (!resolution) {
    if (!opportunity) return null;
    return (
      <section className="mt-8 rounded-2xl border border-brand/25 bg-brand-soft p-5 sm:p-6" aria-labelledby="resolution-available-heading">
        <p className="text-xs font-bold tracking-[0.14em] text-brand uppercase">
          {t("available")}
        </p>
        <h2 id="resolution-available-heading" className="mt-2 text-2xl font-bold text-ink">
          {t("availableTitle")}
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
          {t("availableCopy")}
        </p>
        <PrimaryButton
          className="mt-5 w-full sm:w-auto"
          type="button"
          disabled={pendingAction !== null}
          onClick={() => void beginResolution()}
        >
          {pendingAction === "start" ? t("starting") : t("start")}
        </PrimaryButton>
        {commandError ? (
          <p role="alert" className="mt-4 text-sm font-semibold text-rose-800">
            {commandError}
          </p>
        ) : null}
      </section>
    );
  }

  const status = {
    label: t(`statuses.${resolution.state}.label`),
    copy: t(`statuses.${resolution.state}.copy`),
  };
  const canConfirm =
    resolution.state === "CITIZEN_ACTION_REQUIRED" ||
    resolution.state === "EXTERNAL_ACTION_REQUIRED" ||
    resolution.state === "STILL_BLOCKED";

  return (
    <section className="mt-8 rounded-3xl border border-line-strong bg-white p-5 sm:p-8" aria-labelledby="resolution-heading">
      <div aria-live="polite" aria-atomic="true">
        <p className="text-xs font-bold tracking-[0.14em] text-brand uppercase">
          {t("navigator")}
        </p>
        <h2 id="resolution-heading" className="mt-2 text-2xl font-bold text-ink sm:text-3xl">
          {resolution.resolution_id === "RES_EXIT" ? t("title") : resolution.title}
        </h2>
        <div className="mt-5 rounded-2xl border border-brand/25 bg-brand-soft p-4 sm:p-5">
          <p className="text-xs font-bold tracking-[0.1em] text-brand uppercase">
            {t("current")}
          </p>
          <h3
            ref={stateHeadingRef}
            tabIndex={-1}
            className="mt-2 text-xl font-bold text-ink focus:outline-none"
          >
            {status.label}
          </h3>
          <p className="mt-2 text-sm leading-6 text-muted">{status.copy}</p>
          {resolution.state === "WAITING_FOR_UPDATE" ? (
            <p className="mt-2 text-sm font-semibold text-ink">
              {t("waitingExtra")}
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-8">
        <ResolutionStepList steps={resolution.approved_steps} />
      </div>

      {resolution.official_sources.length > 0 ? (
        <div className="mt-8">
          <PolicySources
            key={`${resolution.resolution_instance_id}-${resolution.updated_at}`}
            sourceIds={resolution.official_sources}
            eyebrow={sourcesT("officialGuidance")}
            heading={sourcesT("resolutionSource")}
          />
        </div>
      ) : null}

      {resolution.state === "STILL_BLOCKED" ? (
        <div className="mt-8">
          <DemoCorrectionPanel
            pending={pendingAction === "demo"}
            result={demoResult}
            error={demoError}
            onSimulate={() => void simulateCorrection()}
          />
        </div>
      ) : null}

      <div className="mt-8 border-t border-line pt-6">
        {canConfirm ? (
          <>
            <p className="font-bold text-ink">{t("next")}</p>
            <p className="mt-1 text-sm leading-6 text-muted">
              {t("nextCopy")}
            </p>
            <PrimaryButton
              className="mt-5 w-full sm:w-auto"
              type="button"
              disabled={pendingAction !== null}
              onClick={() => void confirmStep()}
            >
              {pendingAction === "confirm"
                ? t("recording")
                : resolution.state === "STILL_BLOCKED"
                  ? t("startedAgain")
                  : t("started")}
            </PrimaryButton>
          </>
        ) : null}

        {resolution.state === "WAITING_FOR_UPDATE" ? (
          <PrimaryButton
            className="w-full sm:w-auto"
            type="button"
            disabled={pendingAction !== null}
            onClick={() => void recheck()}
          >
            {pendingAction === "recheck" ? t("checkingUpdate") : t("checkUpdate")}
          </PrimaryButton>
        ) : null}

        {resolution.state === "RESOLVED" ? (
          <>
            <p className="font-bold text-ink">
              {t("resolvedCaution")}
            </p>
            <p className="mt-2 text-sm leading-6 text-muted">
              {t("resolvedCopy")}
            </p>
            <PrimaryButton
              className="mt-5 w-full sm:w-auto"
              type="button"
              disabled={pendingAction !== null}
              onClick={() => void reevaluateJourney()}
            >
              {pendingAction === "evaluate" ? t("checkingJourney") : t("checkJourney")}
            </PrimaryButton>
          </>
        ) : null}

        {commandError ? (
          <p role="alert" className="mt-4 text-sm font-semibold text-rose-800">
            {commandError}
          </p>
        ) : null}
      </div>

      {pendingAction && saveData ? (
        <p className="mt-3 text-sm text-muted">{networkT("slowPending")}</p>
      ) : null}

      <details className="mt-6 border-t border-line pt-5">
        <summary className="min-h-11 cursor-pointer font-semibold text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand">
          {t("how")}
        </summary>
        <p className="mt-2 text-sm leading-6 text-muted">
          {t("howCopy")}
        </p>
      </details>
    </section>
  );
}
