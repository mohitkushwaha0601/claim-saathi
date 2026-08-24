"use client";

import { useTranslations } from "next-intl";

export function SafetyNotice({ compact = false }: { compact?: boolean }) {
  const t = useTranslations("Safety");
  return (
    <aside
      aria-label={t("label")}
      className={`rounded-2xl border border-line bg-surface ${compact ? "p-4" : "p-5 sm:p-6"}`}
    >
      <div className="flex gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand" aria-hidden="true">
          <svg
            viewBox="0 0 24 24"
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <circle cx="12" cy="12" r="9" />
            <path d="M12 10v6M12 7.5h.01" />
          </svg>
        </span>
        <div>
          <h2 className="font-semibold text-ink">{t("title")}</h2>
          <p className="mt-1 text-sm leading-6 text-muted">
            {t("copy")}
          </p>
        </div>
      </div>
    </aside>
  );
}
