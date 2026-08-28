import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderWithProviders } from "@/test/render";

import { PensionerHub } from "./pensioner-hub";

describe("pensioner hub", () => {
  it("uses a larger, simplified presentation for synthetic pension services", () => {
    renderWithProviders(<PensionerHub />);

    expect(screen.getByRole("heading", { name: "Find pension information and support" })).toBeTruthy();
    expect(screen.getAllByText("Synthetic only")).toHaveLength(4);
    expect(screen.getByRole("heading", { name: "Pension services" })).toBeTruthy();
    expect(screen.getAllByText("PPO details")).toHaveLength(2);
  });

  it("does not expose pension records, credentials, or transaction controls", () => {
    renderWithProviders(<PensionerHub />);

    expect(screen.queryAllByRole("textbox")).toHaveLength(0);
    expect(screen.queryAllByRole("button")).toHaveLength(0);
    expect(screen.getAllByText("Informational preview")).toHaveLength(8);
  });
});
