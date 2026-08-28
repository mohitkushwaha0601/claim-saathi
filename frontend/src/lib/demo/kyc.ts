export type KycDocument = "AADHAAR" | "PAN" | "BANK" | "NOMINATION";
export type KycStatus = "VERIFIED" | "PENDING" | "ACTION_REQUIRED" | "NOT_ADDED";

export interface KycRecord {
  document: KycDocument;
  status: KycStatus;
  syntheticValue: string;
  updatedAt: string | null;
}

export interface DemoKycProfile {
  personaId: string;
  displayName: string;
  records: readonly KycRecord[];
}

export const DEMO_KYC_PROFILES: readonly DemoKycProfile[] = [
  { personaId: "RAVI_PARTIAL_READY", displayName: "Ravi", records: [
    { document: "AADHAAR", status: "VERIFIED", syntheticValue: "SYNTH-AADHAAR-RAVI", updatedAt: "2026-04-12" },
    { document: "PAN", status: "PENDING", syntheticValue: "SYNTH-PAN-RAVI", updatedAt: null },
    { document: "BANK", status: "VERIFIED", syntheticValue: "SYNTH-BANK-RAVI", updatedAt: "2026-04-12" },
    { document: "NOMINATION", status: "ACTION_REQUIRED", syntheticValue: "SYNTH-NOMINATION-RAVI", updatedAt: null },
  ] },
  { personaId: "PRIYA_TRANSFER_MISSING_EXIT", displayName: "Priya", records: [
    { document: "AADHAAR", status: "VERIFIED", syntheticValue: "SYNTH-AADHAAR-PRIYA", updatedAt: "2026-03-08" },
    { document: "PAN", status: "ACTION_REQUIRED", syntheticValue: "SYNTH-PAN-PRIYA-MISSING", updatedAt: null },
    { document: "BANK", status: "NOT_ADDED", syntheticValue: "SYNTH-BANK-PRIYA-MISSING", updatedAt: null },
    { document: "NOMINATION", status: "PENDING", syntheticValue: "SYNTH-NOMINATION-PRIYA", updatedAt: null },
  ] },
  { personaId: "ARJUN_FINAL_SETTLEMENT", displayName: "Arjun", records: [
    { document: "AADHAAR", status: "NOT_ADDED", syntheticValue: "SYNTH-AADHAAR-ARJUN-MISSING", updatedAt: null },
    { document: "PAN", status: "PENDING", syntheticValue: "SYNTH-PAN-ARJUN", updatedAt: null },
    { document: "BANK", status: "ACTION_REQUIRED", syntheticValue: "SYNTH-BANK-ARJUN-MISSING", updatedAt: null },
    { document: "NOMINATION", status: "NOT_ADDED", syntheticValue: "SYNTH-NOMINATION-ARJUN-MISSING", updatedAt: null },
  ] },
];

export function getKycProfile(personaId: string | null): DemoKycProfile {
  return DEMO_KYC_PROFILES.find((profile) => profile.personaId === personaId) ?? DEMO_KYC_PROFILES[0];
}

export function validateDemoKyc(record: KycRecord): { ok: true } | { ok: false; reason: "MISSING_VERIFICATION_INFORMATION" } {
  return record.status === "PENDING" || record.status === "VERIFIED"
    ? { ok: true }
    : { ok: false, reason: "MISSING_VERIFICATION_INFORMATION" };
}

export function completeDemoKyc(profile: DemoKycProfile, document: KycDocument): DemoKycProfile {
  return { ...profile, records: profile.records.map((record) => record.document === document ? { ...record, status: "VERIFIED", updatedAt: "2026-08-28" } : record) };
}
