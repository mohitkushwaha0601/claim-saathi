export type RupeeValidation =
  | { ok: true; value: number }
  | { ok: false; message: string };

export function validatePositiveIntegerRupees(input: string): RupeeValidation {
  const normalized = input.trim().replaceAll(",", "");

  if (!normalized) {
    return { ok: false, message: "Enter an amount in whole rupees." };
  }
  if (!/^\d+$/.test(normalized)) {
    return { ok: false, message: "Use a positive whole-rupee amount." };
  }

  const value = Number(normalized);
  if (!Number.isSafeInteger(value) || value <= 0) {
    return { ok: false, message: "Use a positive whole-rupee amount." };
  }

  return { ok: true, value };
}
