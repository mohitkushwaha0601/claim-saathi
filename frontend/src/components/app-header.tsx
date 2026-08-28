"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

import { AccessibilityToolbar } from "./accessibility-toolbar";
import { DemoBadge } from "./demo-badge";
import { DemoProfileSelector } from "./demo-profile-selector";
import { JourneyModeToggle } from "./journey-mode-toggle";
import { PageContainer } from "./page-container";

export function AppHeader() {
  const t = useTranslations("Common");
  return (
    <>
      <a
        href="#main-content"
        className="fixed left-3 top-3 z-50 -translate-y-24 rounded-lg bg-ink px-4 py-3 font-semibold text-white focus:translate-y-0"
      >
        {t("skipToContent")}
      </a>
      <header className="border-b border-line bg-surface">
        <div className="bg-ink text-white">
          <PageContainer>
            <div className="flex min-h-9 items-center justify-between gap-3 text-xs font-semibold sm:text-sm">
              <span>{t("tagline")}</span>
              <span className="hidden text-white/75 sm:inline">{t("demo")}</span>
            </div>
          </PageContainer>
        </div>
        <PageContainer>
          <div className="flex flex-col gap-4 py-4 lg:py-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Link
                href="/"
                prefetch={false}
                className="group rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
              >
                <span className="block text-xl font-extrabold tracking-[-0.03em] text-ink sm:text-2xl">
                  Claim<span className="text-brand">Saathi</span>
                </span>
                <span className="mt-0.5 block max-w-72 text-xs leading-4 text-muted sm:text-sm">
                  {t("tagline")}
                </span>
              </Link>
              <div className="flex min-w-0 flex-wrap items-center justify-end gap-2 sm:gap-3">
                <DemoBadge />
                <DemoProfileSelector />
                <JourneyModeToggle />
                <AccessibilityToolbar />
              </div>
            </div>
            <nav
              aria-label={t("primaryNavigation")}
              className="flex flex-wrap items-center gap-2 border-t border-line pt-3"
            >
              <Link
                href="/#start-a-task"
                prefetch={false}
                className="inline-flex min-h-11 items-center justify-center rounded-lg bg-brand px-4 text-sm font-semibold text-white underline-offset-4 transition hover:bg-brand-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              >
                {t("startATask")}
              </Link>
              <Link
                href="/how-it-works"
                prefetch={false}
                className="inline-flex min-h-11 items-center justify-center rounded-lg border border-line bg-surface px-4 text-sm font-semibold text-ink underline-offset-4 transition hover:border-brand hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              >
                {t("howItWorks")}
              </Link>
              <Link
                href="/how-it-works#safe-stop"
                prefetch={false}
                className="inline-flex min-h-11 items-center justify-center rounded-lg border border-line bg-surface px-4 text-sm font-semibold text-ink underline-offset-4 transition hover:border-brand hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              >
                {t("safety")}
              </Link>
            </nav>
          </div>
        </PageContainer>
      </header>
      <div className="mobile-tab-bar" aria-label={t("primaryNavigation")}>
        <Link href="/" prefetch={false}>{t("home")}</Link>
        <Link href="/#start-a-task" prefetch={false}>{t("startATask")}</Link>
        <Link href="/how-it-works#safe-stop" prefetch={false}>{t("safety")}</Link>
      </div>
    </>
  );
}
