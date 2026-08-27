"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

import { PageContainer } from "./page-container";

export function AppFooter() {
  const common = useTranslations("Common");
  const safety = useTranslations("Safety");
  return (
    <footer className="border-t border-line bg-ink text-white">
      <PageContainer>
        <div className="grid gap-8 py-10 lg:grid-cols-[1.3fr_0.85fr_0.85fr]">
          <div>
            <p className="text-xs font-bold tracking-[0.16em] text-white/65 uppercase">
              ClaimSaathi
            </p>
            <p className="mt-3 max-w-xl text-base leading-7 text-white/85">
              {common("footer")}
            </p>
            <p className="mt-4 text-sm leading-6 text-white/70">
              {safety("copy")}
            </p>
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-[0.1em] text-white/75 uppercase">
              {common("primaryNavigation")}
            </h2>
            <ul className="mt-4 grid gap-3 text-sm font-semibold">
              <li>
                <Link className="text-white/90 underline-offset-4 hover:underline" href="/#start-a-task" prefetch={false}>
                  {common("startATask")}
                </Link>
              </li>
              <li>
                <Link className="text-white/90 underline-offset-4 hover:underline" href="/how-it-works" prefetch={false}>
                  {common("howItWorks")}
                </Link>
              </li>
              <li>
                <Link className="text-white/90 underline-offset-4 hover:underline" href="/how-it-works#safe-stop" prefetch={false}>
                  {common("safety")}
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-[0.1em] text-white/75 uppercase">
              {safety("label")}
            </h2>
            <p className="mt-4 text-sm leading-6 text-white/80">
              {safety("copy")}
            </p>
          </div>
        </div>
        <div className="border-t border-white/15 py-4 text-xs leading-5 text-white/55">
          {common("demoBoundary")}
        </div>
      </PageContainer>
    </footer>
  );
}
