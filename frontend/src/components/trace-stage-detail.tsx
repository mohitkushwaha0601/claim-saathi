import type { ExecutionTraceStage } from "@/lib/api/types";
import {
  DECISION_PRESENTATION,
  formatCheckedAt,
} from "@/lib/decision-presentation";
import { intentForGoal } from "@/lib/demo-intents";

import { PolicySources } from "./policy-sources";
import { PrerequisiteTraceTree } from "./prerequisite-trace-tree";
import { TraceStatus } from "./trace-status";

function Summary({ stage }: { stage: ExecutionTraceStage }) {
  return (
    <>
      <p className="text-sm leading-6 text-muted">{stage.short_description}</p>
      <dl className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl bg-canvas p-4">
          <dt className="text-xs font-bold tracking-[0.1em] text-muted uppercase">
            Input
          </dt>
          <dd className="mt-2 break-words text-sm font-semibold text-ink">
            {stage.input_summary}
          </dd>
        </div>
        <div className="rounded-xl bg-canvas p-4">
          <dt className="text-xs font-bold tracking-[0.1em] text-muted uppercase">
            Output
          </dt>
          <dd className="mt-2 break-words text-sm font-semibold text-ink">
            {stage.output_summary}
          </dd>
        </div>
      </dl>
    </>
  );
}

function NoAiFact() {
  return (
    <div className="rounded-xl border border-line bg-white p-4">
      <p className="text-xs font-bold tracking-[0.1em] text-muted uppercase">
        AI used
      </p>
      <p className="mt-1 font-bold text-ink">No</p>
    </div>
  );
}

export function TraceStageDetail({ stage }: { stage: ExecutionTraceStage }) {
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
            <p className="text-xs font-bold tracking-[0.1em] text-muted uppercase">Citizen goal</p>
            <p className="mt-1 font-bold text-ink">
              {intentForGoal(details.citizen_goal)?.summary ?? details.citizen_goal}
            </p>
            <p className="mt-2 text-sm leading-6 text-ink">
              ClaimSaathi starts with the citizen&apos;s goal rather than asking
              them to choose a government form.
            </p>
          </div>
          <NoAiFact />
        </div>
      ) : null}

      {details.detail_type === "JOURNEY_PLANNER" ? (
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-line bg-white p-4">
            <p className="text-xs font-bold tracking-[0.1em] text-muted uppercase">
              Method
            </p>
            <p className="mt-1 font-bold text-ink">
              Exact reviewed configuration mapping
            </p>
            <p className="mt-2 text-sm leading-6 text-muted">
              No fuzzy matching or model ranking is used.
            </p>
          </div>
          <NoAiFact />
        </div>
      ) : null}

      {details.detail_type === "POLICY_ENGINE" ? (
        <>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <h4 className="text-lg font-bold text-ink">Rules evaluated</h4>
            <span className="text-sm font-semibold text-muted">
              Policy {details.policy_version}
            </span>
          </div>
          <ul className="mt-3 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white">
            {details.rules.map((rule) => (
              <li key={rule.rule_id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="break-all font-bold text-ink">{rule.rule_id}</p>
                  {rule.issue_code ? (
                    <p className="mt-1 break-all text-xs text-muted">
                      Issue: {rule.issue_code}
                    </p>
                  ) : null}
                </div>
                <TraceStatus
                  compact
                  state={rule.state}
                  label={DECISION_PRESENTATION[rule.state].prerequisiteLabel}
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
                eyebrow="Stored provenance"
                heading="Inspect official source metadata"
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
            ClaimSaathi records the result as an immutable decision rather than
            mutating history later.
          </p>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
            {[
              ["Decision ID", details.decision_id],
              ["State revision", String(details.citizen_state_revision)],
              ["Policy version", details.policy_version],
              ["Graph version", details.graph_version],
              ["Journey definition", String(details.journey_definition_version)],
              ["Checked time", `${formatCheckedAt(details.evaluated_at)} UTC`],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl border border-line bg-white p-4">
                <dt className="text-muted">{label}</dt>
                <dd className="mt-1 break-all font-semibold text-ink">{value}</dd>
              </div>
            ))}
            <div className="rounded-xl border border-line bg-white p-4">
              <dt className="text-muted">AI used for decision</dt>
              <dd className="mt-1 font-bold text-ink">No</dd>
            </div>
          </dl>
        </>
      ) : null}
    </div>
  );
}
