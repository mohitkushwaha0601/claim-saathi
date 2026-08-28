import type { Metadata } from "next";

import { PageContainer } from "@/components/page-container";
import { UanExperience } from "@/components/uan-experience";

export const metadata: Metadata = {
  title: "UAN guidance",
  description: "Informational UAN guidance and official handoffs for the ClaimSaathi prototype.",
};

export default function UanPage() {
  return <PageContainer><UanExperience /></PageContainer>;
}
