import { expect, test } from "@playwright/test";

async function waitForServiceWorker(page: import("@playwright/test").Page) {
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) {
      await new Promise<void>((resolve) => {
        navigator.serviceWorker.addEventListener("controllerchange", () => resolve(), {
          once: true,
        });
      });
    }
  });
}

test("static Hindi shell works offline while journey mutations remain NetworkOnly", async ({
  context,
  page,
}) => {
  await page.goto("/");
  await waitForServiceWorker(page);
  await page.reload();

  await page.getByLabel("Accessibility settings").click();
  await page.getByRole("button", { name: "हिंदी", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "आप अपने PF के साथ क्या करना चाहते हैं?" }),
  ).toBeVisible();

  await page.goto("/how-it-works");
  await expect(page.getByText("इंटरैक्टिव सिस्टम एक्सप्लोरर")).toBeVisible();
  await page.goto("/");

  await page.getByRole("button", { name: /मुझे अपने PF से कुछ पैसे चाहिए/ }).click();
  await page.getByLabel("रुपये में राशि").fill("80000");
  await page.getByRole("button", { name: "मेरी यात्रा तैयार करें" }).click();
  await page.getByRole("button", { name: "मेरी यात्रा जाँचें" }).click();
  await expect(
    page.getByRole("heading", { name: "आगे बढ़ने के लिए तैयार" }),
  ).toBeVisible();
  await expect(page.getByText("Form 31", { exact: true })).toBeVisible();

  let postCount = 0;
  page.on("request", (request) => {
    if (request.method() === "POST") postCount += 1;
  });
  await context.setOffline(true);
  await expect(page.getByText(/ऑफ़लाइन — यात्रा जाँच/)).toBeVisible();
  await expect(page.getByText("पहले लोड किया गया परिणाम")).toBeVisible();
  await page.getByRole("button", { name: "फिर जाँचें" }).click();
  await expect(page.getByText(/कोई यात्रा कार्रवाई भेजी नहीं गई/)).toBeVisible();
  expect(postCount).toBe(0);
  await expect(
    page.getByRole("heading", { name: "आगे बढ़ने के लिए तैयार" }),
  ).toBeVisible();

  await context.setOffline(false);
  await expect(page.getByText(/ऑफ़लाइन — यात्रा जाँच/)).toHaveCount(0);
  await page.waitForTimeout(500);
  expect(postCount).toBe(0);

  await page.goto("/how-it-works");
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByText("इंटरैक्टिव सिस्टम एक्सप्लोरर")).toBeVisible();
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "आप अपने PF के साथ क्या करना चाहते हैं?" }),
  ).toBeVisible();

  const unsafeCacheEntries = await page.evaluate(async () => {
    const entries = await Promise.all(
      (await caches.keys()).map(async (name) =>
        (await caches.open(name)).keys().then((requests) => requests.map((item) => item.url)),
      ),
    );
    return entries.flat().filter((url) => {
      const pathname = new URL(url).pathname;
      return pathname.startsWith("/api/") || pathname.startsWith("/journey/");
    });
  });
  expect(unsafeCacheEntries).toEqual([]);

  await page.goto("/journey/JRN-NOT-CACHED");
  await expect(page.getByRole("heading", { name: "यह डेमो यात्रा लोड नहीं हो सकी" })).toBeVisible();
  await expect(page.getByText(/आप ऑफ़लाइन हैं.*कोई यात्रा कार्रवाई भेजी नहीं गई/)).toBeVisible();
  await expect(page.getByText("नीति सत्यापन आवश्यक", { exact: true })).toHaveCount(0);

  await page.goto("/offline");
  await expect(page.getByRole("heading", { name: "आप ऑफ़लाइन हैं" })).toBeVisible();
});
