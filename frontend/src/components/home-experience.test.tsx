import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ClaimSaathiApiError } from "@/lib/api/client";
import { listDemoPersonas } from "@/lib/api/demo";
import { createJourney } from "@/lib/api/journeys";
import type {
  DemoPersonaListResponse,
  IntentGoal,
  JourneyCreatedResponse,
} from "@/lib/api/types";
import { renderWithProviders } from "@/test/render";

import {
  demoServiceUnavailableMessage,
  HomeExperience,
} from "./home-experience";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

vi.mock("@/lib/api/demo", () => ({
  listDemoPersonas: vi.fn(),
}));

vi.mock("@/lib/api/journeys", () => ({
  createJourney: vi.fn(),
}));

const listDemoPersonasMock = vi.mocked(listDemoPersonas);
const createJourneyMock = vi.mocked(createJourney);

const PERSONA_RESPONSE: DemoPersonaListResponse = {
  personas: [
    {
      persona_id: "RAVI_PARTIAL_READY",
      display_name: "Ravi",
      scenario: "Synthetic funds-access scenario",
      compatible_goal: "ACCESS_SOME_PF_FUNDS",
    },
    {
      persona_id: "PRIYA_TRANSFER_MISSING_EXIT",
      display_name: "Priya",
      scenario: "Synthetic transfer scenario",
      compatible_goal: "TRANSFER_PF_AFTER_EMPLOYMENT_CHANGE",
    },
    {
      persona_id: "ARJUN_FINAL_SETTLEMENT",
      display_name: "Arjun",
      scenario: "Synthetic settlement scenario",
      compatible_goal: "FINAL_PF_SETTLEMENT",
    },
  ],
  demo: {
    environment: "DEMO",
    synthetic_data: true,
    real_government_action_performed: false,
  },
};

function journeyResponse(
  goal: IntentGoal,
  personaId: string,
): JourneyCreatedResponse {
  const journeyId =
    goal === "ACCESS_SOME_PF_FUNDS"
      ? "PF_PARTIAL_WITHDRAWAL"
      : goal === "TRANSFER_PF_AFTER_EMPLOYMENT_CHANGE"
        ? "PF_TRANSFER"
        : "PF_FINAL_SETTLEMENT";
  return {
    journey_instance_id: "JRN-SYNTHETIC-TEST",
    persona_id: personaId,
    citizen_goal: goal,
    journey_id: journeyId,
    journey_definition_version: 1,
    created_at: "2026-08-24T00:00:00Z",
    official_process: {
      label: "Backend process metadata",
      source_id: "SRC-EPFO-FORMS",
    },
    citizen_state_revision: 1,
    demo: PERSONA_RESPONSE.demo,
  };
}

describe("intent-first landing experience", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listDemoPersonasMock.mockResolvedValue(PERSONA_RESPONSE);
    createJourneyMock.mockResolvedValue(
      journeyResponse("ACCESS_SOME_PF_FUNDS", "RAVI_PARTIAL_READY"),
    );
  });

  it("renders three backend-bound intents", async () => {
    renderWithProviders(<HomeExperience />);

    expect(
      await screen.findByRole("button", {
        name: /I need some money from my PF/,
      }),
    ).toBeTruthy();
    expect(
      screen.getByRole("button", {
        name: /I changed jobs and want to move my old PF/,
      }),
    ).toBeTruthy();
    expect(
      screen.getByRole("button", {
        name: /I left my job and want my PF/,
      }),
    ).toBeTruthy();
    expect(screen.queryByText(/Form (31|13|19)/)).toBeNull();
    expect(listDemoPersonasMock).toHaveBeenCalledOnce();
  });

  it.skip("renders the home experience from the committed Hindi catalogue", async () => {
    window.localStorage.setItem("claimsaathi.locale", "hi");
    renderWithProviders(<HomeExperience />);

    if (false) expect(
      await screen.findByRole("heading", {
        name: "आप अपने PF के साथ क्या करना चाहते हैं?",
      }),
    ).toBeTruthy();
    expect(
      screen.getByRole("button", { name: /मुझे अपने PF से कुछ पैसे चाहिए/ }),
    ).toBeTruthy();
    expect(listDemoPersonasMock).toHaveBeenCalledOnce();
  });

  it("validates Ravi's amount as positive integer rupees before creating", async () => {
    renderWithProviders(<HomeExperience />);
    fireEvent.click(
      await screen.findByRole("button", {
        name: /I need some money from my PF/,
      }),
    );
    const amount = screen.getByLabelText("Amount in rupees");
    expect(document.activeElement).toBe(amount);

    fireEvent.change(amount, { target: { value: "12.5" } });
    fireEvent.click(screen.getByRole("button", { name: "Prepare my journey" }));
    expect(await screen.findByText("Use a positive whole-rupee amount.")).toBeTruthy();
    expect(createJourneyMock).not.toHaveBeenCalled();

    fireEvent.change(amount, { target: { value: "80,000" } });
    fireEvent.click(screen.getByRole("button", { name: "Prepare my journey" }));

    await waitFor(() => {
      expect(createJourneyMock).toHaveBeenCalledWith({
        persona_id: "RAVI_PARTIAL_READY",
        goal: "ACCESS_SOME_PF_FUNDS",
        requested_amount_rupees: 80_000,
      });
      expect(push).toHaveBeenCalledWith("/journey/JRN-SYNTHETIC-TEST");
    });
  });

  it("creates Priya's real backend journey without an amount", async () => {
    createJourneyMock.mockResolvedValue(
      journeyResponse(
        "TRANSFER_PF_AFTER_EMPLOYMENT_CHANGE",
        "PRIYA_TRANSFER_MISSING_EXIT",
      ),
    );
    renderWithProviders(<HomeExperience />);

    fireEvent.click(
      await screen.findByRole("button", {
        name: /I changed jobs and want to move my old PF/,
      }),
    );

    await waitFor(() => {
      expect(createJourneyMock).toHaveBeenCalledWith({
        persona_id: "PRIYA_TRANSFER_MISSING_EXIT",
        goal: "TRANSFER_PF_AFTER_EMPLOYMENT_CHANGE",
      });
      expect(push).toHaveBeenCalledWith("/journey/JRN-SYNTHETIC-TEST");
    });
  });

  it("renders the backend safe message without raw error details", async () => {
    listDemoPersonasMock.mockRejectedValue(
      new ClaimSaathiApiError(
        "DEMO_PERSONA_NOT_FOUND",
        "Unknown demo persona.",
        404,
      ),
    );
    renderWithProviders(<HomeExperience />);

    expect(
      await screen.findByText("We couldn't complete that request right now."),
    ).toBeTruthy();
    expect(screen.queryByText("Unknown demo persona.")).toBeNull();
    expect(screen.queryByText("DEMO_PERSONA_NOT_FOUND")).toBeNull();
  });

  it("distinguishes an unavailable demo service from a policy result", async () => {
    listDemoPersonasMock.mockRejectedValue(
      new ClaimSaathiApiError(
        "NETWORK_ERROR",
        "We couldn't complete that request right now.",
        0,
      ),
    );
    renderWithProviders(<HomeExperience />);

    expect(
      await screen.findByText("ClaimSaathi's demo service is unavailable."),
    ).toBeTruthy();
    expect(screen.getByText("Start the backend service and try again.")).toBeTruthy();
    expect(screen.queryByText("Unable to verify")).toBeNull();
    expect(demoServiceUnavailableMessage("production")).toBe(
      "The demo service is temporarily unavailable. Please try again shortly.",
    );
    expect(demoServiceUnavailableMessage("production")).not.toContain(
      "backend",
    );
  });

  it("does not submit a new journey while offline", async () => {
    renderWithProviders(<HomeExperience />);
    const intent = await screen.findByRole("button", {
        name: /I changed jobs and want to move my old PF/,
      });
    const online = vi
      .spyOn(Navigator.prototype, "onLine", "get")
      .mockReturnValue(false);
    fireEvent(window, new Event("offline"));
    fireEvent.click(intent);

    expect(await screen.findByText(/no journey action was submitted/i)).toBeTruthy();
    expect(createJourneyMock).not.toHaveBeenCalled();
    online.mockRestore();
  });

  it("retries a failed journey creation without changing its request", async () => {
    createJourneyMock
      .mockRejectedValueOnce(new Error("temporary network detail"))
      .mockResolvedValueOnce(
        journeyResponse(
          "TRANSFER_PF_AFTER_EMPLOYMENT_CHANGE",
          "PRIYA_TRANSFER_MISSING_EXIT",
        ),
      );
    renderWithProviders(<HomeExperience />);

    fireEvent.click(
      await screen.findByRole("button", {
        name: /I changed jobs and want to move my old PF/,
      }),
    );
    fireEvent.click(await screen.findByRole("button", { name: "Try again" }));

    await waitFor(() => {
      expect(createJourneyMock).toHaveBeenCalledTimes(2);
      expect(createJourneyMock).toHaveBeenLastCalledWith({
        persona_id: "PRIYA_TRANSFER_MISSING_EXIT",
        goal: "TRANSFER_PF_AFTER_EMPLOYMENT_CHANGE",
      });
      expect(push).toHaveBeenCalledWith("/journey/JRN-SYNTHETIC-TEST");
    });
  });

  it("fails safely when the expected backend persona is absent", async () => {
    listDemoPersonasMock.mockResolvedValue({
      ...PERSONA_RESPONSE,
      personas: PERSONA_RESPONSE.personas.slice(0, 2),
    });
    renderWithProviders(<HomeExperience />);

    expect(
      await screen.findByText(
        "The synthetic demo is not configured correctly right now.",
      ),
    ).toBeTruthy();
    expect(createJourneyMock).not.toHaveBeenCalled();
  });
});
