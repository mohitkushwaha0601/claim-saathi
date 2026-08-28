export type ServiceAvailability = "REVIEWED_SYNTHETIC_JOURNEY" | "INFORMATIONAL_PREVIEW";

export type ServiceRegistryItem = {
  id: string;
  href?: string;
  keywords: readonly string[];
  titleKey: string;
  descriptionKey: string;
  availability: ServiceAvailability;
  featured: boolean;
};

/** Presentation metadata only. Policy decisions remain in the backend. */
export const SERVICE_REGISTRY = [
  { id: "balance", href: "/services/pf-balance", keywords: ["balance", "passbook", "account"], titleKey: "balance", descriptionKey: "interactiveBalanceCopy", availability: "REVIEWED_SYNTHETIC_JOURNEY", featured: true },
  { id: "withdraw", href: "/services/partial-withdrawal", keywords: ["withdraw", "need", "money", "funds", "access"], titleKey: "withdraw", descriptionKey: "withdrawCopy", availability: "REVIEWED_SYNTHETIC_JOURNEY", featured: true },
  { id: "transfer", href: "/services/transfer", keywords: ["transfer", "old company", "changed jobs", "move"], titleKey: "transfer", descriptionKey: "transferCopy", availability: "REVIEWED_SYNTHETIC_JOURNEY", featured: true },
  { id: "kyc", href: "/services/kyc", keywords: ["kyc", "aadhaar", "pan", "bank"], titleKey: "kyc", descriptionKey: "interactiveKycCopy", availability: "REVIEWED_SYNTHETIC_JOURNEY", featured: true },
  { id: "claim-status", href: "/services/claim-status", keywords: ["claim", "track", "status", "submitted"], titleKey: "claimStatus", descriptionKey: "claimStatusCopy", availability: "INFORMATIONAL_PREVIEW", featured: false },
  { id: "uan", href: "/services/uan", keywords: ["uan", "find uan", "activate"], titleKey: "uan", descriptionKey: "uanCopy", availability: "INFORMATIONAL_PREVIEW", featured: false },
  { id: "nomination", keywords: ["nomination", "nominee"], titleKey: "nomination", descriptionKey: "nominationCopy", availability: "INFORMATIONAL_PREVIEW", featured: false },
  { id: "settlement", href: "/services/final-settlement", keywords: ["settlement", "left job", "final"], titleKey: "settlement", descriptionKey: "settlementCopy", availability: "REVIEWED_SYNTHETIC_JOURNEY", featured: false },
] as const satisfies readonly ServiceRegistryItem[];

export type ServiceTranslator = (key: string) => string;

export function searchServices(query: string, translate: ServiceTranslator): readonly ServiceRegistryItem[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return SERVICE_REGISTRY.filter((item) => item.featured).slice(0, 4);

  const tokens = normalizedQuery.split(/\s+/).filter(Boolean);
  return SERVICE_REGISTRY.filter((item) => {
    const searchableText = [translate(`items.${item.titleKey}.title`), translate(`items.${item.descriptionKey}`), ...item.keywords].join(" ").toLowerCase();
    return tokens.every((token) => searchableText.includes(token));
  }).slice(0, 5);
}
