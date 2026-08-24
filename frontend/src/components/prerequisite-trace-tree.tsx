"use client";

import { useTranslations } from "next-intl";
import type { TraceGraphNodeResponse } from "@/lib/api/types";

import { TraceStatus } from "./trace-status";

function TraceTreeNode({
  nodeId,
  nodes,
  isRoot = false,
}: {
  nodeId: string;
  nodes: Map<string, TraceGraphNodeResponse>;
  isRoot?: boolean;
}) {
  const t = useTranslations();
  const traceT = useTranslations("Trace");
  const node = nodes.get(nodeId);
  if (!node) return null;
  return (
    <li className={isRoot ? "trace-tree-root" : "trace-tree-node"}>
      <div className="rounded-xl border border-line bg-white p-3 text-center shadow-sm">
        <p className="text-sm font-bold leading-5 text-ink">
          {traceT.has(`nodeLabels.${node.node_id}`)
            ? traceT(`nodeLabels.${node.node_id}`)
            : node.label}
        </p>
        <div className="mt-2">
          <TraceStatus
            compact
            state={node.state}
            label={t(`DecisionStates.${node.state}.prerequisite`)}
          />
        </div>
        {node.rule_id ? (
          <p className="mt-2 break-all text-xs font-medium text-muted">
            {node.rule_id}
          </p>
        ) : null}
      </div>
      {node.children_ids.length > 0 ? (
        <ul className="trace-tree-children">
          {node.children_ids.map((childId) => (
            <TraceTreeNode key={childId} nodeId={childId} nodes={nodes} />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

export function PrerequisiteTraceTree({
  rootNodeId,
  nodes,
}: {
  rootNodeId: string;
  nodes: TraceGraphNodeResponse[];
}) {
  const t = useTranslations("Trace");
  const byId = new Map(nodes.map((node) => [node.node_id, node]));
  return (
    <div
      className="trace-tree mt-5 rounded-2xl border border-line bg-canvas p-4 sm:p-6"
      aria-label={t("graphLabel")}
    >
      <ul>
        <TraceTreeNode nodeId={rootNodeId} nodes={byId} isRoot />
      </ul>
    </div>
  );
}
