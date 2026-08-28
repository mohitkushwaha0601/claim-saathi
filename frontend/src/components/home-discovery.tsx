"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import { Card, SearchInput } from "./ui";

type DiscoveryItem = {
  id: string;
  href?: string;
  keywords: string[];
  titleKey: string;
  descriptionKey: string;
  statusKey?: string;
};

const DISCOVERY_ITEMS: DiscoveryItem[] = [
  { id: "balance", keywords: ["balance", "passbook", "account"], titleKey: "balance", descriptionKey: "balanceCopy", statusKey: "preview" },
  { id: "withdraw", href: "/services/partial-withdrawal", keywords: ["withdraw", "money", "funds", "access"], titleKey: "withdraw", descriptionKey: "withdrawCopy" },
  { id: "transfer", href: "/services/transfer", keywords: ["transfer", "old company", "changed jobs", "move"], titleKey: "transfer", descriptionKey: "transferCopy" },
  { id: "kyc", keywords: ["kyc", "aadhaar", "pan", "bank"], titleKey: "kyc", descriptionKey: "kycCopy", statusKey: "preview" },
  { id: "claim-status", href: "/services/claim-status", keywords: ["claim", "track", "status", "submitted"], titleKey: "claimStatus", descriptionKey: "claimStatusCopy" },
  { id: "uan", keywords: ["uan", "find uan", "activate"], titleKey: "uan", descriptionKey: "uanCopy", statusKey: "preview" },
  { id: "nomination", keywords: ["nomination", "nominee"], titleKey: "nomination", descriptionKey: "nominationCopy", statusKey: "preview" },
  { id: "settlement", href: "/services/final-settlement", keywords: ["settlement", "left job", "final"], titleKey: "settlement", descriptionKey: "settlementCopy" },
];

const ROLE_IDS = ["employee", "employer", "pensioner"] as const;

export function HomeDiscovery() {
  const t = useTranslations("Home.discovery");
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLowerCase();
  const matches = useMemo(() => {
    if (!normalizedQuery) return DISCOVERY_ITEMS.slice(0, 4);
    const queryTokens = normalizedQuery.split(/\s+/).filter(Boolean);
    return DISCOVERY_ITEMS.filter((item) =>
      queryTokens.every((token) =>
        [t(`items.${item.titleKey}.title`), t(`items.${item.descriptionKey}`), ...item.keywords]
          .join(" ")
          .toLowerCase()
          .includes(token),
      ),
    ).slice(0, 5);
  }, [normalizedQuery, t]);

  return (
    <section aria-labelledby="discovery-heading" className="mb-16 grid gap-8 sm:mb-20 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
      <div>
        <p className="text-sm font-bold tracking-[0.16em] text-brand uppercase">{t("eyebrow")}</p>
        <h1 id="discovery-heading" className="mt-3 max-w-3xl text-4xl font-bold tracking-[-0.045em] text-ink sm:text-6xl sm:leading-[1.05]">{t("title")}</h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-muted sm:text-lg">{t("intro")}</p>
        <div className="mt-7 max-w-2xl">
          <SearchInput label={t("searchLabel")} placeholder={t("searchPlaceholder")} value={query} onChange={(event) => setQuery(event.target.value)} />
          <div className="mt-3 flex flex-wrap gap-2" aria-label={t("examplesLabel")}>
            {(["withdrawExample", "balanceExample", "kycExample", "claimExample"] as const).map((key) => (
              <button key={key} type="button" onClick={() => setQuery(t(`examples.${key}`))} className="rounded-full border border-line bg-surface px-3 py-1.5 text-sm text-muted transition hover:border-brand hover:text-brand focus-visible:outline-2 focus-visible:outline-brand">{t(`examples.${key}`)}</button>
            ))}
          </div>
        </div>
        <div className="mt-6" aria-live="polite">
          {matches.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {matches.map((item) => (
                <Card key={item.id} className="p-4">
                  {item.href ? (
                    <Link href={item.href} prefetch={false} className="group block focus-visible:outline-2 focus-visible:outline-brand">
                      <DiscoveryContent item={item} t={t} />
                    </Link>
                  ) : <DiscoveryContent item={item} t={t} />}
                </Card>
              ))}
            </div>
          ) : <p className="rounded-xl border border-dashed border-line-strong bg-surface p-4 text-sm text-muted">{t("noResults")}</p>}
        </div>
      </div>
      <div className="grid gap-4">
        <div>
          <p className="text-xs font-bold tracking-[0.14em] text-brand uppercase">{t("rolesEyebrow")}</p>
          <h2 className="mt-2 text-2xl font-bold tracking-[-0.025em] text-ink">{t("rolesTitle")}</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
          {ROLE_IDS.map((role) => <Card key={role} className="p-4"><p className="font-bold text-ink">{t(`roles.${role}.title`)}</p><p className="mt-1 text-sm leading-6 text-muted">{t(`roles.${role}.copy`)}</p></Card>)}
        </div>
        <div className="mt-2">
          <p className="text-xs font-bold tracking-[0.14em] text-brand uppercase">{t("updatesEyebrow")}</p>
          <div className="mt-3 grid gap-3">
            {(["boundary", "uncertainty"] as const).map((key) => <Card key={key} className="p-4"><p className="font-bold text-ink">{t(`updates.${key}.title`)}</p><p className="mt-1 text-sm leading-6 text-muted">{t(`updates.${key}.copy`)}</p></Card>)}
          </div>
        </div>
      </div>
    </section>
  );
}

function DiscoveryContent({ item, t }: { item: DiscoveryItem; t: ReturnType<typeof useTranslations> }) {
  return <><div className="flex items-start justify-between gap-3"><h2 className="font-bold text-ink group-hover:text-brand">{t(`items.${item.titleKey}.title`)}</h2>{item.statusKey ? <span className="shrink-0 rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-muted">{t(item.statusKey)}</span> : <span aria-hidden="true" className="text-brand">→</span>}</div><p className="mt-1 text-sm leading-6 text-muted">{t(`items.${item.descriptionKey}`)}</p></>;
}
