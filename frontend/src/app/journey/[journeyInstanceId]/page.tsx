import { JourneyExperience } from "@/components/journey-experience";
import { PageContainer } from "@/components/page-container";

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
