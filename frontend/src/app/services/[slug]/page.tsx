import { notFound } from "next/navigation";

import { PageContainer } from "@/components/page-container";
import { JourneyFamilyExperience } from "@/components/journey-family-experience";
import { KycExperience } from "@/components/kyc-experience";
import { PassbookExperience } from "@/components/passbook-experience";

const SUPPORTED_SLUGS = ["partial-withdrawal", "withdraw-pf", "transfer", "transfer-pf", "final-settlement", "claim-status", "pf-balance", "kyc", "account-recovery"];

export default async function ServicePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!SUPPORTED_SLUGS.includes(slug)) notFound();
  if (slug === "pf-balance") return <PageContainer><PassbookExperience /></PageContainer>;
  if (slug === "kyc") return <PageContainer><KycExperience /></PageContainer>;
  return <PageContainer><JourneyFamilyExperience slug={slug} /></PageContainer>;
}
