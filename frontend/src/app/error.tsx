"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

import { ErrorState } from "@/components/error-state";
import { PageContainer } from "@/components/page-container";

export default function Error({
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  const t = useTranslations();
  return (
    <main id="main-content" className="py-12 sm:py-16">
      <PageContainer>
        <ErrorState
          title={t("Errors.pageTitle")}
          titleAsHeading
          message={t("Errors.pageMessage")}
          onRetry={retry}
        />
        <Link
          href="/"
          prefetch={false}
          className="mt-6 inline-flex min-h-11 items-center font-semibold text-brand underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-brand"
        >
          {t("Common.returnHome")}
        </Link>
      </PageContainer>
    </main>
  );
}
