import type { Metadata } from "next";

import { EmployerHub } from "@/components/employer-hub";
import { PageContainer } from "@/components/page-container";

export const metadata: Metadata = {
  title: "Employer hub",
  description: "A synthetic employer view of ClaimSaathi services.",
};

export default function EmployerPage() {
  return <PageContainer><EmployerHub /></PageContainer>;
}
