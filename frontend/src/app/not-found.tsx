"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

import { PageContainer } from "@/components/page-container";

export default function NotFound() {
  const t = useTranslations();
  return (
    <main id="main-content" className="py-12 sm:py-16">
      <PageContainer>
        <section className="rounded-2xl border border-line bg-surface p-6 sm:p-8">
          <p className="text-sm font-bold tracking-[0.14em] text-brand uppercase">
            ClaimSaathi
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-[-0.03em] text-ink">
            {t("Errors.notFoundTitle")}
          </h1>
          <p className="mt-3 max-w-xl leading-7 text-muted">
            {t("Errors.notFoundCopy")}
          </p>
          <Link
            href="/"
            prefetch={false}
            className="mt-6 inline-flex min-h-12 items-center rounded-xl bg-brand px-5 py-3 font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-brand"
          >
            {t("Common.returnHome")}
          </Link>
        </section>
      </PageContainer>
    </main>
  );
}
