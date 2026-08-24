import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import { AppHeader } from "@/components/app-header";
import { DemoBoundaryBar } from "@/components/demo-boundary-bar";
import { PageContainer } from "@/components/page-container";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "ClaimSaathi — Guided PF journeys",
    template: "%s — ClaimSaathi",
  },
  description:
    "An independent prototype that turns PF goals into deterministic, policy-backed journey checks and guided resolution.",
  icons: { icon: "/icon.svg" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f6f5ef",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body className="min-h-dvh bg-canvas text-ink antialiased">
        <a
          href="#main-content"
          className="fixed top-3 left-3 z-50 -translate-y-20 rounded-lg bg-ink px-4 py-3 font-semibold text-white focus:translate-y-0"
        >
          Skip to main content
        </a>
        <AppHeader />
        <DemoBoundaryBar />
        {children}
        <footer className="border-t border-line bg-surface py-8">
          <PageContainer>
            <p className="text-sm leading-6 text-muted">
              ClaimSaathi is an independent hackathon prototype. It is not an
              official EPFO service.
            </p>
          </PageContainer>
        </footer>
      </body>
    </html>
  );
}
