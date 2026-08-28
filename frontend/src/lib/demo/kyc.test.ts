import { describe, expect, it } from "vitest";

import { completeDemoKyc, getKycProfile, validateDemoKyc } from "./kyc";

describe("synthetic KYC workflow", () => {
  it("renders committed profile states and fails incomplete demo data", () => {
    const profile = getKycProfile("PRIYA_TRANSFER_MISSING_EXIT");
    const pan = profile.records.find((record) => record.document === "PAN")!;
    expect(pan.status).toBe("ACTION_REQUIRED");
    expect(validateDemoKyc(pan)).toEqual({ ok: false, reason: "MISSING_VERIFICATION_INFORMATION" });
  });

  it("transitions only the selected pending document to verified", () => {
    const profile = getKycProfile("RAVI_PARTIAL_READY");
    const updated = completeDemoKyc(profile, "PAN");
    expect(updated.records.find((record) => record.document === "PAN")?.status).toBe("VERIFIED");
    expect(updated.records.find((record) => record.document === "NOMINATION")?.status).toBe("ACTION_REQUIRED");
    expect(updated.records.find((record) => record.document === "PAN")?.updatedAt).toBe("2026-08-28");
  });
});
