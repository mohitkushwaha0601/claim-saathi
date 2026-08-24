import { afterEach, describe, expect, it, vi } from "vitest";

import { createDecisionExplanation } from "./explanations";

const DEMO = {
  environment: "DEMO",
  synthetic_data: true,
  real_government_action_performed: false,
} as const;

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("decision explanation API client", () => {
  it("posts only SIMPLE_ENGLISH mode to the stored-decision endpoint", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          decision_id: "DEC/one",
          mode: "SIMPLE_ENGLISH",
          title: "Ready to proceed",
          summary: "The configured checks currently pass.",
          points: ["The process is Form 31."],
          disclaimer: "This does not change the stored result.",
          ai_used_for_decision: false,
          ai_used_for_explanation: false,
          fallback_used: true,
          demo: DEMO,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    await createDecisionExplanation("JRN one", "DEC/one", "SIMPLE_ENGLISH");

    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain(
      "/api/v1/journeys/JRN%20one/decisions/DEC%2Fone/explanations",
    );
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual({
      mode: "SIMPLE_ENGLISH",
    });
  });

  it("sends HINDI without a prompt, model, or arbitrary instruction", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          decision_id: "DEC-HI",
          mode: "HINDI",
          title: "जाँच पूरी हुई",
          summary: "पहचानी गई प्रक्रिया Form 31 है।",
          points: ["स्टोर किया गया परिणाम नहीं बदला है।"],
          disclaimer: "AI ने यह निर्णय नहीं लिया।",
          ai_used_for_decision: false,
          ai_used_for_explanation: true,
          fallback_used: false,
          demo: DEMO,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    await createDecisionExplanation("JRN-HI", "DEC-HI", "HINDI");

    const body = JSON.parse(fetchMock.mock.calls[0][1].body as string);
    expect(body).toEqual({ mode: "HINDI" });
    expect(body).not.toHaveProperty("prompt");
    expect(body).not.toHaveProperty("model");
    expect(body).not.toHaveProperty("instructions");
  });
});
