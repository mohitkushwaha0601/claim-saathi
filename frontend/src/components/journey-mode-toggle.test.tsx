import { fireEvent, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderWithProviders } from "@/test/render";

import { JourneyModeToggle } from "./journey-mode-toggle";

describe("journey mode preference", () => {
  it("starts guided and persists switching to quick mode", async () => {
    renderWithProviders(<JourneyModeToggle />);

    expect(screen.getByRole("button", { name: "Guided mode" }).getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(screen.getByRole("button", { name: "Quick mode" }));
    expect(screen.getByRole("button", { name: "Quick mode" }).getAttribute("aria-pressed")).toBe("true");
    expect(window.localStorage.getItem("claimsaathi.journeyMode")).toBe("quick");
  });

  it("restores the stored mode after remounting", async () => {
    window.localStorage.setItem("claimsaathi.journeyMode", "quick");
    renderWithProviders(<JourneyModeToggle />);

    await waitFor(() => expect(screen.getByRole("button", { name: "Quick mode" }).getAttribute("aria-pressed")).toBe("true"));
  });
});
