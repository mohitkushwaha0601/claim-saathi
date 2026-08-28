import type { IntentIcon } from "@/lib/demo-intents";
import { useTranslations } from "next-intl";

function IntentGlyph({ icon }: { icon: IntentIcon }) {
  const common = "h-6 w-6";
  if (icon === "funds") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="3" y="6" width="18" height="13" rx="2" />
        <path d="M16 11h5v4h-5a2 2 0 0 1 0-4ZM7 6V4h10v2" />
      </svg>
    );
  }
  if (icon === "transfer") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M4 8h14M15 5l3 3-3 3M20 16H6M9 13l-3 3 3 3" />
      </svg>
    );
  }
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M5 20V7l7-4 7 4v13M9 20v-5h6v5M3 20h18" />
    </svg>
  );
}

export function IntentCard({
  title,
  description,
  personaName,
  icon,
  disabled,
  onSelect,
}: {
  title: string;
  description: string;
  personaName: string;
  icon: IntentIcon;
  disabled: boolean;
  onSelect: () => void;
}) {
  const t = useTranslations("Home");
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onSelect}
      className={`intent-card group flex min-h-40 min-w-0 w-full items-start gap-4 rounded-[14px] border p-5 text-left transition hover:-translate-y-0.5 hover:border-brand hover:shadow-[0_14px_36px_rgba(11,37,69,0.12)] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-brand disabled:cursor-wait disabled:opacity-60 disabled:hover:translate-y-0 sm:p-6 ${icon === "funds" ? "border-brand bg-brand text-white" : "border-line bg-surface text-ink"}`}
    >
      <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition ${icon === "funds" ? "bg-white/15 text-white" : "bg-brand-soft text-brand group-hover:bg-brand group-hover:text-white"}`}>
        <IntentGlyph icon={icon} />
      </span>
      <span className="min-w-0 flex-1">
        <span className={`block text-lg font-bold leading-6 tracking-[-0.015em] ${icon === "funds" ? "text-white" : "text-ink"}`}>
          {title}
        </span>
        <span className={`mt-2 block text-sm leading-6 ${icon === "funds" ? "text-white/85" : "text-muted"}`}>
          {description}
        </span>
        <span className={`mt-3 block text-xs font-semibold tracking-wide uppercase ${icon === "funds" ? "text-gold-soft" : "text-brand"}`}>
          {t("syntheticExample", { name: personaName })}
        </span>
      </span>
      <svg aria-hidden="true" viewBox="0 0 20 20" className={`intent-card-arrow mt-1 h-5 w-5 shrink-0 transition group-hover:translate-x-0.5 ${icon === "funds" ? "text-white" : "text-slate-400 group-hover:text-brand"}`} fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="m7 4 6 6-6 6" />
      </svg>
    </button>
  );
}
