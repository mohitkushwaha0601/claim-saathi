import { useTranslations } from "next-intl";

import { Card, PrototypeBoundary } from "./ui";

const EPFO_UAN_MANUAL = "https://www.epfindia.gov.in/site_docs/PDFs/Circulars/Y2025-2026/MandatoryAllotment_ActivationOfUANThroughUMANGAPPUsingFAT.pdf";
const UIDAI_FACE_AUTH = "https://uidai.gov.in/en/contact-support/have-any-question/303-faqs/authentication.html";
const EPFO_MEMBER_PORTAL = "https://unifiedportal-mem.epfindia.gov.in/";

const OPTIONS = ["new", "existing", "activated"] as const;

export function UanExperience() {
  const t = useTranslations("UAN");

  return (
    <main id="main-content" className="pb-16 pt-10 sm:pb-24 sm:pt-14">
      <p className="text-sm font-bold tracking-[0.14em] text-brand uppercase">{t("eyebrow")}</p>
      <h1 className="mt-3 max-w-3xl text-4xl font-extrabold tracking-[-0.045em] text-ink sm:text-6xl">{t("title")}</h1>
      <p className="mt-4 max-w-2xl text-lg leading-8 text-muted">{t("intro")}</p>

      <PrototypeBoundary className="mt-8">{t("boundary")}</PrototypeBoundary>

      <section aria-labelledby="uan-options" className="mt-10">
        <div className="mb-4"><p className="text-xs font-bold tracking-[0.14em] text-brand uppercase">{t("optionsEyebrow")}</p><h2 id="uan-options" className="mt-2 text-2xl font-bold text-ink">{t("optionsTitle")}</h2></div>
        <div className="grid gap-4 lg:grid-cols-3">
          {OPTIONS.map((option) => <Card key={option} as="article" className="flex flex-col p-5"><h3 className="text-lg font-bold text-ink">{t(`options.${option}.title`)}</h3><p className="mt-2 flex-1 text-sm leading-6 text-muted">{t(`options.${option}.copy`)}</p>{option === "activated" ? <a href={EPFO_MEMBER_PORTAL} target="_blank" rel="noreferrer" className="mt-5 inline-flex font-semibold text-brand underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-brand">{t("memberPortal")}</a> : <a href={EPFO_UAN_MANUAL} target="_blank" rel="noreferrer" className="mt-5 inline-flex font-semibold text-brand underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-brand">{t("officialManual")}</a>}</Card>)}
        </div>
      </section>

      <section aria-labelledby="uan-safety" className="mt-10 rounded-2xl border border-line bg-surface p-5 sm:p-7">
        <h2 id="uan-safety" className="text-xl font-bold text-ink">{t("safetyTitle")}</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">{t("safetyCopy")}</p>
        <a href={UIDAI_FACE_AUTH} target="_blank" rel="noreferrer" className="mt-4 inline-flex font-semibold text-brand underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-brand">{t("faceAuthSource")}</a>
      </section>
    </main>
  );
}
