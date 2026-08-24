import type { TraceStageState } from "@/lib/api/types";

const STATUS_STYLE: Record<TraceStageState, { icon: string; classes: string }> = {
  RECORDED: { icon: "•", classes: "border-slate-200 bg-slate-50 text-slate-800" },
  PASS: { icon: "✓", classes: "border-emerald-200 bg-emerald-50 text-emerald-900" },
  ACTION_REQUIRED: { icon: "!", classes: "border-amber-200 bg-amber-50 text-amber-950" },
  NOT_ELIGIBLE: { icon: "!", classes: "border-amber-200 bg-amber-50 text-amber-950" },
  UNABLE_TO_VERIFY: { icon: "?", classes: "border-slate-300 bg-slate-50 text-slate-900" },
  NOT_APPLICABLE: { icon: "–", classes: "border-slate-300 bg-slate-50 text-slate-900" },
  POLICY_REVIEW_REQUIRED: { icon: "?", classes: "border-violet-200 bg-violet-50 text-violet-950" },
};

export function TraceStatus({
  state,
  label,
  compact = false,
}: {
  state: TraceStageState;
  label: string;
  compact?: boolean;
}) {
  const style = STATUS_STYLE[state];
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
