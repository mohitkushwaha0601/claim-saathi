import { describe, expect, it } from "vitest";

import {
  DEFAULT_PASSBOOK_FILTERS,
  DEMO_PASSBOOK_ACCOUNTS,
  filterPassbookTransactions,
  getPassbookAccount,
  summarizePassbook,
} from "./passbook";

describe("synthetic passbook utilities", () => {
  it("filters transactions by date range and type", () => {
    const account = getPassbookAccount("RAVI_PARTIAL_READY");
    const currentYear = filterPassbookTransactions(account, DEFAULT_PASSBOOK_FILTERS);
    expect(currentYear.every((transaction) => transaction.date >= "2025-04-01")).toBe(true);
    expect(filterPassbookTransactions(account, { ...DEFAULT_PASSBOOK_FILTERS, type: "INTEREST" })).toHaveLength(1);
    expect(filterPassbookTransactions(account, { ...DEFAULT_PASSBOOK_FILTERS, range: "PREVIOUS_FY", startDate: "", endDate: "" })).toHaveLength(0);
  });

  it("calculates a deterministic transaction summary", () => {
    const account = getPassbookAccount("RAVI_PARTIAL_READY");
    const transactions = filterPassbookTransactions(account, DEFAULT_PASSBOOK_FILTERS);
    expect(summarizePassbook(account, transactions)).toEqual({
      openingBalance: 0,
      contributions: 7050,
      interest: 312,
      withdrawals: 0,
      transfers: 0,
      closingBalance: 7380,
    });
  });

  it("keeps every committed demo profile deterministic", () => {
    expect(DEMO_PASSBOOK_ACCOUNTS.map((account) => account.personaId)).toEqual([
      "RAVI_PARTIAL_READY",
      "PRIYA_TRANSFER_MISSING_EXIT",
      "ARJUN_FINAL_SETTLEMENT",
    ]);
  });
});
