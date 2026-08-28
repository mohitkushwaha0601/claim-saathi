import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "@/test/render";

import { JourneyFamilyExperience } from "./journey-family-experience";

vi.mock("@/lib/api/demo", () => ({ listDemoPersonas: vi.fn() }));

describe("journey family entry pages", () => {
  it("keeps unsupported claim lookups informational and does not call the demo API", () => {
    renderWithProviders(<JourneyFamilyExperience slug="claim-status" />);

    expect(screen.getByRole("heading", { name: "Claim status help" })).toBeTruthy();
    expect(screen.getByText("This lookup is not configured")).toBeTruthy();
    expect(screen.getByText(/does not have a live claim-status/)).toBeTruthy();
    expect(screen.getByRole("link", { name: "Learn how ClaimSaathi works" }).getAttribute("href")).toBe("/how-it-works");
  });

  it("renders a separate account-recovery availability state", () => {
    renderWithProviders(<JourneyFamilyExperience slug="account-recovery" />);

    expect(screen.getByRole("heading", { name: "UAN and account recovery help" })).toBeTruthy();
    expect(screen.getByText("This lookup is not configured")).toBeTruthy();
  });

  it("keeps the focused entry page available in the committed Hindi catalogue", async () => {
    window.localStorage.setItem("claimsaathi.locale", "hi");
    renderWithProviders(<JourneyFamilyExperience slug="claim-status" />);

    expect(await screen.findByRole("heading", { name: "क्लेम स्थिति सहायता" })).toBeTruthy();
    expect(screen.getByText("यह जाँच कॉन्फ़िगर नहीं है")).toBeTruthy();
  });
});
