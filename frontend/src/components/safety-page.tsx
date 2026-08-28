"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

import { SafetyNotice } from "./safety-notice";

export function SafetyPage() {
  const t = useTranslations("Safety");
  return (
    <main id="main-content" className="pb-16 pt-10 sm:pb-24 sm:pt-14">
      <p className="text-sm font-bold tracking-[0.14em] text-brand uppercase">{t("label")}</p>
      <h1 className="mt-3 max-w-3xl text-4xl font-extrabold tracking-[-0.045em] text-ink sm:text-6xl">{t("pageTitle")}</h1>
      <p className="mt-4 max-w-2xl text-lg leading-8 text-muted">{t("pageIntro")}</p>
      <div className="mt-8"><SafetyNotice /></div>
      <Link href="/how-it-works" className="mt-6 inline-flex min-h-11 items-center font-semibold text-brand underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-brand">{t("howItWorks")}</Link>
    </main>
  );
}
