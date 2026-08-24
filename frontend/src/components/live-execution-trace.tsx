"use client";

import { useEffect, useRef, useState } from "react";

import { ClaimSaathiApiError } from "@/lib/api/client";
import { listDemoPersonas } from "@/lib/api/demo";
import { createJourney, evaluateJourney } from "@/lib/api/journeys";
import { getExecutionTrace } from "@/lib/api/traces";
import type {
  ExecutionTraceResponse,
  IntentGoal,
  TraceStageType,
} from "@/lib/api/types";
import {
  bindPersonasToIntents,
  DemoConfigurationError,
} from "@/lib/demo-intents";
import { DECISION_PRESENTATION } from "@/lib/decision-presentation";

import { TraceStageDetail } from "./trace-stage-detail";
import { TraceStatus } from "./trace-status";

type ScenarioId = "ravi" | "priya" | "arjun";

interface TraceScenario {
  id: ScenarioId;
  name: string;
  pathLabel: string;
  subtitle: string;
  personaId: string;
  goal: IntentGoal;
}

const SCENARIOS: readonly TraceScenario[] = [
  {
    id: "ravi",
    name: "Ravi",
    pathLabel: "Ready path",
    subtitle: "All configured prerequisites pass",
    personaId: "RAVI_PARTIAL_READY",
    goal: "ACCESS_SOME_PF_FUNDS",
  },
  {
    id: "priya",
    name: "Priya",
    pathLabel: "Blocker path",
    subtitle: "A record blocker requires resolution",
    personaId: "PRIYA_TRANSFER_MISSING_EXIT",
    goal: "TRANSFER_PF_AFTER_EMPLOYMENT_CHANGE",
  },
  {
    id: "arjun",
    name: "Arjun",
    pathLabel: "Safety path",
    subtitle: "Policy uncertainty stops the system safely",
    personaId: "ARJUN_FINAL_SETTLEMENT",
    goal: "FINAL_PF_SETTLEMENT",
  },
] as const;

function scenarioById(id: ScenarioId): TraceScenario {
  return SCENARIOS.find((scenario) => scenario.id === id)!;
}

function PriyaRecoveryArchitecture() {
  const steps = [
    ["Decision #1", "ACTION_REQUIRED"],
    ["Reviewed resolution", "RES_EXIT"],
    ["External trusted state", "record changes outside ClaimSaathi"],
    ["Resolution verifier", "RESOLVED"],
    ["Important", "whole journey is not automatically PASS"],
    ["Full policy re-evaluation", "every configured rule runs again"],
    ["Full graph re-evaluation", "every prerequisite is combined again"],
    ["Decision #2", "PASS only after the completed demo flow"],
  ] as const;
  return (
    <section className="mt-8 rounded-3xl border border-violet-200 bg-violet-50 p-5 sm:p-7" aria-labelledby="priya-recovery-heading">
      <p className="text-xs font-bold tracking-[0.14em] text-violet-900 uppercase">
        Architecture · not the current live trace
      </p>
      <h3 id="priya-recovery-heading" className="mt-2 text-2xl font-bold text-violet-950">
        Resolving one blocker does not rewrite or automatically pass the journey.
      </h3>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-violet-950">
        ClaimSaathi runs every configured rule and prerequisite again and creates
        a new immutable decision. The full recovery interaction remains in
        Priya&apos;s citizen journey.
      </p>
      <ol className="mt-6 grid gap-2" aria-label="Priya recovery architecture">
        {steps.map(([label, value], index) => (
          <li key={label} className="relative rounded-xl border border-violet-200 bg-white/80 p-4 pl-12">
            <span className="absolute top-4 left-4 flex h-6 w-6 items-center justify-center rounded-full bg-violet-100 text-xs font-bold text-violet-900" aria-hidden="true">
              {index + 1}
            </span>
            <p className="text-sm font-bold text-violet-950">{label}</p>
            <p className="mt-1 text-sm leading-5 text-violet-900">{value}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

function ArjunSafeStop() {
  return (
    <section className="mt-8 rounded-3xl border border-violet-200 bg-violet-50 p-5 sm:p-7" aria-labelledby="arjun-safe-heading">
      <p className="text-xs font-bold tracking-[0.14em] text-violet-900 uppercase">
        Safe state
      </p>
      <h3 id="arjun-safe-heading" className="mt-2 text-2xl font-bold text-violet-950">
        The system stops instead of guessing.
      </h3>
      <dl className="mt-5 grid gap-3 sm:grid-cols-3">
        {[
          ["AI fallback", "Not used"],
          ["Numeric waiting period", "Not invented"],
          ["Government outcome", "Not claimed"],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border border-violet-200 bg-white/80 p-4">
            <dt className="text-sm text-violet-900">{label}</dt>
            <dd className="mt-1 font-bold text-violet-950">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function LiveExecutionTrace() {
  const [selectedScenarioId, setSelectedScenarioId] =
    useState<ScenarioId>("ravi");
  const [traces, setTraces] = useState<
    Partial<Record<ScenarioId, ExecutionTraceResponse>>
  >({});
  const [selectedStageId, setSelectedStageId] =
    useState<TraceStageType>("INTENT");
  const [pendingScenario, setPendingScenario] = useState<ScenarioId | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const detailHeadingRef = useRef<HTMLHeadingElement>(null);

  const scenario = scenarioById(selectedScenarioId);
  const trace = traces[selectedScenarioId] ?? null;
  const selectedStage =
    trace?.stages.find((stage) => stage.stage_id === selectedStageId) ??
    trace?.stages[0] ??
    null;

  useEffect(() => {
    if (selectedStage) detailHeadingRef.current?.focus();
  }, [selectedStage]);

  function selectScenario(id: ScenarioId) {
    setSelectedScenarioId(id);
    setSelectedStageId("INTENT");
    setError(null);
  }

  async function generateTrace() {
    if (pendingScenario) return;
    setPendingScenario(selectedScenarioId);
    setError(null);
    setAnnouncement(`Generating ${scenario.name}'s synthetic trace.`);
    try {
      const personaResponse = await listDemoPersonas();
      const intents = bindPersonasToIntents(personaResponse.personas);
      const boundIntent = intents.find(
        (intent) =>
          intent.expectedPersonaId === scenario.personaId &&
          intent.goal === scenario.goal,
      );
      if (!boundIntent) throw new DemoConfigurationError();

      const journey = await createJourney({
        persona_id: boundIntent.persona.persona_id,
        goal: boundIntent.goal,
      });
      const decision = await evaluateJourney(journey.journey_instance_id);
      const result = await getExecutionTrace(
        journey.journey_instance_id,
        decision.decision_id,
      );
      if (
        result.journey_instance_id !== journey.journey_instance_id ||
        result.decision_id !== decision.decision_id
      ) {
        throw new ClaimSaathiApiError(
          "TRACE_IDENTITY_MISMATCH",
          "The execution trace could not be displayed safely.",
          200,
        );
      }
      setTraces((current) => ({
        ...current,
        [selectedScenarioId]: result,
      }));
      setSelectedStageId("INTENT");
      setAnnouncement(
        `${scenario.name}'s synthetic trace is ready: ${DECISION_PRESENTATION[result.decision_state].label}.`,
      );
    } catch {
      setError("We couldn't generate this synthetic trace right now.");
      setAnnouncement("The synthetic trace could not be generated.");
    } finally {
      setPendingScenario(null);
    }
  }

  return (
    <div>
      <div aria-label="Synthetic trace scenarios" className="grid gap-3 sm:grid-cols-3">
        {SCENARIOS.map((item) => {
          const selected = selectedScenarioId === item.id;
          return (
            <button
              key={item.id}
              type="button"
              aria-label={`${item.name} — ${item.pathLabel}: ${item.subtitle}`}
              aria-pressed={selected}
              disabled={pendingScenario !== null}
              onClick={() => selectScenario(item.id)}
              className={`min-h-36 rounded-2xl border p-5 text-left transition focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-brand disabled:cursor-wait disabled:opacity-70 ${
                selected
                  ? "border-brand bg-brand-soft shadow-sm"
                  : "border-line bg-white hover:border-brand/40"
              }`}
            >
              <span className="block text-xl font-bold text-ink">{item.name}</span>
              <span className="mt-1 block text-xs font-bold tracking-[0.1em] text-brand uppercase">
                {item.pathLabel}
              </span>
              <span className="mt-3 block text-sm leading-5 text-muted">
                {item.subtitle}
              </span>
            </button>
          );
        })}
      </div>

      <div
        aria-busy={pendingScenario !== null}
        className="mt-5 rounded-2xl border border-line bg-white p-5 sm:flex sm:items-center sm:justify-between sm:gap-6 sm:p-6"
      >
        <div>
          <p className="text-sm font-bold text-ink">{scenario.name} · {scenario.pathLabel}</p>
          <p className="mt-1 text-sm leading-6 text-muted">
            This explicit demo action creates and evaluates a new isolated
            synthetic journey, then reads its stored trace.
          </p>
        </div>
        <button
          type="button"
          disabled={pendingScenario !== null}
          onClick={() => void generateTrace()}
          className="mt-4 inline-flex min-h-12 w-full shrink-0 items-center justify-center rounded-xl bg-brand px-5 py-3 font-semibold text-white transition hover:bg-brand-strong focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-brand disabled:cursor-wait disabled:bg-slate-400 sm:mt-0 sm:w-auto"
        >
          {pendingScenario === selectedScenarioId
            ? "Generating synthetic trace…"
            : error
              ? "Try trace again"
              : "Generate synthetic trace"}
        </button>
      </div>

      <p role="status" aria-live="polite" className="sr-only">
        {announcement}
      </p>
      {error ? (
        <p role="alert" className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-950">
          {error}
        </p>
      ) : null}

      {trace ? (
        <div className="mt-8" aria-busy={pendingScenario === selectedScenarioId}>
          <div className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-line bg-white p-5 sm:p-6">
            <div>
              <p className="text-xs font-bold tracking-[0.12em] text-brand uppercase">
                Current live trace · backend truth
              </p>
              <h3 className="mt-2 text-2xl font-bold text-ink">
                {scenario.name}&apos;s stored decision
              </h3>
              <p className="mt-2 text-sm leading-6 text-muted">
                Applicable official process identified: {trace.official_process.label}.
                ClaimSaathi has not executed that process.
              </p>
            </div>
            <TraceStatus
              state={trace.decision_state}
              label={DECISION_PRESENTATION[trace.decision_state].label}
            />
          </div>

          <ol className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-stretch" aria-label="Execution trace stages">
            {trace.stages.map((stage, index) => {
              const selected = selectedStage?.stage_id === stage.stage_id;
              return (
                <li key={stage.stage_id} className="flex min-w-0 flex-1 flex-col sm:flex-row sm:items-center">
                  <button
                    type="button"
                    aria-label={`Stage ${index + 1}: ${stage.label} — ${stage.state_display}`}
                    aria-pressed={selected}
                    onClick={() => setSelectedStageId(stage.stage_id)}
                    className={`min-h-24 w-full rounded-xl border p-3 text-left transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${
                      selected
                        ? "border-brand bg-brand-soft"
                        : "border-line bg-white hover:border-brand/40"
                    }`}
                  >
                    <span className="block text-xs font-bold tracking-[0.08em] text-muted uppercase">
                      Stage {index + 1}
                    </span>
                    <span className="mt-1 block text-sm font-bold leading-5 text-ink">
                      {stage.label}
                    </span>
                    <span className="mt-2 block text-xs font-semibold text-muted">
                      {stage.state_display}
                    </span>
                  </button>
                  {index < trace.stages.length - 1 ? (
                    <span aria-hidden="true" className="self-center py-1 font-bold text-brand sm:px-1 sm:py-0">
                      <span className="sm:hidden">↓</span>
                      <span className="hidden sm:inline">→</span>
                    </span>
                  ) : null}
                </li>
              );
            })}
          </ol>

          {selectedStage ? (
            <section className="mt-5 rounded-3xl border border-line-strong bg-surface p-5 sm:p-7" aria-labelledby="trace-detail-heading">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold tracking-[0.12em] text-brand uppercase">
                    Selected stage
                  </p>
                  <h3
                    ref={detailHeadingRef}
                    id="trace-detail-heading"
                    tabIndex={-1}
                    className="mt-2 text-2xl font-bold text-ink outline-none"
                  >
                    {selectedStage.label}
                  </h3>
                </div>
                <TraceStatus
                  state={selectedStage.state}
                  label={selectedStage.state_display}
                />
              </div>
              <div className="mt-5 border-t border-line pt-5">
                <TraceStageDetail stage={selectedStage} />
              </div>
            </section>
          ) : null}

          {selectedScenarioId === "ravi" && trace.decision_state === "PASS" ? (
            <p className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-950">
              Ravi&apos;s stored trace shows every configured prerequisite ready.
            </p>
          ) : null}
          {selectedScenarioId === "priya" ? <PriyaRecoveryArchitecture /> : null}
          {selectedScenarioId === "arjun" &&
          trace.decision_state === "POLICY_REVIEW_REQUIRED" ? (
            <ArjunSafeStop />
          ) : null}
        </div>
      ) : (
        <div className="mt-8 rounded-2xl border border-dashed border-line-strong bg-canvas p-6 text-center">
          <p className="font-bold text-ink">No live trace generated yet</p>
          <p className="mt-2 text-sm leading-6 text-muted">
            Choose a scenario and generate its trace. Nothing runs automatically.
          </p>
        </div>
      )}
    </div>
  );
}
