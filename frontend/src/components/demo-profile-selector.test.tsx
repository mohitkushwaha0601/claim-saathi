import { fireEvent, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { listDemoPersonas } from "@/lib/api/demo";
import type { DemoPersonaListResponse } from "@/lib/api/types";
import { renderWithProviders } from "@/test/render";

import { DemoProfileSelector } from "./demo-profile-selector";

vi.mock("@/lib/api/demo", () => ({ listDemoPersonas: vi.fn() }));

const response: DemoPersonaListResponse = {
  personas: [
    { persona_id: "RAVI_PARTIAL_READY", display_name: "Ravi", scenario: "ready", compatible_goal: "ACCESS_SOME_PF_FUNDS" },
    { persona_id: "PRIYA_TRANSFER_MISSING_EXIT", display_name: "Priya", scenario: "transfer", compatible_goal: "TRANSFER_PF_AFTER_EMPLOYMENT_CHANGE" },
  ],
  demo: { environment: "DEMO", synthetic_data: true, real_government_action_performed: false },
};

const listDemoPersonasMock = vi.mocked(listDemoPersonas);

describe("DemoProfileSelector", () => {
  it("loads synthetic profiles and persists the selected profile preference", async () => {
    listDemoPersonasMock.mockResolvedValue(response);
    renderWithProviders(<DemoProfileSelector />);

    const selector = await screen.findByRole("combobox", { name: "Demo profile" });
    expect(screen.getByRole("option", { name: "Ravi" })).toBeTruthy();
    fireEvent.change(selector, { target: { value: "PRIYA_TRANSFER_MISSING_EXIT" } });

    await waitFor(() => expect((selector as HTMLSelectElement).value).toBe("PRIYA_TRANSFER_MISSING_EXIT"));
    expect(window.localStorage.getItem("claimsaathi.demoPersona")).toBe("PRIYA_TRANSFER_MISSING_EXIT");
  });

  it("fails closed when the synthetic catalogue is unavailable", async () => {
    listDemoPersonasMock.mockRejectedValue(new Error("unavailable"));
    renderWithProviders(<DemoProfileSelector />);
    await waitFor(() => expect(screen.queryByRole("combobox")).toBeNull());
  });
});
