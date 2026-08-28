import { useTranslations } from "next-intl";

import { Card, PrototypeBoundary, StatusBadge } from "./ui";

const OVERVIEW_KEYS = ["establishment", "employees", "cycle", "ecr"] as const;
const ATTENTION_KEYS = ["ecr", "employees", "establishment"] as const;
const CATEGORY_KEYS = ["establishment", "employees", "contributions", "resources"] as const;

const CATALOGUE: Record<(typeof CATEGORY_KEYS)[number], readonly string[]> = {
  establishment: ["register", "update", "forms"],
  employees: ["manageEmployees", "manageUan", "employeeRecords"],
  contributions: ["fileEcr", "makeContribution", "contributionCycle"],
  resources: ["forms", "circulars", "support"],
};

export function EmployerHub() {
  const t = useTranslations("Employer");

  return (
    <main id="main-content" className="pb-16 pt-10 sm:pb-24 sm:pt-14">
      <div className="mb-8"><p className="text-sm font-bold tracking-[0.14em] text-brand uppercase">{t("eyebrow")}</p><h1 className="mt-3 max-w-3xl text-4xl font-extrabold tracking-[-0.045em] text-ink sm:text-6xl">{t("title")}</h1><p className="mt-4 max-w-2xl text-lg leading-8 text-muted">{t("intro")}</p></div>
      <PrototypeBoundary className="mb-8">{t("boundary")}</PrototypeBoundary>

      <section aria-labelledby="employer-overview" className="mb-10">
        <div className="mb-4"><p className="text-xs font-bold tracking-[0.14em] text-brand uppercase">{t("overviewEyebrow")}</p><h2 id="employer-overview" className="mt-2 text-2xl font-bold text-ink">{t("overviewTitle")}</h2></div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{OVERVIEW_KEYS.map((key) => <Card key={key} className="p-4"><p className="text-sm text-muted">{t(`overview.${key}.label`)}</p><p className="mt-2 font-bold text-ink">{t("notConnected")}</p><p className="mt-1 text-xs leading-5 text-muted">{t(`overview.${key}.detail`)}</p></Card>)}</div>
      </section>

      <section aria-labelledby="employer-attention" className="mb-10">
        <div className="mb-4"><p className="text-xs font-bold tracking-[0.14em] text-brand uppercase">{t("attentionEyebrow")}</p><h2 id="employer-attention" className="mt-2 text-2xl font-bold text-ink">{t("attentionTitle")}</h2><p className="mt-2 text-sm leading-6 text-muted">{t("attentionIntro")}</p></div>
        <div className="grid gap-3 lg:grid-cols-3">{ATTENTION_KEYS.map((key) => <Card key={key} className="p-4"><div className="flex items-start justify-between gap-3"><h3 className="font-bold text-ink">{t(`attention.${key}.title`)}</h3><StatusBadge tone="neutral">{t("exampleState")}</StatusBadge></div><p className="mt-2 text-sm leading-6 text-muted">{t(`attention.${key}.copy`)}</p></Card>)}</div>
      </section>

      <section aria-labelledby="employer-catalogue"><div className="mb-4"><p className="text-xs font-bold tracking-[0.14em] text-brand uppercase">{t("catalogueEyebrow")}</p><h2 id="employer-catalogue" className="mt-2 text-2xl font-bold text-ink">{t("catalogueTitle")}</h2></div><div className="grid gap-5 lg:grid-cols-2">{CATEGORY_KEYS.map((category) => <Card key={category} as="section" className="p-5"><h3 className="text-lg font-bold text-ink">{t(`categories.${category}.title`)}</h3><div className="mt-4 grid gap-2">{CATALOGUE[category].map((id) => <div key={id} className="rounded-xl border border-line p-3"><p className="font-semibold text-ink">{t(`services.${id}.title`)}</p><p className="mt-1 text-sm leading-6 text-muted">{t(`services.${id}.copy`)}</p><span className="mt-2 inline-flex rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-muted">{t("preview")}</span></div>)}</div></Card>)}</div></section>
    </main>
  );
}
