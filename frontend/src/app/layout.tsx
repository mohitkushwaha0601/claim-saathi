import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import { AppFooter } from "@/components/app-footer";
import { AppHeader } from "@/components/app-header";
import { AppProviders } from "@/components/app-providers";
import { ConnectivityNotice } from "@/components/connectivity-notice";
import { DemoBoundaryBar } from "@/components/demo-boundary-bar";

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
  themeColor: "#0b2545",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      data-contrast="standard"
      data-scroll-behavior="smooth"
      data-text-scale="100"
      suppressHydrationWarning
    >
      <body className="min-h-dvh bg-canvas text-ink antialiased">
        <AppProviders>
          <AppHeader />
          <DemoBoundaryBar />
          <ConnectivityNotice />
          {children}
          <AppFooter />
        </AppProviders>
      </body>
    </html>
  );
}
