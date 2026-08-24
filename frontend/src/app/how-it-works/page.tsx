import type { Metadata } from "next";

import { PageContainer } from "@/components/page-container";
import { SystemExplorer } from "@/components/system-explorer";

export const metadata: Metadata = {
  title: "How it works",
  description:
    "Explore ClaimSaathi's deterministic journey, policy, prerequisite, resolution, and safety architecture.",
};

export default function HowItWorksPage() {
  return (
    <PageContainer>
      <SystemExplorer />
    </PageContainer>
  );
}
