"use client";

import { useTranslations } from "next-intl";

export function DemoBoundaryBar() {
  const t = useTranslations("Common");
  return (
    <div
      role="note"
      className="border-b border-sky-200 bg-sky-50 text-sky-950"
    >
      <div className="mx-auto flex min-h-11 w-full max-w-5xl items-center gap-2 px-5 py-2.5 text-sm font-semibold sm:px-8">
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="h-5 w-5 shrink-0"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <path d="M12 3 3.5 6.5v5.3c0 4.5 3.1 7.7 8.5 9.2 5.4-1.5 8.5-4.7 8.5-9.2V6.5L12 3Z" />
          <path d="M9 12.2 11 14l4-4" />
        </svg>
        <span>{t("demoBoundary")}</span>
      </div>
    </div>
  );
}
