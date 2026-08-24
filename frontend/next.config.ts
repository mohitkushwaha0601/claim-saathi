import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  poweredByHeader: false,
};

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");
const withSerwist = withSerwistInit({
  additionalPrecacheEntries: [
    { url: "/", revision: "phase-8.5-static-shell-v1" },
    { url: "/how-it-works", revision: "phase-8.5-static-shell-v1" },
    { url: "/offline", revision: "phase-8.5-static-shell-v1" },
  ],
  cacheOnNavigation: false,
  disable: process.env.NODE_ENV === "development",
  register: true,
  reloadOnOnline: false,
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
});

export default withSerwist(withNextIntl(nextConfig));
