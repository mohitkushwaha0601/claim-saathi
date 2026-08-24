import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ClaimSaathi — Guided PF journeys",
    short_name: "ClaimSaathi",
    description:
      "An independent prototype for deterministic, policy-backed PF journey guidance.",
    start_url: "/",
    display: "standalone",
    background_color: "#f6f5ef",
    theme_color: "#1f6650",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
