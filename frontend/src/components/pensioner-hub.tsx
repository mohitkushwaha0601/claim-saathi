import { useTranslations } from "next-intl";

import { Card, PrototypeBoundary, StatusBadge } from "./ui";

const OVERVIEW_KEYS = ["pension", "ppo", "payment", "documents"] as const;
const SERVICE_KEYS = ["status", "ppo", "payment", "bank", "jeevan", "documents", "forms", "support"] as const;

export function PensionerHub() {
  const t = useTranslations("Pensioner");

  return (
    <main id="main-content" className="pb-16 pt-10 text-[1.05rem] sm:pb-24 sm:pt-14">
      <div className="mb-8"><p className="text-sm font-bold tracking-[0.14em] text-brand uppercase">{t("eyebrow")}</p><h1 className="mt-3 max-w-3xl text-4xl font-extrabold tracking-[-0.045em] text-ink sm:text-6xl">{t("title")}</h1><p className="mt-4 max-w-2xl text-lg leading-8 text-muted">{t("intro")}</p></div>
      <PrototypeBoundary className="mb-8">{t("boundary")}</PrototypeBoundary>

      <section aria-labelledby="pensioner-overview" className="mb-10">
        <div className="mb-4"><p className="text-xs font-bold tracking-[0.14em] text-brand uppercase">{t("overviewEyebrow")}</p><h2 id="pensioner-overview" className="mt-2 text-2xl font-bold text-ink">{t("overviewTitle")}</h2></div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{OVERVIEW_KEYS.map((key) => <Card key={key} className="p-5"><p className="text-base text-muted">{t(`overview.${key}.label`)}</p><p className="mt-2 text-lg font-bold text-ink">{t("notConnected")}</p><p className="mt-1 text-sm leading-6 text-muted">{t(`overview.${key}.detail`)}</p></Card>)}</div>
      </section>

      <section aria-labelledby="pensioner-services"><div className="mb-4"><p className="text-xs font-bold tracking-[0.14em] text-brand uppercase">{t("servicesEyebrow")}</p><h2 id="pensioner-services" className="mt-2 text-2xl font-bold text-ink">{t("servicesTitle")}</h2><p className="mt-2 text-base leading-7 text-muted">{t("servicesIntro")}</p></div><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{SERVICE_KEYS.map((key) => <Card key={key} className="p-5"><h3 className="text-lg font-bold text-ink">{t(`services.${key}.title`)}</h3><p className="mt-2 text-base leading-7 text-muted">{t(`services.${key}.copy`)}</p><StatusBadge tone="neutral" className="mt-4">{t("preview")}</StatusBadge></Card>)}</div></section>

      <section aria-labelledby="pensioner-support" className="mt-10 rounded-2xl border border-line bg-surface p-5 sm:p-7"><h2 id="pensioner-support" className="text-xl font-bold text-ink">{t("supportTitle")}</h2><p className="mt-2 max-w-2xl text-base leading-7 text-muted">{t("supportCopy")}</p></section>
    </main>
  );
}
