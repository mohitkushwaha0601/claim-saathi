"use client";

import { useTranslations } from "next-intl";
import type { ExecutionTraceStage } from "@/lib/api/types";
import { formatCheckedAt } from "@/lib/decision-presentation";

import { useAppPreferences } from "./app-providers";
import { PolicySources } from "./policy-sources";
import { PrerequisiteTraceTree } from "./prerequisite-trace-tree";
import { TraceStatus } from "./trace-status";

function Summary({ stage }: { stage: ExecutionTraceStage }) {
  const t = useTranslations("Trace");
  const stateT = useTranslations("DecisionStates");
  const homeT = useTranslations("Home");
  const processT = useTranslations("Process");
  const details = stage.details;
  let input: string;
  let output: string;
  if (details.detail_type === "INTENT") {
    input = homeT(`intents.${details.citizen_goal}.summary`);
    output = t("goalRecorded");
  } else if (details.detail_type === "JOURNEY_PLANNER") {
    input = homeT(`intents.${details.citizen_goal}.summary`);
    output = t("journeyMapped", {
      journey: processT(`journeys.${details.journey_id}`),
    });
  } else if (details.detail_type === "POLICY_ENGINE") {
    input = t("policyInput", { version: details.policy_version });
    output = t("stateOutput", {
      state: stateT(`${stage.state}.label`),
    });
  } else if (details.detail_type === "PREREQUISITE_GRAPH") {
    input = t("graphInput", { version: details.graph_version });
    output = t("stateOutput", {
      state: stateT(`${stage.state}.label`),
    });
  } else {
    input = t("decisionInput");
    output = t("decisionOutput", { id: details.decision_id });
  }
  return (
    <>
      <p className="text-sm leading-6 text-muted">
        {t(`stageDescriptions.${stage.stage_type}`)}
      </p>
      <dl className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl bg-canvas p-4">
          <dt className="text-xs font-bold tracking-[0.1em] text-muted uppercase">
            {t("input")}
          </dt>
          <dd className="mt-2 break-words text-sm font-semibold text-ink">
            {input}
          </dd>
        </div>
        <div className="rounded-xl bg-canvas p-4">
          <dt className="text-xs font-bold tracking-[0.1em] text-muted uppercase">
            {t("output")}
          </dt>
          <dd className="mt-2 break-words text-sm font-semibold text-ink">
            {output}
          </dd>
        </div>
      </dl>
    </>
  );
}

function NoAiFact() {
  const t = useTranslations();
  return (
    <div className="rounded-xl border border-line bg-white p-4">
      <p className="text-xs font-bold tracking-[0.1em] text-muted uppercase">
        {t("Trace.aiUsed")}
      </p>
      <p className="mt-1 font-bold text-ink">{t("Common.no")}</p>
    </div>
  );
}

export function TraceStageDetail({ stage }: { stage: ExecutionTraceStage }) {
  const t = useTranslations();
  const { locale } = useAppPreferences();
  const details = stage.details;
  const sourceIds =
    details.detail_type === "POLICY_ENGINE"
      ? Array.from(
          new Set(
            details.rules.flatMap((rule) =>
              rule.source_id ? [rule.source_id] : [],
            ),
          ),
        )
      : [];

  return (
    <div>
      <Summary stage={stage} />

      {details.detail_type === "INTENT" ? (
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-line bg-white p-4">
            <p className="text-xs font-bold tracking-[0.1em] text-muted uppercase">{t("Trace.citizenGoal")}</p>
            <p className="mt-1 font-bold text-ink">
              {t(`Home.intents.${details.citizen_goal}.summary`)}
            </p>
            <p className="mt-2 text-sm leading-6 text-ink">
              {t("Trace.goalCopy")}
            </p>
          </div>
          <NoAiFact />
        </div>
      ) : null}

      {details.detail_type === "JOURNEY_PLANNER" ? (
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-line bg-white p-4">
            <p className="text-xs font-bold tracking-[0.1em] text-muted uppercase">
              {t("Trace.method")}
            </p>
            <p className="mt-1 font-bold text-ink">
              {t("Trace.exactMapping")}
            </p>
            <p className="mt-2 text-sm leading-6 text-muted">
              {t("Trace.noFuzzy")}
            </p>
          </div>
          <NoAiFact />
        </div>
      ) : null}

      {details.detail_type === "POLICY_ENGINE" ? (
        <>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <h4 className="text-lg font-bold text-ink">{t("Trace.rules")}</h4>
            <span className="text-sm font-semibold text-muted">
              {t("Trace.policy", { version: details.policy_version })}
            </span>
          </div>
          <ul className="mt-3 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white">
            {details.rules.map((rule) => (
              <li key={rule.rule_id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="break-all font-bold text-ink">{rule.rule_id}</p>
                  {rule.issue_code ? (
                    <p className="mt-1 break-all text-xs text-muted">
                      {t("Trace.issue", { code: rule.issue_code })}
                    </p>
                  ) : null}
                </div>
                <TraceStatus
                  compact
                  state={rule.state}
                  label={t(`DecisionStates.${rule.state}.prerequisite`)}
                />
              </li>
            ))}
          </ul>
          <div className="mt-4">
            <NoAiFact />
          </div>
          {sourceIds.length > 0 ? (
            <div className="mt-8 border-t border-line pt-6">
              <PolicySources
                sourceIds={sourceIds}
                eyebrow={t("Sources.storedProvenance")}
                heading={t("Sources.inspect")}
              />
            </div>
          ) : null}
        </>
      ) : null}

      {details.detail_type === "PREREQUISITE_GRAPH" ? (
        <>
          <PrerequisiteTraceTree
            rootNodeId={details.root_node_id}
            nodes={details.nodes}
          />
          <div className="mt-4">
            <NoAiFact />
          </div>
        </>
      ) : null}

      {details.detail_type === "DECISION_RECORD" ? (
        <>
          <p className="mt-6 rounded-xl border border-brand/20 bg-brand-soft p-4 text-sm font-semibold leading-6 text-ink">
            {t("Trace.storedDecisionCopy")}
          </p>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
            {[
              [t("Audit.decisionId"), details.decision_id],
              [t("Trace.stateRevision"), String(details.citizen_state_revision)],
              [t("Audit.policyVersion"), details.policy_version],
              [t("Audit.graphVersion"), details.graph_version],
              [t("Trace.journeyDefinition"), String(details.journey_definition_version)],
              [t("Trace.checkedTime"), `${formatCheckedAt(details.evaluated_at, locale)} UTC`],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl border border-line bg-white p-4">
                <dt className="text-muted">{label}</dt>
                <dd className="mt-1 break-all font-semibold text-ink">{value}</dd>
              </div>
            ))}
            <div className="rounded-xl border border-line bg-white p-4">
              <dt className="text-muted">{t("Audit.aiUsed")}</dt>
              <dd className="mt-1 font-bold text-ink">{t("Common.no")}</dd>
            </div>
          </dl>
        </>
      ) : null}
    </div>
  );
}
