"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { useAppPreferences } from "./app-providers";
import { EmptyState, PrototypeBoundary, StatusBadge } from "./ui";
import { EPFO_MEMBER_PORTAL } from "./uan-experience";
import { completeDemoKyc, getKycProfile, validateDemoKyc, type DemoKycProfile, type KycDocument } from "@/lib/demo/kyc";

const DOCUMENTS: readonly KycDocument[] = ["AADHAAR", "PAN", "BANK", "NOMINATION"];

export function KycExperience() {
  const t = useTranslations("Kyc");
  const { demoPersonaId } = useAppPreferences();
  const [profile, setProfile] = useState<DemoKycProfile>(() => getKycProfile(demoPersonaId));
  const [selectedDocument, setSelectedDocument] = useState<KycDocument>("PAN");
  const [stage, setStage] = useState<"choose" | "review" | "success" | "failure">("choose");

  useEffect(() => {
    setProfile(getKycProfile(demoPersonaId));
    setSelectedDocument("PAN");
    setStage("choose");
  }, [demoPersonaId]);

  const record = profile.records.find((item) => item.document === selectedDocument);
  if (!record) return <EmptyState title={t("emptyTitle")}>{t("emptyCopy")}</EmptyState>;

  function selectDocument(document: KycDocument) {
    setSelectedDocument(document);
    setStage("choose");
  }

  function validate() {
    setStage(validateDemoKyc(record!).ok ? "review" : "failure");
  }

  function submitDemo() {
    setProfile((current) => completeDemoKyc(current, selectedDocument));
    setStage("success");
  }

  return (
    <main id="main-content" className="pb-16 pt-10 sm:pb-24 sm:pt-14">
      <div className="mb-6 text-sm font-semibold text-muted"><a href="/" className="text-brand underline-offset-4 hover:underline">{t("home")}</a><span aria-hidden="true" className="px-2">/</span><span>{t("title")}</span></div>
      <section className="rounded-[14px] border border-line bg-surface p-5 sm:p-8">
        <p className="text-sm font-bold tracking-[0.14em] text-brand uppercase">{t("eyebrow")}</p>
        <h1 className="mt-3 text-3xl font-extrabold tracking-[-0.04em] text-ink sm:text-5xl">{t("title")}</h1>
        <p className="mt-4 max-w-3xl text-lg leading-8 text-muted">{t("intro")}</p>
        <PrototypeBoundary className="mt-6">{t("syntheticBoundary")}</PrototypeBoundary>

        <section className="mt-8" aria-labelledby="kyc-overview-heading"><h2 id="kyc-overview-heading" className="text-2xl font-bold text-ink">{t("overviewTitle", { name: profile.displayName })}</h2><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{DOCUMENTS.map((document) => { const item = profile.records.find((candidate) => candidate.document === document)!; return <button key={document} type="button" onClick={() => selectDocument(document)} className={`rounded-xl border p-4 text-left transition focus-visible:outline-2 focus-visible:outline-brand ${selectedDocument === document ? "border-brand bg-brand-soft" : "border-line bg-surface hover:border-brand"}`}><div className="flex items-start justify-between gap-2"><span className="font-bold text-ink">{t(`documents.${document}.title`)}</span><StatusBadge tone={item.status === "VERIFIED" ? "success" : item.status === "ACTION_REQUIRED" ? "warning" : "neutral"}>{t(`statuses.${item.status}`)}</StatusBadge></div><p className="mt-2 text-sm leading-6 text-muted">{item.syntheticValue}</p></button>; })}</div></section>

        <section className="mt-8" aria-labelledby="kyc-process-heading"><h2 id="kyc-process-heading" className="text-2xl font-bold text-ink">{t("processTitle")}</h2><ol className="mt-4 grid gap-2 sm:grid-cols-5">{(["choose", "enter", "verify", "validation", "updated"] as const).map((step, index) => <li key={step} className={`rounded-xl border p-3 text-sm font-semibold ${stage === "success" && index === 4 ? "border-emerald-300 bg-emerald-50" : index === 0 ? "border-brand bg-brand-soft" : "border-line bg-canvas"}`}><span className="text-brand">{index + 1}.</span> {t(`process.${step}`)}</li>)}</ol></section>

        <section className="mt-8 rounded-2xl border border-line bg-canvas p-5" aria-labelledby="kyc-selected-heading"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-bold tracking-[0.14em] text-brand uppercase">{t("selectedEyebrow")}</p><h2 id="kyc-selected-heading" className="mt-2 text-2xl font-bold text-ink">{t(`documents.${record.document}.title`)}</h2></div><StatusBadge tone={record.status === "VERIFIED" ? "success" : record.status === "ACTION_REQUIRED" ? "warning" : "neutral"}>{t(`statuses.${record.status}`)}</StatusBadge></div><p className="mt-3 text-sm leading-6 text-muted">{t(`documents.${record.document}.requirements`)}</p><p className="prototype-surface mt-3 rounded-xl border border-gold/60 p-3 text-sm font-semibold text-ink">{t("generalGuidance")}</p><div className="mt-5 rounded-xl border border-line bg-surface p-4"><p className="text-xs font-bold tracking-[0.1em] text-muted uppercase">{t("syntheticDetails")}</p><p className="mt-2 data-number font-semibold text-ink">{record.syntheticValue}</p><p className="mt-2 text-sm text-muted">{t("noRealDetails")}</p></div>{stage === "choose" ? <button type="button" onClick={validate} className="mt-5 min-h-11 rounded-lg bg-brand px-4 font-semibold text-white hover:bg-brand-strong">{t("validate")}</button> : null}{stage === "failure" ? <div role="alert" className="error-surface mt-5 rounded-xl border border-rust/40 p-4 text-rust"><p className="font-semibold">{t("failureTitle")}</p><p className="mt-1 text-sm">{t("failureCopy")}</p></div> : null}{stage === "review" ? <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4"><p className="font-bold text-emerald-950">{t("reviewTitle")}</p><ul className="mt-3 grid gap-2 text-sm text-emerald-950"><li>✓ {t("checks.format")}</li><li>✓ {t("checks.required")}</li><li>✓ {t("checks.demo")}</li></ul><button type="button" onClick={submitDemo} className="mt-5 min-h-11 rounded-lg bg-brand px-4 font-semibold text-white hover:bg-brand-strong">{t("submit")}</button></div> : null}{stage === "success" ? <div role="status" className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-950"><p className="font-bold">{t("successTitle")}</p><p className="mt-1 text-sm">{t("successCopy")}</p><p className="mt-3 text-sm font-semibold">{t("historyUpdated")}</p></div> : null}</section>
        {stage === "success" ? <div className="mt-6 rounded-xl border border-line bg-canvas p-4"><p className="text-sm leading-6 text-muted">{t("officialHandoffCopy")}</p><a href={EPFO_MEMBER_PORTAL} target="_blank" rel="noreferrer" className="mt-3 inline-flex min-h-11 items-center font-semibold text-brand underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-brand">{t("officialHandoff")}</a></div> : null}
      </section>
    </main>
  );
}
