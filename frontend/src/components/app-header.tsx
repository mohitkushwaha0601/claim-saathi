"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

import { AccessibilityToolbar } from "./accessibility-toolbar";
import { DemoBadge } from "./demo-badge";
import { PageContainer } from "./page-container";

export function AppHeader() {
  const t = useTranslations("Common");
  return (
    <>
      <a
        href="#main-content"
        className="fixed top-3 left-3 z-50 -translate-y-24 rounded-lg border-2 border-brand bg-surface px-4 py-3 font-semibold text-ink shadow-lg focus:translate-y-0"
      >
        {t("skipToContent")}
      </a>
      <header className="border-b border-line bg-surface">
        <PageContainer>
          <div className="flex min-h-20 flex-wrap items-center justify-between gap-3 py-3">
          <Link
            href="/"
            prefetch={false}
            className="group rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
          >
            <span className="block text-xl font-bold tracking-[-0.03em] text-ink sm:text-2xl">
              Claim<span className="text-brand">Saathi</span>
            </span>
            <span className="mt-0.5 hidden max-w-56 text-xs leading-4 text-muted sm:block sm:max-w-none sm:text-sm">
              {t("tagline")}
            </span>
          </Link>
          <div className="flex min-w-0 flex-wrap items-center justify-end gap-2 sm:gap-3">
            <Link
              href="/how-it-works"
              prefetch={false}
              aria-label={t("howItWorks")}
              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg px-2 text-sm font-semibold text-brand underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand sm:px-3"
            >
              <span aria-hidden="true" className="text-lg sm:hidden">?</span>
              <span className="hidden sm:inline">{t("howItWorks")}</span>
            </Link>
            <DemoBadge />
            <AccessibilityToolbar />
          </div>
          </div>
        </PageContainer>
      </header>
    </>
  );
}
