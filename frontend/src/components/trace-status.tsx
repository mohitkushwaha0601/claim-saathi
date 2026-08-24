import type { TraceStageState } from "@/lib/api/types";
import { DECISION_VISUALS } from "@/lib/decision-presentation";

const RECORDED_STYLE = {
  RECORDED: { icon: "•", classes: "border-slate-200 bg-slate-50 text-slate-800" },
} as const;

export function TraceStatus({
  state,
  label,
  compact = false,
}: {
  state: TraceStageState;
  label: string;
  compact?: boolean;
}) {
  const style = state === "RECORDED" ? RECORDED_STYLE.RECORDED : DECISION_VISUALS[state];
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border font-semibold ${style.classes} ${compact ? "min-h-7 px-2.5 text-xs" : "min-h-8 px-3 text-sm"}`}
    >
      <span aria-hidden="true" className="font-bold">
        {style.icon}
      </span>
      {label}
    </span>
  );
}
