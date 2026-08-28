import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderWithProviders } from "@/test/render";

import { UanExperience } from "./uan-experience";

describe("UAN experience", () => {
  it("provides informational choices without collecting credentials", () => {
    renderWithProviders(<UanExperience />);

    expect(screen.getByRole("heading", { name: "Understand your UAN options" })).toBeTruthy();
    expect(screen.getByText(/does not collect UAN, Aadhaar, OTP/)).toBeTruthy();
    expect(screen.queryAllByRole("textbox")).toHaveLength(0);
    expect(screen.getAllByRole("link", { name: "Open official EPFO manual" })).toHaveLength(2);
  });

  it("links an activated UAN to the official member portal", () => {
    renderWithProviders(<UanExperience />);

    expect(screen.getByRole("link", { name: "Open official member portal" }).getAttribute("href")).toBe("https://unifiedportal-mem.epfindia.gov.in/");
    expect(screen.getByRole("link", { name: "Read UIDAI face authentication information" }).getAttribute("href")).toBe("https://uidai.gov.in/en/contact-support/have-any-question/303-faqs/authentication.html");
  });
});
