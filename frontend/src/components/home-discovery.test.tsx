import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderWithProviders } from "@/test/render";

import { HomeDiscovery } from "./home-discovery";

describe("homepage service discovery", () => {
  it("starts with popular services and role entry points", () => {
    renderWithProviders(<HomeDiscovery />);

    expect(screen.getByRole("heading", { name: "What do you need to do?" })).toBeTruthy();
    expect(screen.getByRole("textbox", { name: "Search for a service" })).toBeTruthy();
    expect(screen.getByText("Withdraw PF")).toBeTruthy();
    expect(screen.getByText("Explore passbook →")).toBeTruthy();
    expect(screen.getByText("Explore KYC →")).toBeTruthy();
    expect(screen.getByText("Employee")).toBeTruthy();
    expect(screen.getByRole("link", { name: /Employee.*Explore services/ }).getAttribute("href")).toBe("/employee");
    expect(screen.getByRole("link", { name: /Employer.*Explore services/ }).getAttribute("href")).toBe("/employer");
    expect(screen.getByRole("link", { name: /Pensioner.*Explore services/ }).getAttribute("href")).toBe("/pensioner");
  });

  it("matches natural phrases and links interactive services", () => {
    renderWithProviders(<HomeDiscovery />);
    const search = screen.getByRole("textbox", { name: "Search for a service" });

    fireEvent.change(search, { target: { value: "old company PF" } });
    expect(screen.getByRole("link", { name: /Transfer PF/ }).getAttribute("href")).toBe("/services/transfer");

    fireEvent.change(search, { target: { value: "update Aadhaar" } });
    expect(screen.getByText("Update KYC")).toBeTruthy();
    expect(screen.getByRole("link", { name: /Update KYC/ }).getAttribute("href")).toBe("/services/kyc");
  });
});
