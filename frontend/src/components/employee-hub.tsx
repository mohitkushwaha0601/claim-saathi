import Link from "next/link";
import { useTranslations } from "next-intl";

import { SERVICE_REGISTRY } from "@/lib/service-registry";

import { Card, PrototypeBoundary, StatusBadge } from "./ui";

const OVERVIEW_KEYS = ["uan", "employer", "balance", "kyc"] as const;
const ATTENTION_KEYS = ["nomination", "kyc", "claim"] as const;
const CATEGORY_KEYS = ["money", "profile", "claims", "employment"] as const;

const CATALOGUE: Record<(typeof CATEGORY_KEYS)[number], readonly string[]> = {
  money: ["withdraw", "transfer", "balance", "passbook"],
  profile: ["kyc", "personal", "nomination", "uan"],
  claims: ["submitClaim", "claim", "claimHistory"],
  employment: ["currentEmployment", "previousEmployers", "memberIds"],
};

const ROUTES: Record<string, string> = {};
for (const item of SERVICE_REGISTRY) {
  if ("href" in item) ROUTES[item.id] = item.href;
}
ROUTES.claim = ROUTES["claim-status"] ?? "";

export function EmployeeHub() {
  const t = useTranslations("Employee");

  return (
    <main id="main-content" className="pb-16 pt-10 sm:pb-24 sm:pt-14">
      <div className="mb-8">
        <p className="text-sm font-bold tracking-[0.14em] text-brand uppercase">{t("eyebrow")}</p>
        <h1 className="mt-3 max-w-3xl text-4xl font-extrabold tracking-[-0.045em] text-ink sm:text-6xl">{t("title")}</h1>
        <p className="mt-4 max-w-2xl text-lg leading-8 text-muted">{t("intro")}</p>
      </div>

      <PrototypeBoundary className="mb-8">{t("boundary")}</PrototypeBoundary>

      <section aria-labelledby="employee-overview" className="mb-10">
        <div className="mb-4"><p className="text-xs font-bold tracking-[0.14em] text-brand uppercase">{t("overviewEyebrow")}</p><h2 id="employee-overview" className="mt-2 text-2xl font-bold text-ink">{t("overviewTitle")}</h2></div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {OVERVIEW_KEYS.map((key) => <Card key={key} className="p-4"><p className="text-sm text-muted">{t(`overview.${key}.label`)}</p><p className="mt-2 font-bold text-ink">{t("notConnected")}</p><p className="mt-1 text-xs leading-5 text-muted">{t(`overview.${key}.detail`)}</p></Card>)}
        </div>
      </section>

      <section aria-labelledby="employee-quick-actions" className="mb-10">
        <div className="mb-4"><p className="text-xs font-bold tracking-[0.14em] text-brand uppercase">{t("quickEyebrow")}</p><h2 id="employee-quick-actions" className="mt-2 text-2xl font-bold text-ink">{t("quickTitle")}</h2></div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {["withdraw", "balance", "claim", "transfer", "kyc", "uan"].map((key) => <ServiceEntry key={key} id={key} t={t} />)}
        </div>
      </section>

      <section aria-labelledby="employee-attention" className="mb-10">
        <div className="mb-4"><p className="text-xs font-bold tracking-[0.14em] text-brand uppercase">{t("attentionEyebrow")}</p><h2 id="employee-attention" className="mt-2 text-2xl font-bold text-ink">{t("attentionTitle")}</h2><p className="mt-2 text-sm leading-6 text-muted">{t("attentionIntro")}</p></div>
        <div className="grid gap-3 lg:grid-cols-3">
          {ATTENTION_KEYS.map((key) => <Card key={key} className="p-4"><div className="flex items-start justify-between gap-3"><h3 className="font-bold text-ink">{t(`attention.${key}.title`)}</h3><StatusBadge tone="neutral">{t("exampleState")}</StatusBadge></div><p className="mt-2 text-sm leading-6 text-muted">{t(`attention.${key}.copy`)}</p>{key === "claim" ? <Link href={ROUTES.claim} className="mt-4 inline-flex font-semibold text-brand underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-brand">{t("openPreview")}</Link> : null}</Card>)}
        </div>
      </section>

      <section aria-labelledby="employee-catalogue">
        <div className="mb-4"><p className="text-xs font-bold tracking-[0.14em] text-brand uppercase">{t("catalogueEyebrow")}</p><h2 id="employee-catalogue" className="mt-2 text-2xl font-bold text-ink">{t("catalogueTitle")}</h2></div>
        <div className="grid gap-5 lg:grid-cols-2">
          {CATEGORY_KEYS.map((category) => <Card key={category} as="section" className="p-5"><h3 className="text-lg font-bold text-ink">{t(`categories.${category}.title`)}</h3><div className="mt-4 grid gap-2">{CATALOGUE[category].map((id) => <ServiceEntry key={id} id={id} t={t} compact />)}</div></Card>)}
        </div>
      </section>
    </main>
  );
}

function ServiceEntry({ id, t, compact = false }: { id: string; t: ReturnType<typeof useTranslations>; compact?: boolean }) {
  const content = <><span className="block font-semibold text-ink">{t(`services.${id}.title`)}</span><span className="mt-1 block text-sm leading-6 text-muted">{t(`services.${id}.copy`)}</span></>;
  const className = compact ? "block rounded-xl border border-line p-3 hover:border-brand focus-visible:outline-2 focus-visible:outline-brand" : "block rounded-2xl border border-line bg-surface p-5 hover:border-brand hover:bg-brand-soft focus-visible:outline-2 focus-visible:outline-brand";
  return ROUTES[id] ? <Link href={ROUTES[id]} prefetch={false} className={className}>{content}</Link> : <div className={className}>{content}<span className="mt-2 inline-flex rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-muted">{t("preview")}</span></div>;
}
