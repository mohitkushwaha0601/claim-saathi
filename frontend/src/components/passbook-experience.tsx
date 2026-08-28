"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";

import { useAppPreferences } from "./app-providers";
import { SafetyNotice } from "./safety-notice";
import { Drawer, EmptyState, Modal, PrototypeBoundary, StatusBadge } from "./ui";
import {
  DEFAULT_PASSBOOK_FILTERS,
  filterPassbookTransactions,
  getPassbookAccount,
  type PassbookFilters,
  type PassbookTransaction,
  type PassbookTransactionType,
  summarizePassbook,
} from "@/lib/demo/passbook";

const RANGE_KEYS = ["LAST_3_MONTHS", "LAST_6_MONTHS", "CURRENT_FY", "PREVIOUS_FY", "CUSTOM"] as const;
const TYPE_KEYS: readonly (PassbookTransactionType | "ALL")[] = ["ALL", "EMPLOYEE_CONTRIBUTION", "EMPLOYER_CONTRIBUTION", "INTEREST", "TRANSFER", "WITHDRAWAL", "ADJUSTMENT"];

function rupees(value: number): string {
  return `₹${new Intl.NumberFormat("en-IN").format(value)}`;
}

export function PassbookExperience() {
  const t = useTranslations("Passbook");
  const { demoPersonaId } = useAppPreferences();
  const account = getPassbookAccount(demoPersonaId);
  const [filters, setFilters] = useState<PassbookFilters>(DEFAULT_PASSBOOK_FILTERS);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selected, setSelected] = useState<PassbookTransaction | null>(null);
  const transactions = useMemo(() => filterPassbookTransactions(account, filters), [account, filters]);
  const summary = useMemo(() => summarizePassbook(account, transactions), [account, transactions]);
  const employers = [...new Set(account.transactions.map((transaction) => transaction.employer))];
  const memberIds = [...new Set(account.transactions.map((transaction) => transaction.memberId))];

  function updateFilter<K extends keyof PassbookFilters>(key: K, value: PassbookFilters[K]) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  function clearFilters() {
    setFilters(DEFAULT_PASSBOOK_FILTERS);
    setFiltersOpen(false);
  }

  return (
    <main id="main-content" className="pb-16 pt-10 sm:pb-24 sm:pt-14">
      <div className="mb-6 text-sm font-semibold text-muted"><Link href="/" className="text-brand underline-offset-4 hover:underline">{t("home")}</Link><span aria-hidden="true" className="px-2">/</span><span>{t("title")}</span></div>
      <section className="rounded-[14px] border border-line bg-surface p-5 sm:p-8">
        <p className="text-sm font-bold tracking-[0.14em] text-brand uppercase">{t("eyebrow")}</p>
        <h1 className="mt-3 text-3xl font-extrabold tracking-[-0.04em] text-ink sm:text-5xl">{t("title")}</h1>
        <p className="mt-4 max-w-3xl text-lg leading-8 text-muted">{t("intro")}</p>
        <PrototypeBoundary className="mt-6">{t("syntheticBoundary")}</PrototypeBoundary>

        <section className="mt-8 rounded-2xl bg-ink p-5 text-white sm:p-7" aria-labelledby="passbook-account-heading">
          <p className="text-xs font-bold tracking-[0.14em] text-gold-soft uppercase">{t("accountEyebrow")}</p>
          <h2 id="passbook-account-heading" className="mt-2 text-2xl font-bold">{account.displayName} · {t("syntheticAccount")}</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label={t("balance")} value={rupees(account.transactions.at(-1)?.balance ?? 0)} dark />
            <Stat label={t("currentEmployer")} value={account.currentEmployer} dark />
            <Stat label={t("memberId")} value={account.memberId} dark mono />
            <Stat label={t("lastContribution")} value={account.lastContribution} dark mono />
          </div>
        </section>

        <section className="mt-8" aria-labelledby="passbook-filters-heading">
          <div className="flex items-center justify-between gap-3"><h2 id="passbook-filters-heading" className="text-2xl font-bold text-ink">{t("filtersTitle")}</h2><button type="button" className="min-h-11 rounded-lg border border-line-strong px-3 text-sm font-semibold text-ink md:hidden" onClick={() => setFiltersOpen(true)}>{t("openFilters")}</button></div>
          <div className="mt-4 hidden gap-4 md:grid md:grid-cols-3 lg:grid-cols-5"><FilterFields filters={filters} updateFilter={updateFilter} employers={employers} memberIds={memberIds} t={t} /><button type="button" className="min-h-11 self-end rounded-lg border border-line-strong px-3 text-sm font-semibold text-ink" onClick={clearFilters}>{t("clearFilters")}</button></div>
        </section>

        <section className="mt-8" aria-labelledby="passbook-summary-heading"><h2 id="passbook-summary-heading" className="text-2xl font-bold text-ink">{t("summaryTitle")}</h2><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{([["openingBalance", summary.openingBalance], ["contributions", summary.contributions], ["interest", summary.interest], ["withdrawals", summary.withdrawals], ["transfers", summary.transfers], ["closingBalance", summary.closingBalance]] as const).map(([key, value]) => <div key={key} className="rounded-xl border border-line bg-canvas p-4"><p className="text-sm text-muted">{t(key)}</p><p className="mt-2 text-xl font-bold text-ink data-number">{rupees(value)}</p></div>)}</div></section>

        <section className="mt-8" aria-labelledby="passbook-history-heading"><div className="flex items-end justify-between gap-3"><div><h2 id="passbook-history-heading" className="text-2xl font-bold text-ink">{t("historyTitle")}</h2><p className="mt-1 text-sm text-muted">{t("transactionCount", { count: transactions.length })}</p></div><button type="button" className="min-h-11 rounded-lg bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-strong" onClick={() => window.alert(t("exportDemoAlert"))}>{t("download")}</button></div>{transactions.length === 0 ? <div className="mt-4"><EmptyState title={t("emptyTitle")} action={<button type="button" className="font-semibold text-brand underline" onClick={clearFilters}>{t("clearFilters")}</button>} /></div> : <div className="mt-4 overflow-x-auto rounded-xl border border-line"><table className="hidden min-w-full text-left text-sm md:table"><thead className="bg-canvas text-xs uppercase text-muted"><tr>{["date", "description", "type", "employeeContribution", "employerContribution", "interest", "amount", "balance", "details"].map((key) => <th key={key} className="px-4 py-3">{t(key)}</th>)}</tr></thead><tbody>{transactions.map((transaction) => <tr key={transaction.id} className="border-t border-line"><td className="px-4 py-3 data-number">{transaction.date}</td><td className="px-4 py-3 font-semibold">{transaction.description}</td><td className="px-4 py-3">{t(`types.${transaction.type}`)}</td><td className="px-4 py-3 data-number">{rupees(transaction.employeeContribution)}</td><td className="px-4 py-3 data-number">{rupees(transaction.employerContribution)}</td><td className="px-4 py-3 data-number">{rupees(transaction.interest)}</td><td className="px-4 py-3 data-number">{rupees(transaction.amount)}</td><td className="px-4 py-3 data-number">{rupees(transaction.balance)}</td><td className="px-4 py-3"><button type="button" className="font-semibold text-brand underline" onClick={() => setSelected(transaction)}>{t("details")}</button></td></tr>)}</tbody></table><div className="grid gap-3 p-3 md:hidden">{transactions.map((transaction) => <button key={transaction.id} type="button" className="rounded-xl border border-line bg-surface p-4 text-left" onClick={() => setSelected(transaction)}><div className="flex items-start justify-between gap-3"><span className="font-bold text-ink">{transaction.description}</span><StatusBadge tone={transaction.amount < 0 ? "warning" : "success"}>{rupees(transaction.amount)}</StatusBadge></div><p className="mt-2 text-sm text-muted">{transaction.date} · {t(`types.${transaction.type}`)}</p><p className="mt-2 text-sm font-semibold text-ink">{t("balance")}: {rupees(transaction.balance)}</p></button>)}</div></div>}</section>
        <div className="mt-8"><SafetyNotice compact /></div>
      </section>
      <div className="mt-8"><PrototypeBoundary>{t("handoffCopy")}</PrototypeBoundary></div>
      {filtersOpen ? <Drawer open title={t("filtersTitle")} onClose={() => setFiltersOpen(false)}><div className="grid gap-4"><FilterFields filters={filters} updateFilter={updateFilter} employers={employers} memberIds={memberIds} t={t} /><button type="button" className="min-h-11 rounded-lg bg-brand px-4 font-semibold text-white" onClick={() => setFiltersOpen(false)}>{t("applyFilters")}</button><button type="button" className="min-h-11 rounded-lg border border-line-strong px-4 font-semibold" onClick={clearFilters}>{t("clearFilters")}</button></div></Drawer> : null}
      {selected ? <Modal open title={t("detailTitle")} onClose={() => setSelected(null)}><dl className="grid gap-3 text-sm sm:grid-cols-2"><Detail label={t("date")} value={selected.date} /><Detail label={t("description")} value={selected.description} /><Detail label={t("type")} value={t(`types.${selected.type}`)} /><Detail label={t("amount")} value={rupees(selected.amount)} /><Detail label={t("employeeContribution")} value={rupees(selected.employeeContribution)} /><Detail label={t("employerContribution")} value={rupees(selected.employerContribution)} /><Detail label={t("interest")} value={rupees(selected.interest)} /><Detail label={t("balance")} value={rupees(selected.balance)} /><Detail label={t("memberId")} value={selected.memberId} /></dl></Modal> : null}
    </main>
  );
}

function Stat({ label, value, dark, mono }: { label: string; value: string; dark?: boolean; mono?: boolean }) { return <div className={dark ? "rounded-xl border border-white/20 bg-white/10 p-4" : "rounded-xl border border-line bg-canvas p-4"}><p className={dark ? "text-sm text-white/75" : "text-sm text-muted"}>{label}</p><p className={`${dark ? "text-white" : "text-ink"} mt-2 font-bold ${mono ? "data-number text-sm" : ""}`}>{value}</p></div>; }
function Detail({ label, value }: { label: string; value: string }) { return <div><dt className="text-muted">{label}</dt><dd className="mt-1 font-semibold text-ink">{value}</dd></div>; }
function FilterFields({ filters, updateFilter, employers, memberIds, t }: { filters: PassbookFilters; updateFilter: <K extends keyof PassbookFilters>(key: K, value: PassbookFilters[K]) => void; employers: string[]; memberIds: string[]; t: ReturnType<typeof useTranslations> }) { return <><label className="grid gap-1 text-sm font-semibold text-ink">{t("dateRange")}<select value={filters.range} onChange={(event) => updateFilter("range", event.target.value as PassbookFilters["range"])} className="min-h-11 rounded-lg border border-line-strong bg-surface px-3">{RANGE_KEYS.map((key) => <option key={key} value={key}>{t(`ranges.${key}`)}</option>)}</select></label><label className="grid gap-1 text-sm font-semibold text-ink">{t("type")}<select value={filters.type} onChange={(event) => updateFilter("type", event.target.value as PassbookFilters["type"])} className="min-h-11 rounded-lg border border-line-strong bg-surface px-3">{TYPE_KEYS.map((key) => <option key={key} value={key}>{key === "ALL" ? t("all") : t(`types.${key}`)}</option>)}</select></label><label className="grid gap-1 text-sm font-semibold text-ink">{t("employer")}<select value={filters.employer} onChange={(event) => updateFilter("employer", event.target.value)} className="min-h-11 rounded-lg border border-line-strong bg-surface px-3"><option value="ALL">{t("all")}</option>{employers.map((value) => <option key={value} value={value}>{value}</option>)}</select></label><label className="grid gap-1 text-sm font-semibold text-ink">{t("memberId")}<select value={filters.memberId} onChange={(event) => updateFilter("memberId", event.target.value)} className="min-h-11 rounded-lg border border-line-strong bg-surface px-3"><option value="ALL">{t("all")}</option>{memberIds.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>{filters.range === "CUSTOM" ? <><label className="grid gap-1 text-sm font-semibold text-ink">{t("startDate")}<input type="date" value={filters.startDate} onChange={(event) => updateFilter("startDate", event.target.value)} className="min-h-11 rounded-lg border border-line-strong bg-surface px-3" /></label><label className="grid gap-1 text-sm font-semibold text-ink">{t("endDate")}<input type="date" value={filters.endDate} onChange={(event) => updateFilter("endDate", event.target.value)} className="min-h-11 rounded-lg border border-line-strong bg-surface px-3" /></label></> : null}</>; }
