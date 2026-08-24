import type { Metadata } from "next";

import { JourneyExperience } from "@/components/journey-experience";
import { PageContainer } from "@/components/page-container";

export const metadata: Metadata = {
  title: "Your PF journey",
  description:
    "Review a synthetic ClaimSaathi journey using backend-generated deterministic checks.",
};

export default async function JourneyPage({
  params,
}: {
  params: Promise<{ journeyInstanceId: string }>;
}) {
  const { journeyInstanceId } = await params;
  return (
    <PageContainer>
      <JourneyExperience journeyInstanceId={journeyInstanceId} />
    </PageContainer>
  );
}
