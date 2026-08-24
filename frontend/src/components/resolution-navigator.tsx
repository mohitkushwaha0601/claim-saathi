"use client";

import { useEffect, useMemo, useRef, useState } from "react";

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

import { DemoCorrectionPanel } from "./demo-correction-panel";
import { PolicySources } from "./policy-sources";
import { PrimaryButton } from "./primary-button";
import { ResolutionStepList } from "./resolution-step-list";

const RESOLUTION_STATUS: Record<
  ResolutionState,
  { label: string; copy: string }
> = {
  CREATED: {
    label: "Resolution prepared",
    copy: "ClaimSaathi has prepared the reviewed resolution workflow.",
  },
  CITIZEN_ACTION_REQUIRED: {
    label: "Your action is needed",
    copy: "Follow the official correction guidance shown below.",
  },
  EXTERNAL_ACTION_REQUIRED: {
    label: "Your action is needed",
    copy: "Follow the official correction guidance shown below.",
  },
  WAITING_FOR_UPDATE: {
    label: "Waiting for record update",
    copy: "ClaimSaathi has not verified the correction yet.",
  },
  RECHECKING: {
    label: "Checking for an update",
    copy: "ClaimSaathi is checking the trusted synthetic record.",
  },
  STILL_BLOCKED: {
    label: "Not updated yet",
    copy: "The trusted synthetic record still does not contain the required Date of Exit.",
  },
  RESOLVED: {
    label: "Blocker resolved",
    copy: "The trusted synthetic previous-employment record now contains a Date of Exit.",
  },
};

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
    setPendingAction(action);
    setCommandError(null);
    try {
      setResolution(await command());
    } catch {
      setCommandError("We couldn't update this step right now.");
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
    setPendingAction("demo");
    setDemoError(null);
    try {
      setDemoResult(await simulatePreviousExitDateUpdate(journeyInstanceId));
    } catch {
      setDemoError("We couldn't update the synthetic demo record right now.");
    } finally {
      setPendingAction(null);
    }
  }

  async function reevaluateJourney() {
    if (pendingAction) return;
    setPendingAction("evaluate");
    setCommandError(null);
    const succeeded = await onJourneyReevaluate();
    if (!succeeded) {
      setCommandError("We couldn't check this journey right now.");
      setPendingAction(null);
    }
  }

  if (!resolution) {
    if (!opportunity) return null;
    return (
      <section className="mt-8 rounded-2xl border border-brand/25 bg-brand-soft p-5 sm:p-6" aria-labelledby="resolution-available-heading">
        <p className="text-xs font-bold tracking-[0.14em] text-brand uppercase">
          Resolution available
        </p>
        <h2 id="resolution-available-heading" className="mt-2 text-2xl font-bold text-ink">
          Reviewed guidance can help with this blocker
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
          ClaimSaathi will load the approved resolution linked to this backend
          decision. Starting it does not change a government record.
        </p>
        <PrimaryButton
          className="mt-5 w-full sm:w-auto"
          type="button"
          disabled={pendingAction !== null}
          onClick={() => void beginResolution()}
        >
          {pendingAction === "start" ? "Starting resolution…" : "Start resolution"}
        </PrimaryButton>
        {commandError ? (
          <p role="alert" className="mt-4 text-sm font-semibold text-rose-800">
            {commandError}
          </p>
        ) : null}
      </section>
    );
  }

  const status = RESOLUTION_STATUS[resolution.state];
  const canConfirm =
    resolution.state === "CITIZEN_ACTION_REQUIRED" ||
    resolution.state === "EXTERNAL_ACTION_REQUIRED" ||
    resolution.state === "STILL_BLOCKED";

  return (
    <section className="mt-8 rounded-3xl border border-line-strong bg-white p-5 sm:p-8" aria-labelledby="resolution-heading">
      <div aria-live="polite" aria-atomic="true">
        <p className="text-xs font-bold tracking-[0.14em] text-brand uppercase">
          Resolution navigator
        </p>
        <h2 id="resolution-heading" className="mt-2 text-2xl font-bold text-ink sm:text-3xl">
          {resolution.title}
        </h2>
        <div className="mt-5 rounded-2xl border border-brand/25 bg-brand-soft p-4 sm:p-5">
          <p className="text-xs font-bold tracking-[0.1em] text-brand uppercase">
            Current state
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
              ClaimSaathi is waiting for the trusted record to reflect an update.
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
            eyebrow="Official guidance"
            heading="Resolution guidance source"
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
            <p className="font-bold text-ink">Your next step</p>
            <p className="mt-1 text-sm leading-6 text-muted">
              Follow the official correction guidance shown above.
            </p>
            <PrimaryButton
              className="mt-5 w-full sm:w-auto"
              type="button"
              disabled={pendingAction !== null}
              onClick={() => void confirmStep()}
            >
              {pendingAction === "confirm"
                ? "Recording this step…"
                : resolution.state === "STILL_BLOCKED"
                  ? "I've started the official step again"
                  : "I've started the official step"}
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
            {pendingAction === "recheck" ? "Checking for update…" : "Check for update"}
          </PrimaryButton>
        ) : null}

        {resolution.state === "RESOLVED" ? (
          <>
            <p className="font-bold text-ink">
              This does not automatically mean the whole transfer journey is ready.
            </p>
            <p className="mt-2 text-sm leading-6 text-muted">
              The current journey decision remains Action required until every
              backend check runs again.
            </p>
            <PrimaryButton
              className="mt-5 w-full sm:w-auto"
              type="button"
              disabled={pendingAction !== null}
              onClick={() => void reevaluateJourney()}
            >
              {pendingAction === "evaluate" ? "Checking journey again…" : "Check journey again"}
            </PrimaryButton>
          </>
        ) : null}

        {commandError ? (
          <p role="alert" className="mt-4 text-sm font-semibold text-rose-800">
            {commandError}
          </p>
        ) : null}
      </div>

      <details className="mt-6 border-t border-line pt-5">
        <summary className="min-h-11 cursor-pointer font-semibold text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand">
          How this works
        </summary>
        <p className="mt-2 text-sm leading-6 text-muted">
          Fixing a blocker does not rewrite an earlier decision. ClaimSaathi
          runs all checks again and creates a new decision.
        </p>
      </details>
    </section>
  );
}
