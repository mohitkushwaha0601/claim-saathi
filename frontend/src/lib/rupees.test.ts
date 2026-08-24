import { describe, expect, it } from "vitest";

import { validatePositiveIntegerRupees } from "./rupees";

describe("integer-rupee input validation", () => {
  it.each(["", "0", "-1", "12.5", "ten", "1e4"])(
    "rejects invalid input %j",
    (input) => {
      expect(validatePositiveIntegerRupees(input).ok).toBe(false);
    },
  );

  it("accepts a positive integer with display commas", () => {
    expect(validatePositiveIntegerRupees("80,000")).toEqual({
      ok: true,
      value: 80_000,
    });
  });

  it("contains no policy-limit calculation", () => {
    expect(validatePositiveIntegerRupees("999999")).toEqual({
      ok: true,
      value: 999_999,
    });
  });
});
