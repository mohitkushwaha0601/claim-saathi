"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

import { PageContainer } from "@/components/page-container";

export default function OfflinePage() {
  const t = useTranslations("Offline");
  return (
    <main id="main-content" className="py-12 sm:py-16">
      <PageContainer>
        <section className="rounded-3xl border-2 border-line-strong bg-surface p-6 sm:p-8">
          <p className="text-sm font-bold tracking-[0.14em] text-brand uppercase">
            {t("eyebrow")}
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-[-0.03em] text-ink">
            {t("title")}
          </h1>
          <p className="mt-4 max-w-2xl leading-7 text-muted">{t("copy")}</p>
          <p className="mt-4 max-w-2xl font-semibold leading-7 text-ink">
            {t("safety")}
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/"
              prefetch={false}
              className="inline-flex min-h-12 items-center justify-center rounded-xl bg-brand px-5 py-3 font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-brand"
            >
              {t("home")}
            </Link>
            <Link
              href="/how-it-works"
              prefetch={false}
              className="inline-flex min-h-12 items-center justify-center rounded-xl border border-line-strong bg-surface px-5 py-3 font-semibold text-ink focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-brand"
            >
              {t("explorer")}
            </Link>
          </div>
        </section>
      </PageContainer>
    </main>
  );
}
