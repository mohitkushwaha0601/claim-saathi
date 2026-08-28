import type { DemoMetadata } from "./types";

/** Every government-shaped response must carry explicit synthetic boundaries. */
export function hasSafeDemoMetadata(value: unknown): value is DemoMetadata {
  if (!value || typeof value !== "object") return false;
  const demo = value as Record<string, unknown>;
  return (
    demo.environment === "DEMO" &&
    demo.synthetic_data === true &&
    demo.real_government_action_performed === false
  );
}
