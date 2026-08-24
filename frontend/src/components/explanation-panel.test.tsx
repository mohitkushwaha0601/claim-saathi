import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createDecisionExplanation } from "@/lib/api/explanations";
import type { ExplanationResponse } from "@/lib/api/types";

import { ExplanationPanel } from "./explanation-panel";

vi.mock("@/lib/api/explanations", () => ({
  createDecisionExplanation: vi.fn(),
}));

const createExplanationMock = vi.mocked(createDecisionExplanation);
const DEMO = {
  environment: "DEMO",
  synthetic_data: true,
  real_government_action_performed: false,
} as const;

const AI_EXPLANATION: ExplanationResponse = {
  decision_id: "DEC-RAVI",
  mode: "SIMPLE_ENGLISH",
  title: "Your recorded result",
  summary:
    "The configured ClaimSaathi checks currently pass. The process identified for this demo is Form 31.",
  points: ["The stored result remains Ready to proceed."],
  disclaimer: "This explanation does not change the stored result.",
  ai_used_for_decision: false,
  ai_used_for_explanation: true,
  fallback_used: false,
  demo: DEMO,
};

function renderWithPrimaryResult(
  heading = "Ready to proceed",
  supportingText = "Form 31",
) {
  return render(
    <>
      <section aria-label="Deterministic result">
        <h1>{heading}</h1>
        <p>{supportingText}</p>
      </section>
      <ExplanationPanel
        journeyInstanceId="JRN-RAVI"
        decisionId="DEC-RAVI"
      />
    </>,
  );
}

describe("optional explanation controls", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    createExplanationMock.mockResolvedValue(AI_EXPLANATION);
  });

  it("calls the selected stored decision in SIMPLE_ENGLISH mode", async () => {
    renderWithPrimaryResult();

    fireEvent.click(screen.getByRole("button", { name: "Explain simply" }));

    expect(await screen.findByText("AI-assisted explanation")).toBeTruthy();
    expect(createExplanationMock).toHaveBeenCalledWith(
      "JRN-RAVI",
      "DEC-RAVI",
      "SIMPLE_ENGLISH",
    );
    expect(screen.getByText("AI did not determine this result.")).toBeTruthy();
    expect(screen.getByText("AI used for decision: false")).toBeTruthy();
    expect(screen.getByText("Form 31")).toBeTruthy();
  });

  it("calls HINDI mode from the closed Hindi control", async () => {
    createExplanationMock.mockResolvedValue({
      ...AI_EXPLANATION,
      mode: "HINDI",
      title: "आपका दर्ज परिणाम",
      summary: "पहचानी गई प्रक्रिया Form 31 है।",
      points: ["स्टोर किया गया परिणाम नहीं बदला है।"],
    });
    renderWithPrimaryResult();

    fireEvent.click(screen.getByRole("button", { name: "हिंदी में समझाएँ" }));

    expect(await screen.findByText("आपका दर्ज परिणाम")).toBeTruthy();
    expect(createExplanationMock).toHaveBeenCalledWith(
      "JRN-RAVI",
      "DEC-RAVI",
      "HINDI",
    );
  });

  it("disables duplicate requests while keeping the deterministic result visible", async () => {
    let resolveExplanation!: (value: ExplanationResponse) => void;
    createExplanationMock.mockReturnValue(
      new Promise((resolve) => {
        resolveExplanation = resolve;
      }),
    );
    renderWithPrimaryResult();

    const simpleButton = screen.getByRole("button", { name: "Explain simply" });
    fireEvent.click(simpleButton);
    fireEvent.click(simpleButton);

    expect(createExplanationMock).toHaveBeenCalledOnce();
    expect(
      (screen.getByRole("button", { name: "Explaining…" }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
    expect(
      (screen.getByRole("button", {
        name: "हिंदी में समझाएँ",
      }) as HTMLButtonElement).disabled,
    ).toBe(true);
    expect(screen.getByRole("heading", { name: "Ready to proceed" })).toBeTruthy();
    expect(screen.getByText("Form 31")).toBeTruthy();

    resolveExplanation(AI_EXPLANATION);
    expect(await screen.findByText("AI-assisted explanation")).toBeTruthy();
  });

  it("labels deterministic fallback without claiming AI assistance", async () => {
    createExplanationMock.mockResolvedValue({
      ...AI_EXPLANATION,
      ai_used_for_explanation: false,
      fallback_used: true,
    });
    renderWithPrimaryResult();

    fireEvent.click(screen.getByRole("button", { name: "Explain simply" }));

    expect(await screen.findByText("Plain-language explanation")).toBeTruthy();
    expect(screen.queryByText("AI-assisted explanation")).toBeNull();
    expect(screen.getByRole("heading", { name: "Ready to proceed" })).toBeTruthy();
  });

  it("preserves the original result and allows retry after request failure", async () => {
    createExplanationMock
      .mockRejectedValueOnce(new Error("private provider detail"))
      .mockResolvedValueOnce(AI_EXPLANATION);
    renderWithPrimaryResult();

    fireEvent.click(screen.getByRole("button", { name: "Explain simply" }));

    expect(
      await screen.findByText(
        "We couldn't load a different explanation right now. Your stored result is unchanged.",
      ),
    ).toBeTruthy();
    expect(screen.queryByText("private provider detail")).toBeNull();
    expect(screen.getByRole("heading", { name: "Ready to proceed" })).toBeTruthy();
    expect(screen.getByText("Form 31")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Try explanation again" }));
    expect(await screen.findByText("AI-assisted explanation")).toBeTruthy();
    expect(createExplanationMock).toHaveBeenCalledTimes(2);
  });

  it("keeps Priya's resolution result untouched", () => {
    renderWithPrimaryResult("Action required", "Start resolution");

    expect(screen.getByRole("heading", { name: "Action required" })).toBeTruthy();
    expect(screen.getByText("Start resolution")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Explain simply" })).toBeTruthy();
    expect(createExplanationMock).not.toHaveBeenCalled();
  });

  it("keeps Arjun's safe stop primary and cannot replace its hero", async () => {
    createExplanationMock.mockResolvedValue({
      ...AI_EXPLANATION,
      decision_id: "DEC-RAVI",
      title: "Policy explanation",
      summary:
        "ClaimSaathi cannot safely determine this from the reviewed policy configuration.",
      points: ["The uncertainty remains."],
    });
    renderWithPrimaryResult(
      "Policy verification required",
      "ClaimSaathi stopped instead of guessing.",
    );

    fireEvent.click(screen.getByRole("button", { name: "Explain simply" }));

    expect(await screen.findByText("Policy explanation")).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "Policy verification required" }),
    ).toBeTruthy();
    expect(screen.getByText("ClaimSaathi stopped instead of guessing.")).toBeTruthy();
    expect(
      screen.queryByRole("heading", { name: "Ready to proceed" }),
    ).toBeNull();
  });
});
