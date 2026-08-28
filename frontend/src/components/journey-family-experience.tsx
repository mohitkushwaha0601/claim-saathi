"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { ClaimSaathiApiError } from "@/lib/api/client";
import { listDemoPersonas } from "@/lib/api/demo";
import { createJourney } from "@/lib/api/journeys";
import {
  bindPersonasToIntents,
  type BoundIntent,
} from "@/lib/demo-intents";
import type { IntentGoal } from "@/lib/api/types";
import { validatePositiveIntegerRupees } from "@/lib/rupees";

import { ErrorState } from "./error-state";
import { LoadingState } from "./loading-state";
import { PrimaryButton } from "./primary-button";

type PageKind = "journey" | "help";

const GOAL_BY_SLUG: Record<string, IntentGoal> = {
  "partial-withdrawal": "ACCESS_SOME_PF_FUNDS",
  transfer: "TRANSFER_PF_AFTER_EMPLOYMENT_CHANGE",
  "final-settlement": "FINAL_PF_SETTLEMENT",
};

const COPY_BY_SLUG: Record<string, { kind: PageKind; titleKey: string; descriptionKey: string }> = {
  "partial-withdrawal": {
    kind: "journey",
    titleKey: "partialTitle",
    descriptionKey: "partialDescription",
  },
  transfer: { kind: "journey", titleKey: "transferTitle", descriptionKey: "transferDescription" },
  "final-settlement": {
    kind: "journey",
    titleKey: "settlementTitle",
    descriptionKey: "settlementDescription",
  },
  "claim-status": { kind: "help", titleKey: "claimStatusTitle", descriptionKey: "claimStatusDescription" },
  "account-recovery": { kind: "help", titleKey: "accountTitle", descriptionKey: "accountDescription" },
};

export function JourneyFamilyExperience({ slug }: { slug: string }) {
  const t = useTranslations("JourneyPages");
  const homeT = useTranslations("Home");
  const commonT = useTranslations("Common");
  const errorT = useTranslations("Errors");
  const router = useRouter();
  const page = COPY_BY_SLUG[slug];
  const [intent, setIntent] = useState<BoundIntent | null>(null);
  const [amount, setAmount] = useState("");
  const [amountError, setAmountError] = useState<string | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">(
    page?.kind === "journey" ? "loading" : "ready",
  );
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!page || page.kind === "help") return;
    const goal = GOAL_BY_SLUG[slug];
    let active = true;
    listDemoPersonas()
      .then((response) => {
        const match = bindPersonasToIntents(response.personas).find(
          (candidate) => candidate.goal === goal,
        );
        if (!match) throw new Error("Missing configured journey");
        if (active) {
          setIntent(match);
          setState("ready");
        }
      })
      .catch(() => {
        if (active) setState("error");
      });
    return () => {
      active = false;
    };
  }, [page, slug]);

  if (!page) return null;

  async function startJourney(requestedAmountRupees?: number) {
    if (!intent || busy) return;
    setBusy(true);
    try {
      const journey = await createJourney({
        persona_id: intent.persona.persona_id,
        goal: intent.goal,
        ...(requestedAmountRupees === undefined ? {} : { requested_amount_rupees: requestedAmountRupees }),
      });
      router.push(`/journey/${encodeURIComponent(journey.journey_instance_id)}`);
    } catch (error) {
      if (error instanceof ClaimSaathiApiError) setState("error");
      else setState("error");
      setBusy(false);
    }
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validation = validatePositiveIntegerRupees(amount);
    if (!validation.ok) {
      setAmountError(validation.reason === "required" ? homeT("amountRequired") : homeT("amountInvalid"));
      return;
    }
    setAmountError(null);
    void startJourney(validation.value);
  }

  return (
    <main id="main-content" className="pb-16 pt-10 sm:pb-24 sm:pt-14">
      <div className="mb-6 text-sm font-semibold text-muted">
        <Link href="/" className="text-brand underline-offset-4 hover:underline">{commonT("home")}</Link>
        <span aria-hidden="true" className="px-2">/</span>
        <span>{page.kind === "journey" ? commonT("startATask") : t("help")}</span>
      </div>
      <section className="max-w-3xl rounded-[14px] border border-line bg-surface p-6 sm:p-9">
        <p className="text-sm font-bold uppercase tracking-[0.14em] text-brand">{page.kind === "journey" ? t("journeyEyebrow") : t("helpEyebrow")}</p>
        <h1 className="mt-3 text-3xl font-extrabold tracking-[-0.04em] text-ink sm:text-5xl">{t(page.titleKey)}</h1>
        <p className="mt-4 text-lg leading-8 text-muted">{t(page.descriptionKey)}</p>

        {page.kind === "help" ? (
          <div className="mt-8 rounded-[10px] border border-line bg-canvas p-5">
            <h2 className="text-xl font-bold text-ink">{t("notConfiguredTitle")}</h2>
            <p className="mt-2 leading-7 text-muted">{t("notConfiguredCopy")}</p>
            <Link href="/how-it-works" className="mt-5 inline-flex min-h-11 items-center rounded-lg bg-brand px-4 font-semibold text-white hover:bg-brand-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand">{t("learnHow")}</Link>
          </div>
        ) : state === "loading" ? (
          <LoadingState message={t("loading")} />
        ) : state === "error" ? (
          <div className="mt-8"><ErrorState message={errorT("generic")} onRetry={() => window.location.reload()} /></div>
        ) : intent ? (
          <div className="mt-8">
            <div className="grid gap-3 sm:grid-cols-3">
              {[t("stepGoal"), t("stepChecks"), t("stepNext")].map((step, index) => (
                <div key={step} className="rounded-[10px] border border-line bg-canvas p-4">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-soft font-bold text-brand">{index + 1}</span>
                  <p className="mt-3 font-semibold text-ink">{step}</p>
                </div>
              ))}
            </div>
            <p className="mt-5 text-sm leading-6 text-muted">{t("journeyBoundary")}</p>
            {intent.requiresAmount ? (
              <form onSubmit={submit} className="mt-6 rounded-[10px] border border-brand/25 bg-brand-soft p-5" noValidate>
                <label htmlFor="journey-amount" className="block font-semibold text-ink">{homeT("amountLabel")}</label>
                <input id="journey-amount" value={amount} onChange={(event) => { setAmount(event.target.value); setAmountError(null); }} inputMode="numeric" placeholder="80,000" className="mt-2 min-h-12 w-full rounded-lg border border-line-strong bg-surface px-4 text-lg font-semibold text-ink outline-none focus-visible:outline-2 focus-visible:outline-brand" aria-invalid={amountError ? true : undefined} />
                {amountError ? <p role="alert" className="mt-2 text-sm font-semibold text-rust">{amountError}</p> : null}
                <PrimaryButton type="submit" className="mt-5">{busy ? t("starting") : t("start")}</PrimaryButton>
              </form>
            ) : (
              <PrimaryButton type="button" className="mt-6" onClick={() => void startJourney()}>{busy ? t("starting") : t("start")}</PrimaryButton>
            )}
          </div>
        ) : null}
      </section>
    </main>
  );
}
