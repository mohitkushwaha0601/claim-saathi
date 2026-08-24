"use client";

import { useTranslations } from "next-intl";

export function DemoBadge() {
  const t = useTranslations("Common");
  return (
    <span className="hidden min-h-7 items-center rounded-full border border-amber-300 bg-amber-50 px-3 text-xs font-bold tracking-[0.12em] text-amber-900 uppercase min-[420px]:inline-flex">
      {t("demo")}
    </span>
  );
}
