import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderWithProviders } from "@/test/render";

import { EmployeeHub } from "./employee-hub";

describe("employee hub", () => {
  it("shows the synthetic account overview and employee catalogue", () => {
    renderWithProviders(<EmployeeHub />);

    expect(screen.getByRole("heading", { name: "Manage your PF" })).toBeTruthy();
    expect(screen.getAllByText("Synthetic only")).toHaveLength(4);
    expect(screen.getByRole("heading", { name: "Money" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Incomplete KYC" })).toBeTruthy();
    expect(screen.getByText(/Synthetic example: no Aadhaar/)).toBeTruthy();
  });

  it("links reviewed journeys and keeps unavailable services as previews", () => {
    renderWithProviders(<EmployeeHub />);

    expect(screen.getAllByRole("link", { name: /Withdraw PF/ })[0].getAttribute("href")).toBe("/services/partial-withdrawal");
    expect(screen.getAllByRole("link", { name: /Transfer PF/ })[0].getAttribute("href")).toBe("/services/transfer");
    expect(screen.queryAllByRole("link", { name: /Update KYC/ })).toHaveLength(0);
    expect(screen.getAllByText("Informational preview").length).toBeGreaterThan(0);
  });
});
