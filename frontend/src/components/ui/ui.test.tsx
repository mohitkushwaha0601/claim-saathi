import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  Accordion,
  Button,
  Modal,
  ProgressBar,
  SearchInput,
  StatusBadge,
  Tabs,
} from "./index";

describe("shared design-system components", () => {
  it("keeps common controls labeled and keyboard-operable", () => {
    render(
      <>
        <Button>Continue</Button>
        <SearchInput label="Search services" placeholder="Search" />
        <StatusBadge>Ready to proceed</StatusBadge>
        <ProgressBar value={45} />
      </>,
    );

    expect(screen.getByRole("button", { name: "Continue" })).toBeTruthy();
    expect(screen.getByRole("textbox", { name: "Search services" })).toBeTruthy();
    expect(screen.getByText("Ready to proceed")).toBeTruthy();
    expect(screen.getByRole("progressbar").getAttribute("aria-valuenow")).toBe("45");
  });

  it("switches tabs and exposes the active panel", () => {
    render(
      <Tabs
        tabs={[
          { id: "one", label: "One", content: <p>First panel</p> },
          { id: "two", label: "Two", content: <p>Second panel</p> },
        ]}
      />,
    );

    expect(screen.getByText("First panel")).toBeTruthy();
    fireEvent.click(screen.getByRole("tab", { name: "Two" }));
    expect(screen.getByText("Second panel")).toBeTruthy();
    expect(screen.getByRole("tab", { name: "Two" }).getAttribute("aria-selected")).toBe("true");
  });

  it("supports disclosure and modal escape dismissal", () => {
    const onClose = vi.fn();
    render(
      <>
        <Accordion title="What is needed?">A synthetic answer.</Accordion>
        <Modal open title="Confirm" onClose={onClose}>Modal content</Modal>
      </>,
    );

    expect(screen.getByText("A synthetic answer.")).toBeTruthy();
    expect(screen.getByRole("dialog", { name: "Confirm" })).toBeTruthy();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
