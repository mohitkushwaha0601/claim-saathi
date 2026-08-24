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
            <span className="mt-0.5 block max-w-56 text-xs leading-4 text-muted sm:max-w-none sm:text-sm">
              Understand your PF journey before entering the process.
            </span>
          </Link>
          <DemoBadge />
        </div>
      </PageContainer>
    </header>
  );
}
