"use client";

import { useTranslations } from "next-intl";

import { useAppPreferences, type JourneyMode } from "./app-providers";

const MODES: readonly JourneyMode[] = ["guided", "quick"];

export function JourneyModeToggle() {
  const t = useTranslations("Common");
  const { journeyMode, setJourneyMode } = useAppPreferences();

  return (
    <div className="flex min-h-11 items-center rounded-lg border border-line bg-surface p-1" aria-label={t("journeyMode") }>
      {MODES.map((mode) => <button key={mode} type="button" aria-pressed={journeyMode === mode} onClick={() => setJourneyMode(mode)} className="min-h-9 rounded-md px-2.5 text-xs font-bold text-ink transition aria-pressed:bg-brand aria-pressed:text-white focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand sm:px-3 sm:text-sm">{t(`modes.${mode}`)}</button>)}
    </div>
  );
}
