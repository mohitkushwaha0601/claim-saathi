import type { Metadata } from "next";

import { EmployeeHub } from "@/components/employee-hub";
import { PageContainer } from "@/components/page-container";

export const metadata: Metadata = {
  title: "Employee hub",
  description: "A synthetic employee view of ClaimSaathi PF services.",
};

export default function EmployeePage() {
  return <PageContainer><EmployeeHub /></PageContainer>;
}
