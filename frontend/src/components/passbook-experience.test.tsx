import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderWithProviders } from "@/test/render";

import { PassbookExperience } from "./passbook-experience";

describe("PassbookExperience", () => {
  it("filters transactions and explains an empty result", () => {
    renderWithProviders(<PassbookExperience />);
    const typeFilter = screen.getByLabelText("Transaction type");
    fireEvent.change(typeFilter, { target: { value: "WITHDRAWAL" } });
    expect(screen.getByText("No transactions match your filters.")).toBeTruthy();
    fireEvent.click(screen.getAllByRole("button", { name: "Clear filters" })[0]);
    expect(screen.getByText("8 transactions shown")).toBeTruthy();
  });

  it("opens a transaction detail view from the history", () => {
    renderWithProviders(<PassbookExperience />);
    fireEvent.click(screen.getAllByRole("button", { name: "View details" })[0]);
    const dialog = screen.getByRole("dialog", { name: "Transaction details" });
    expect(dialog).toBeTruthy();
    expect(within(dialog).getByText("Monthly contribution")).toBeTruthy();
  });

  it("uses the selected synthetic profile from persisted preferences", async () => {
    window.localStorage.setItem("claimsaathi.demoPersona", "PRIYA_TRANSFER_MISSING_EXIT");
    renderWithProviders(<PassbookExperience />);
    await waitFor(() => expect(screen.getByRole("heading", { name: "Priya · synthetic account" })).toBeTruthy());
    expect(screen.getAllByText("SYNTH-MEMBER-PRIYA-CURRENT-002").length).toBeGreaterThan(0);
  });
});
