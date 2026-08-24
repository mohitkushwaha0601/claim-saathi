import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getPolicySource } from "@/lib/api/policy";
import type { PolicySourceResponse } from "@/lib/api/types";

import { PolicySources } from "./policy-sources";

vi.mock("@/lib/api/policy", () => ({
  getPolicySource: vi.fn(),
}));

const getPolicySourceMock = vi.mocked(getPolicySource);

const SOURCE: PolicySourceResponse = {
  source_id: "SRC-TEST",
  authority: "Synthetic authority",
  title: "Reviewed source metadata",
  document_type: "WEB_PAGE",
  published_at: null,
  effective_from: null,
  effective_to: null,
  reference_url: "https://example.test/official-source",
  corroborating_urls: [],
  verified_at: "2026-08-24T00:00:00Z",
  scope: "Synthetic test scope",
  notes: null,
  status: "ACTIVE",
  demo: {
    environment: "DEMO",
    synthetic_data: true,
    real_government_action_performed: false,
  },
};

describe("reviewed policy source presentation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deduplicates concurrent source requests and gives links descriptive names", async () => {
    let resolveSource!: (source: PolicySourceResponse) => void;
    getPolicySourceMock.mockReturnValue(
      new Promise((resolve) => {
        resolveSource = resolve;
      }),
    );

    render(
      <>
        <PolicySources sourceIds={[SOURCE.source_id]} heading="Rule source" />
        <PolicySources
          sourceIds={[SOURCE.source_id]}
          heading="Process source"
        />
      </>,
    );

    expect(getPolicySourceMock).toHaveBeenCalledOnce();
    resolveSource(SOURCE);

    expect((await screen.findAllByText(SOURCE.title)).length).toBe(2);
    expect(
      screen.getAllByRole("link", {
        name: `View official source: ${SOURCE.title}`,
      }).length,
    ).toBe(2);
  });

  it("allows an explicit retry after source metadata fails", async () => {
    getPolicySourceMock
      .mockRejectedValueOnce(new Error("network detail"))
      .mockResolvedValueOnce(SOURCE);
    render(<PolicySources sourceIds={[SOURCE.source_id]} />);

    fireEvent.click(await screen.findByRole("button", { name: "Try again" }));

    expect(await screen.findByText(SOURCE.title)).toBeTruthy();
    expect(getPolicySourceMock).toHaveBeenCalledTimes(2);
    expect(screen.queryByText("network detail")).toBeNull();
  });
});
