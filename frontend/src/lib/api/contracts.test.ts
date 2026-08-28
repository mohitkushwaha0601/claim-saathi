import { describe, expect, it } from "vitest";

import { hasSafeDemoMetadata } from "./contracts";

describe("shared API safety contracts", () => {
  it("accepts only explicitly synthetic, non-authoritative metadata", () => {
    expect(
      hasSafeDemoMetadata({
        environment: "DEMO",
        synthetic_data: true,
        real_government_action_performed: false,
      }),
    ).toBe(true);
    expect(
      hasSafeDemoMetadata({
        environment: "PRODUCTION",
        synthetic_data: false,
        real_government_action_performed: true,
      }),
    ).toBe(false);
    expect(hasSafeDemoMetadata(null)).toBe(false);
  });
});
