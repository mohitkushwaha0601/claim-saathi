import { afterEach, describe, expect, it, vi } from "vitest";

import { normalizeApiBaseUrl } from "@/lib/config";

import {
  apiRequest,
  ClaimSaathiApiError,
  GENERIC_API_ERROR_MESSAGE,
} from "./client";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("typed API client errors", () => {
  it("preserves the backend safe error code, message, and status", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 409,
        json: async () => ({
          error: {
            code: "INVALID_RESOLUTION_ACTION",
            message: "The resolution action is not allowed in its current state.",
            request_id: null,
          },
        }),
      }),
    );

    const error = await apiRequest("/test").catch((caught) => caught);

    expect(error).toBeInstanceOf(ClaimSaathiApiError);
    expect(error).toMatchObject({
      code: "INVALID_RESOLUTION_ACTION",
      status: 409,
      message: "The resolution action is not allowed in its current state.",
    });
  });

  it("uses a friendly fallback for an unstructured response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ internal: "not shown" }),
      }),
    );

    const error = await apiRequest("/test").catch((caught) => caught);

    expect(error).toMatchObject({
      code: "UNEXPECTED_API_ERROR",
      status: 500,
      message: GENERIC_API_ERROR_MESSAGE,
    });
  });

  it("rejects malformed API-base configuration clearly", () => {
    expect(() => normalizeApiBaseUrl("not-a-url")).toThrow(
      "NEXT_PUBLIC_API_BASE_URL must be a valid absolute HTTP(S) URL.",
    );
  });
});
