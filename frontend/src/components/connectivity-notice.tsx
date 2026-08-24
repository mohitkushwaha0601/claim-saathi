"use client";

import { useTranslations } from "next-intl";

import { useAppPreferences } from "./app-providers";

export function ConnectivityNotice() {
  const t = useTranslations("Network");
  const { online } = useAppPreferences();
  if (online) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="border-b-2 border-amber-900 bg-amber-100 text-amber-950"
    >
      <p className="mx-auto w-full max-w-5xl px-5 py-2.5 text-sm font-bold sm:px-8">
        <span aria-hidden="true">⚠ </span>
        {t("offlineNotice")}
      </p>
    </div>
  );
}
