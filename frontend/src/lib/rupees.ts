export type RupeeValidation =
  | { ok: true; value: number }
  | { ok: false; reason: "required" | "invalid" };

export function validatePositiveIntegerRupees(input: string): RupeeValidation {
  const normalized = input.trim().replaceAll(",", "");

  if (!normalized) {
    return { ok: false, reason: "required" };
  }
  if (!/^\d+$/.test(normalized)) {
    return { ok: false, reason: "invalid" };
  }

  const value = Number(normalized);
  if (!Number.isSafeInteger(value) || value <= 0) {
    return { ok: false, reason: "invalid" };
  }

  return { ok: true, value };
}
