import { getTranslations } from "next-intl/server";

import { LoadingState } from "@/components/loading-state";
import { PageContainer } from "@/components/page-container";

export default async function Loading() {
  const t = await getTranslations("JourneyPages");
  return (
    <PageContainer>
      <main id="main-content" className="py-12 sm:py-16">
        <LoadingState message={t("loading")} />
      </main>
    </PageContainer>
  );
}
