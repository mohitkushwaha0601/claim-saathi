"use client";

import { useTranslations } from "next-intl";

import { useAppPreferences } from "./app-providers";

export function AccessibilityToolbar() {
  const t = useTranslations("Accessibility");
  const {
    locale,
    textScale,
    highContrast,
    setLocale,
    decreaseTextScale,
    resetTextScale,
    increaseTextScale,
    toggleHighContrast,
  } = useAppPreferences();

  return (
    <details className="accessibility-menu relative">
      <summary
        aria-label={t("open")}
        className="flex min-h-11 cursor-pointer list-none items-center rounded-lg border border-line px-3 font-bold text-brand marker:hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
      >
        <span aria-hidden="true">Aa</span>
        <span className="sr-only sm:not-sr-only sm:ml-2 sm:text-sm">
          {t("title")}
        </span>
      </summary>
      <div className="accessibility-panel fixed top-24 right-2 left-2 z-40 max-h-[calc(100dvh-7rem)] w-auto overflow-y-auto rounded-2xl border-2 border-line-strong bg-surface p-4 shadow-xl sm:absolute sm:top-[calc(100%+0.5rem)] sm:right-0 sm:left-auto sm:max-h-none sm:w-[min(22rem,calc(100vw-2rem))] sm:overflow-visible">
        <p className="font-bold text-ink">{t("title")}</p>

        <fieldset className="mt-4">
          <legend className="text-sm font-semibold text-muted">
            {t("language")}
          </legend>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <button
              type="button"
              aria-pressed={locale === "en"}
              onClick={() => setLocale("en")}
              className="min-h-11 rounded-lg border border-line-strong px-3 font-semibold text-ink aria-pressed:border-brand aria-pressed:bg-brand-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              {t("english")}
            </button>
            <button
              type="button"
              lang="hi"
              aria-pressed={locale === "hi"}
              onClick={() => setLocale("hi")}
              className="min-h-11 rounded-lg border border-line-strong px-3 font-semibold text-ink aria-pressed:border-brand aria-pressed:bg-brand-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              {t("hindi")}
            </button>
          </div>
        </fieldset>

        <fieldset className="mt-4">
          <legend className="text-sm font-semibold text-muted">
            {t("textSize")}
          </legend>
          <div className="mt-2 grid grid-cols-3 gap-2">
            <button
              type="button"
              aria-label={t("decrease")}
              disabled={textScale === 100}
              onClick={decreaseTextScale}
              className="min-h-11 rounded-lg border border-line-strong font-bold text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:opacity-45"
            >
              A−
            </button>
            <button
              type="button"
              aria-label={t("reset")}
              disabled={textScale === 100}
              onClick={resetTextScale}
              className="min-h-11 rounded-lg border border-line-strong font-bold text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:opacity-45"
            >
              A
            </button>
            <button
              type="button"
              aria-label={t("increase")}
              disabled={textScale === 200}
              onClick={increaseTextScale}
              className="min-h-11 rounded-lg border border-line-strong font-bold text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:opacity-45"
            >
              A+
            </button>
          </div>
          <p aria-live="polite" className="mt-2 text-xs font-semibold text-muted">
            {t("currentScale", { scale: textScale })}
          </p>
        </fieldset>

        <button
          type="button"
          aria-label={t("highContrast")}
          aria-pressed={highContrast}
          onClick={toggleHighContrast}
          className="mt-4 flex min-h-11 w-full items-center justify-between gap-3 rounded-lg border border-line-strong px-3 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          <span>
            <span className="block font-semibold text-ink">
              {t("highContrast")}
            </span>
            <span className="block text-xs leading-5 text-muted">
              {t("highContrastHelp")}
            </span>
          </span>
          <span aria-hidden="true" className="font-bold text-brand">
            {highContrast ? "✓" : "○"}
          </span>
        </button>
      </div>
    </details>
  );
}
