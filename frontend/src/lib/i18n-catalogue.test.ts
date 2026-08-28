import en from "../../messages/en.json";
import hi from "../../messages/hi.json";
import { describe, expect, it } from "vitest";

function leafPaths(value: unknown, prefix = ""): string[] {
  if (value === null || typeof value !== "object") return [prefix];
  return Object.entries(value).flatMap(([key, child]) =>
    leafPaths(child, prefix ? `${prefix}.${key}` : key),
  );
}

describe("message catalogues", () => {
  it("keep English and Hindi message keys in parity", () => {
    expect(leafPaths(hi).sort()).toEqual(leafPaths(en).sort());
  });
});
