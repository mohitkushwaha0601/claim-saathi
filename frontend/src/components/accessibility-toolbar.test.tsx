import { fireEvent, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "@/test/render";

import { AccessibilityToolbar } from "./accessibility-toolbar";

function renderToolbar() {
  return renderWithProviders(<AccessibilityToolbar />);
}

function openToolbar() {
  const summary = screen.getByText("Aa").closest("summary");
  expect(summary).not.toBeNull();
  fireEvent.click(summary!);
  return summary!;
}

function getMenu() {
  const summary = screen.getByText("Aa").closest("summary");
  expect(summary).not.toBeNull();
  return summary!.parentElement as HTMLDetailsElement;
}

describe("accessibility preferences", () => {
  it("closes when the user clicks outside the menu", () => {
    renderToolbar();
    openToolbar();
    expect(getMenu().open).toBe(true);

    fireEvent.pointerDown(document.body);

    expect(getMenu().open).toBe(false);
  });

  it("steps from 100% to 200%, reverses, and resets without scaling a canvas", async () => {
    renderToolbar();
    openToolbar();

    const increase = screen.getByRole("button", { name: "Increase text size" });
    const decrease = screen.getByRole("button", { name: "Decrease text size" });
    const reset = screen.getByRole("button", { name: "Reset text size to 100%" });

    fireEvent.click(increase);
    expect(document.documentElement.dataset.textScale).toBe("125");
    fireEvent.click(decrease);
    expect(document.documentElement.dataset.textScale).toBe("100");

    for (let index = 0; index < 5; index += 1) fireEvent.click(increase);
    expect(document.documentElement.dataset.textScale).toBe("200");
    expect(increase.hasAttribute("disabled")).toBe(true);
    expect(screen.getByText("Current text size: 200%")).toBeTruthy();

    fireEvent.click(reset);
    expect(document.documentElement.dataset.textScale).toBe("100");
    expect(decrease.hasAttribute("disabled")).toBe(true);
  });

  it("persists text size and high contrast across a remount", async () => {
    const first = renderToolbar();
    openToolbar();
    fireEvent.click(screen.getByRole("button", { name: "Increase text size" }));
    fireEvent.click(screen.getByRole("button", { name: "High contrast" }));

    expect(window.localStorage.getItem("claimsaathi.textScale")).toBe("125");
    expect(window.localStorage.getItem("claimsaathi.highContrast")).toBe("true");
    first.unmount();

    renderToolbar();
    await waitFor(() => {
      expect(document.documentElement.dataset.textScale).toBe("125");
      expect(document.documentElement.dataset.contrast).toBe("high");
    });
  });

  it("toggles and persists dark mode across a remount", async () => {
    const first = renderToolbar();
    openToolbar();
    fireEvent.click(screen.getByRole("button", { name: "Dark mode" }));

    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(window.localStorage.getItem("claimsaathi.colorTheme")).toBe("dark");
    first.unmount();

    renderToolbar();
    await waitFor(() => {
      expect(document.documentElement.dataset.theme).toBe("dark");
      expect(
        screen.getByRole("button", { name: "Dark mode" }).getAttribute("aria-pressed"),
      ).toBe("true");
    });
  });

  it("switches to the committed Hindi catalogue without navigation or a request", async () => {
    window.history.replaceState({}, "", "/journey/JRN-UNCHANGED");
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    renderToolbar();
    const summary = openToolbar();
    expect(summary.tabIndex).toBeGreaterThanOrEqual(0);

    fireEvent.click(screen.getByRole("button", { name: "हिंदी" }));

    expect(window.location.pathname).toBe("/journey/JRN-UNCHANGED");
    await waitFor(() => expect(document.documentElement.lang).toBe("hi"));
    expect(await screen.findByText("मौजूदा टेक्स्ट आकार: 100%")).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "टेक्स्ट का आकार बढ़ाएँ" }),
    ).toBeTruthy();
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });
});
