import Link from "next/link";

import { DemoBadge } from "./demo-badge";
import { PageContainer } from "./page-container";

export function AppHeader() {
  return (
    <header className="border-b border-line bg-surface">
      <PageContainer>
        <div className="flex min-h-20 items-center justify-between gap-4 py-3">
          <Link
            href="/"
            className="group rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
          >
            <span className="block text-xl font-bold tracking-[-0.03em] text-ink sm:text-2xl">
              Claim<span className="text-brand">Saathi</span>
            </span>
            <span className="mt-0.5 hidden max-w-56 text-xs leading-4 text-muted sm:block sm:max-w-none sm:text-sm">
              Understand your PF journey before entering the process.
            </span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-4">
            <Link
              href="/how-it-works"
              className="inline-flex min-h-11 items-center rounded-lg px-2 text-sm font-semibold text-brand underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand sm:px-3"
            >
              How it works
            </Link>
            <DemoBadge />
          </div>
        </div>
      </PageContainer>
    </header>
  );
}
