import type { Metadata } from "next";

import { PageContainer } from "@/components/page-container";
import { SafetyPage } from "@/components/safety-page";

export const metadata: Metadata = {
  title: "Safety",
  description: "ClaimSaathi prototype safety boundaries and limitations.",
};

export default function SafetyRoute() {
  return <PageContainer><SafetyPage /></PageContainer>;
}
