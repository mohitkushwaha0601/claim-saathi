import type { ReactNode } from "react";

export function PageContainer({ children }: { children: ReactNode }) {
  return (
    <div className="page-container mx-auto w-full max-w-6xl px-5 sm:px-8 lg:px-10">
      {children}
    </div>
  );
}
