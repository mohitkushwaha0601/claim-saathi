import { describe, expect, it } from "vitest";

import { SERVICE_REGISTRY, searchServices } from "./index";

const text: Record<string, string> = {
  "items.balance.title": "Check PF balance", "items.balanceCopy": "See your account balance",
  "items.withdraw.title": "Withdraw PF money", "items.withdrawCopy": "Understand access to some funds",
  "items.transfer.title": "Transfer after changing jobs", "items.transferCopy": "Move PF from an old company",
  "items.kyc.title": "Update KYC", "items.kycCopy": "Review Aadhaar, PAN, or bank details",
  "items.claimStatus.title": "Check claim status", "items.claimStatusCopy": "Track a submitted claim",
  "items.uan.title": "Find UAN", "items.uanCopy": "Review UAN information",
  "items.nomination.title": "Add nomination", "items.nominationCopy": "Review nominee information",
  "items.settlement.title": "Final settlement", "items.settlementCopy": "Review settlement after leaving a job",
};

const translate = (key: string) => text[key] ?? key;

describe("service registry search", () => {
  it("returns stable featured services for an empty query", () => {
    expect(searchServices("", translate).map((item) => item.id)).toEqual(["balance", "withdraw", "transfer", "kyc"]);
  });

  it.each([["withdraw PF", "withdraw"], ["need money", "withdraw"], ["old company PF", "transfer"], ["check balance", "balance"], ["Aadhaar", "kyc"], ["track claim", "claim-status"]])("matches %s to %s", (query, expectedId) => {
    expect(searchServices(query, translate).map((item) => item.id)).toContain(expectedId);
  });

  it("keeps preview services without an invented route", () => {
    expect(searchServices("check balance", translate)[0]).toMatchObject({ id: "balance", availability: "INFORMATIONAL_PREVIEW" });
    expect(searchServices("check balance", translate)[0]).not.toHaveProperty("href");
  });

  it("returns no result for unknown terms and remains deterministic", () => {
    expect(searchServices("something unknown", translate)).toEqual([]);
    expect(searchServices("claim status", translate)).toEqual(searchServices("claim status", translate));
    expect(SERVICE_REGISTRY).toHaveLength(8);
  });
});
