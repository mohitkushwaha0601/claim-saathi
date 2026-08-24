import { JourneyPreparation } from "@/components/journey-preparation";
import { PageContainer } from "@/components/page-container";

export default async function JourneyPage({
  params,
}: {
  params: Promise<{ journeyInstanceId: string }>;
}) {
  const { journeyInstanceId } = await params;
  return (
    <PageContainer>
      <JourneyPreparation journeyInstanceId={journeyInstanceId} />
    </PageContainer>
  );
}
