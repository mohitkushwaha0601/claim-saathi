import type { ReactNode } from "react";

export function PageContainer({ children }: { children: ReactNode }) {
  return <div className="page-container mx-auto w-full max-w-5xl px-5 sm:px-8">{children}</div>;
}
