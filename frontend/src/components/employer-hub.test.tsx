import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderWithProviders } from "@/test/render";

import { EmployerHub } from "./employer-hub";

describe("employer hub", () => {
  it("shows a synthetic establishment overview and service categories", () => {
    renderWithProviders(<EmployerHub />);

    expect(screen.getByRole("heading", { name: "Manage your establishment" })).toBeTruthy();
    expect(screen.getAllByText("Synthetic only")).toHaveLength(4);
    expect(screen.getByRole("heading", { name: "Contributions" })).toBeTruthy();
    expect(screen.getByText("ECR status")).toBeTruthy();
  });

  it("keeps employer actions informational and does not create form controls", () => {
    renderWithProviders(<EmployerHub />);

    expect(screen.queryAllByRole("textbox")).toHaveLength(0);
    expect(screen.getAllByText("Informational preview").length).toBeGreaterThan(5);
    expect(screen.getByText("Synthetic examples, not establishment findings.")).toBeTruthy();
  });
});
