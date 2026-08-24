"use client";

import Link from "next/link";

import { ErrorState } from "@/components/error-state";
import { PageContainer } from "@/components/page-container";

export default function Error({
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <main id="main-content" className="py-12 sm:py-16">
      <PageContainer>
        <ErrorState
          title="We couldn't show this page"
          titleAsHeading
          message="The demo hit an unexpected problem. Your previous backend state has not been changed."
          onRetry={retry}
        />
        <Link
          href="/"
          className="mt-6 inline-flex min-h-11 items-center font-semibold text-brand underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-brand"
        >
          Return to ClaimSaathi
        </Link>
      </PageContainer>
    </main>
  );
}
