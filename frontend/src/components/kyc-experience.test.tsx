import { fireEvent, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderWithProviders } from "@/test/render";

import { KycExperience } from "./kyc-experience";

describe("KycExperience", () => {
  it("validates and completes a pending synthetic document", () => {
    renderWithProviders(<KycExperience />);
    fireEvent.click(screen.getByRole("button", { name: "Validate demo details" }));
    expect(screen.getByText("Demo validation complete")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Submit demo KYC" }));
    expect(screen.getByRole("status").textContent).toContain("Demo KYC completed.");
    expect(screen.getByText("Synthetic KYC history updated: this document is now Verified.")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Open official EPFO member portal" }).getAttribute("href")).toBe("https://unifiedportal-mem.epfindia.gov.in/");
  });

  it("keeps an incomplete synthetic profile in a failure state", async () => {
    window.localStorage.setItem("claimsaathi.demoPersona", "PRIYA_TRANSFER_MISSING_EXIT");
    renderWithProviders(<KycExperience />);
    await waitFor(() => expect(screen.getByRole("heading", { name: "KYC overview for Priya" })).toBeTruthy());
    fireEvent.click(screen.getByRole("button", { name: "Validate demo details" }));
    expect(screen.getByRole("alert").textContent).toContain("Missing verification information.");
    expect(screen.queryByRole("button", { name: "Submit demo KYC" })).toBeNull();
  });

  it("updates the selected document without collecting identity inputs", () => {
    renderWithProviders(<KycExperience />);
    fireEvent.click(screen.getByRole("button", { name: /Aadhaar/ }));
    expect(screen.getByRole("heading", { name: "Aadhaar" })).toBeTruthy();
    expect(screen.queryAllByRole("textbox")).toHaveLength(0);
  });
});
