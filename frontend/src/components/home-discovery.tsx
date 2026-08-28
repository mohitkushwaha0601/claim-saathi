"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import { searchServices, type ServiceRegistryItem } from "../lib/service-registry";
import { Card, SearchInput } from "./ui";

const ROLE_IDS = ["employee", "employer", "pensioner"] as const;
const ROLE_HREFS = { employee: "/employee", employer: "/employer", pensioner: "/pensioner" } as const;

export function HomeDiscovery() {
  const t = useTranslations("Home.discovery");
  const [query, setQuery] = useState("");
  const matches = useMemo(() => searchServices(query, (key) => t(key)), [query, t]);

  return (
    <section aria-labelledby="discovery-heading" className="mb-16 grid gap-8 sm:mb-20 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
      <div>
        <p className="text-sm font-bold tracking-[0.16em] text-brand uppercase">{t("eyebrow")}</p>
        <h1 id="discovery-heading" className="mt-3 max-w-3xl text-4xl font-bold tracking-[-0.045em] text-ink sm:text-6xl sm:leading-[1.05]">{t("title")}</h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-muted sm:text-lg">{t("intro")}</p>
        <div className="mt-7 max-w-2xl">
          <SearchInput label={t("searchLabel")} placeholder={t("searchPlaceholder")} value={query} onChange={(event) => setQuery(event.target.value)} />
          <div className="mt-3 flex flex-wrap gap-2" aria-label={t("examplesLabel")}>
            {(["withdrawExample", "balanceExample", "kycExample", "claimExample"] as const).map((key) => <button key={key} type="button" onClick={() => setQuery(t(`examples.${key}`))} className="rounded-full border border-line bg-surface px-3 py-1.5 text-sm text-muted transition hover:border-brand hover:text-brand focus-visible:outline-2 focus-visible:outline-brand">{t(`examples.${key}`)}</button>)}
          </div>
        </div>
        <div className="mt-6" aria-live="polite">
          {matches.length > 0 ? <div className="grid gap-3 sm:grid-cols-2">{matches.map((item) => <Card key={item.id} className="p-4">{item.href ? <Link href={item.href} prefetch={false} className="group block focus-visible:outline-2 focus-visible:outline-brand"><DiscoveryContent item={item} t={t} /></Link> : <DiscoveryContent item={item} t={t} />}</Card>)}</div> : <p className="rounded-xl border border-dashed border-line-strong bg-surface p-4 text-sm text-muted">{t("noResults")}</p>}
        </div>
      </div>
      <div className="grid gap-4">
        <div><p className="text-xs font-bold tracking-[0.14em] text-brand uppercase">{t("rolesEyebrow")}</p><h2 className="mt-2 text-2xl font-bold tracking-[-0.025em] text-ink">{t("rolesTitle")}</h2></div>
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">{ROLE_IDS.map((role) => <Link key={role} href={ROLE_HREFS[role]} prefetch={false} className="block rounded-[14px] focus-visible:outline-2 focus-visible:outline-brand"><Card className="h-full p-4 transition hover:border-brand hover:bg-brand-soft"><p className="font-bold text-ink">{t(`roles.${role}.title`)}</p><p className="mt-1 text-sm leading-6 text-muted">{t(`roles.${role}.copy`)}</p><span className="mt-3 inline-flex text-sm font-bold text-brand">{t("exploreRole")} →</span></Card></Link>)}</div>
      </div>
    </section>
  );
}

function DiscoveryContent({ item, t }: { item: ServiceRegistryItem; t: ReturnType<typeof useTranslations> }) {
  const descriptionKey = item.descriptionKey.includes(".") ? item.descriptionKey : `items.${item.descriptionKey}`;
  const ctaKey = item.id === "balance" ? "balanceCta" : item.id === "kyc" ? "kycCta" : null;
  return <><div className="flex items-start justify-between gap-3"><h2 className="font-bold text-ink group-hover:text-brand">{t(`items.${item.titleKey}.title`)}</h2>{item.availability === "INFORMATIONAL_PREVIEW" ? <span className="shrink-0 rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-muted">{t("preview")}</span> : <span aria-hidden="true" className="text-brand">→</span>}</div><p className="mt-1 text-sm leading-6 text-muted">{t(descriptionKey)}</p>{ctaKey ? <span className="mt-3 inline-flex text-sm font-bold text-brand">{t(ctaKey)}</span> : null}</>;
}
