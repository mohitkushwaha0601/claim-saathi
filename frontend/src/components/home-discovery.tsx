"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import { searchServices, type ServiceRegistryItem } from "../lib/service-registry";
import { Card, SearchInput } from "./ui";

const ROLE_IDS = ["employee", "employer", "pensioner"] as const;
const ROLE_HREFS = { employee: "/employee", employer: "/employer", pensioner: "/pensioner" } as const;
const SERVICE_ICONS: Record<string, string> = { balance: "₿", withdraw: "↘", transfer: "⇄", kyc: "✓", "claim-status": "↻", uan: "#" };

export function HomeDiscovery() {
  const t = useTranslations("Home.discovery");
  const [query, setQuery] = useState("");
  const matches = useMemo(() => searchServices(query, (key) => t(key)), [query, t]);

  return (
    <>
      <section aria-labelledby="discovery-heading" className="mb-12 rounded-[18px] bg-deep p-5 sm:mb-16 sm:p-8 lg:p-10">
        <div>
          <p className="text-sm font-bold tracking-[0.16em] text-gold uppercase">{t("eyebrow")}</p>
          <h1 id="discovery-heading" className="mt-3 max-w-3xl text-4xl font-bold tracking-[-0.045em] text-white sm:text-6xl sm:leading-[1.05]">{t("title")}</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-white/80 sm:text-lg">{t("intro")}</p>
          <div className="mt-7 max-w-2xl">
            <SearchInput label={t("searchLabel")} placeholder={t("searchPlaceholder")} value={query} onChange={(event) => setQuery(event.target.value)} />
            <div className="mt-3 flex flex-wrap gap-2" aria-label={t("examplesLabel")}>
              {(["withdrawExample", "balanceExample", "kycExample", "claimExample"] as const).map((key) => <button key={key} type="button" onClick={() => setQuery(t(`examples.${key}`))} className="rounded-full border border-white/30 bg-white/10 px-3 py-1.5 text-sm text-white transition hover:border-gold hover:text-gold focus-visible:outline-2 focus-visible:outline-gold">{t(`examples.${key}`)}</button>)}
            </div>
          </div>
          <div className="mt-6" aria-live="polite">
            <h2 className="mb-3 text-xl font-bold text-white">{t("popularTitle")}</h2>
            {matches.length > 0 ? <div className="grid gap-3 sm:grid-cols-2">{matches.map((item) => <Card key={item.id} className="p-4">{item.href ? <Link href={item.href} prefetch={false} className="group block focus-visible:outline-2 focus-visible:outline-brand"><DiscoveryContent item={item} t={t} /></Link> : <DiscoveryContent item={item} t={t} />}</Card>)}</div> : <p className="rounded-xl border border-dashed border-line-strong bg-surface p-4 text-sm text-muted">{t("noResults")}</p>}
          </div>
        </div>
      </section>

      <section aria-labelledby="perspective-heading" className="mb-12 sm:mb-16">
        <div className="mb-4">
          <p className="text-xs font-bold tracking-[0.14em] text-brand uppercase">{t("rolesEyebrow")}</p>
          <h2 id="perspective-heading" className="mt-2 text-2xl font-bold tracking-[-0.025em] text-ink">{t("rolesTitle")}</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {ROLE_IDS.map((role) => <Link key={role} href={ROLE_HREFS[role]} prefetch={false} className="block rounded-[14px] focus-visible:outline-2 focus-visible:outline-brand"><Card className="h-full p-4 transition hover:border-brand hover:bg-brand-soft"><p className="font-bold text-ink">{t(`roles.${role}.title`)}</p><p className="mt-1 text-sm leading-6 text-muted">{t(`roles.${role}.copy`)}</p><span className="mt-3 inline-flex text-sm font-bold text-brand">{t("exploreRole")} →</span></Card></Link>)}
        </div>
      </section>
    </>
  );
}

function DiscoveryContent({ item, t }: { item: ServiceRegistryItem; t: ReturnType<typeof useTranslations> }) {
  const descriptionKey = item.descriptionKey.includes(".") ? item.descriptionKey : `items.${item.descriptionKey}`;
  const ctaKey = item.id === "balance" ? "balanceCta" : item.id === "kyc" ? "kycCta" : null;
  return <><div className="flex min-w-0 items-start justify-between gap-3"><div className="flex min-w-0 flex-1 items-start gap-3"><span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-lg font-bold text-brand">{SERVICE_ICONS[item.id] ?? "•"}</span><h2 className="min-w-0 flex-1 pt-1 font-bold text-ink [overflow-wrap:normal] group-hover:text-brand">{t(`items.${item.titleKey}.title`)}</h2></div><span aria-hidden="true" className="shrink-0 text-brand">→</span></div><p className="mt-2 text-sm leading-6 text-muted">{t(descriptionKey)}</p>{ctaKey ? <span className="mt-3 inline-flex text-sm font-bold text-brand">{t(ctaKey)}</span> : null}</>;
}
