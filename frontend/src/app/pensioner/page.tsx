import type { Metadata } from "next";

import { PageContainer } from "@/components/page-container";
import { PensionerHub } from "@/components/pensioner-hub";

export const metadata: Metadata = {
  title: "Pensioner hub",
  description: "A synthetic pensioner view of ClaimSaathi services.",
};

export default function PensionerPage() {
  return <PageContainer><PensionerHub /></PageContainer>;
}
