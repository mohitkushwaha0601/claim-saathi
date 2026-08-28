import {
  expect,
  test as base,
  type Locator,
  type Page,
} from "@playwright/test";

const API_ORIGIN = "http://localhost:8000";

const test = base.extend<{ browserErrors: string[] }>({
  browserErrors: [
    async ({ page }, use) => {
      const browserErrors: string[] = [];
      page.on("console", (message) => {
        if (message.type() === "error") browserErrors.push(message.text());
      });
      page.on("pageerror", (error) => browserErrors.push(error.message));
      await use(browserErrors);
      const pathname = new URL(page.url()).pathname;
      const expectedNotFoundPage =
        pathname === "/not-a-claimsaathi-page" ||
        pathname === "/journey/JRN-EXPIRED-AFTER-BACKEND-RESTART";
      const unexpectedErrors = browserErrors.filter(
        (message) =>
          !(
            expectedNotFoundPage &&
            message.includes("status of 404")
          ),
      );
      expect(unexpectedErrors, "application console and page errors").toEqual(
        [],
      );
    },
    { auto: true },
  ],
});

async function activateWithKeyboard(locator: Locator, page: Page) {
  await locator.focus();
  await expect(locator).toBeFocused();
  await page.keyboard.press("Enter");
}

async function switchToHindi(page: Page) {
  const settings = page.getByLabel("Accessibility settings");
  await activateWithKeyboard(settings, page);
  await activateWithKeyboard(
    page.getByRole("button", { name: "हिंदी", exact: true }),
    page,
  );
  await expect(page.locator("html")).toHaveAttribute("lang", "hi");
}

async function increaseTextTo200(page: Page) {
  const settings = page.getByLabel(/Accessibility settings|सुलभता सेटिंग/);
  if (!(await settings.evaluate((element) => element.parentElement?.hasAttribute("open")))) {
    await activateWithKeyboard(settings, page);
  }
  const increase = page.getByRole("button", {
    name: /Increase text size|टेक्स्ट का आकार बढ़ाएँ/,
  });
  for (let step = 0; step < 4; step += 1) await activateWithKeyboard(increase, page);
  await expect(page.locator("html")).toHaveAttribute("data-text-scale", "200");
  await expect(increase).toBeDisabled();
}

async function expectReadOnlyReload(
  page: Page,
  expectedHeading: string,
): Promise<string[]> {
  const methods: string[] = [];
  const recordRequest = (request: { url(): string; method(): string }) => {
    if (request.url().startsWith(`${API_ORIGIN}/api/v1/`)) {
      methods.push(request.method());
    }
  };
  page.on("request", recordRequest);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: expectedHeading, exact: true }),
  ).toBeVisible();
  await page.waitForLoadState("networkidle");
  page.off("request", recordRequest);

  expect(methods.length).toBeGreaterThan(0);
  expect(methods.every((method) => method === "GET")).toBe(true);
  return methods;
}

async function expectNoHorizontalOverflow(page: Page) {
  const metrics = await page.evaluate(() => ({
    viewportWidth: window.innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
    overflowingElements: Array.from(document.querySelectorAll("body *"))
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          tag: element.tagName,
          text: element.textContent?.trim().slice(0, 80) ?? "",
          left: Math.round(rect.left),
          right: Math.round(rect.right),
          width: Math.round(rect.width),
        };
      })
      .filter(
        (element) =>
          element.left < -1 || element.right > window.innerWidth + 1,
      )
      .slice(0, 8),
  }));
  expect(
    metrics.scrollWidth,
    JSON.stringify(metrics.overflowingElements),
  ).toBeLessThanOrEqual(metrics.viewportWidth);
}

test("Ravi completes the backend PASS path and refresh remains read-only", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 844 });
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "What do you want to do with your PF?",
  );
  await page.getByRole("button", { name: /I need some money from my PF/ }).click();
  await page.getByLabel("Amount in rupees").fill("80000");
  await page.getByRole("button", { name: "Prepare my journey" }).click();

  await expect(page).toHaveURL(/\/journey\//);
  await expect(page.getByText("Not checked yet", { exact: true })).toBeVisible();
  await expect(page.getByText("Form 31", { exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Check my journey" }).click();

  await expect(
    page.getByRole("heading", { name: "Ready to proceed", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Form 31", { exact: true })).toBeVisible();
  await expect(page.getByText("UAN ready", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Explain simply" }).click();
  await expect(page.getByText("Plain-language explanation", { exact: true })).toBeVisible();
  await expect(page.getByText("AI-assisted explanation", { exact: true })).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Ready to proceed", exact: true }).first(),
  ).toBeVisible();
  await expect(page.getByText("Form 31", { exact: true })).toBeVisible();
  await increaseTextTo200(page);
  await expectNoHorizontalOverflow(page);
  await expectReadOnlyReload(page, "Ready to proceed");
  await expect(page.getByText("Form 31", { exact: true })).toBeVisible();
});

test("Priya completes resolution, reverification, and explicit full reevaluation by keyboard", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await activateWithKeyboard(
    page.getByRole("button", {
      name: /I changed jobs and want to move my old PF/,
    }),
    page,
  );
  await expect(page).toHaveURL(/\/journey\//);

  await activateWithKeyboard(
    page.getByRole("button", { name: "Check my journey" }),
    page,
  );
  await expect(
    page.getByRole("heading", { name: "Action required", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Previous employment Date of Exit is missing", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.getByText("Form 13", { exact: true })).toHaveCount(0);

  await activateWithKeyboard(
    page.getByRole("button", { name: "Start resolution" }),
    page,
  );
  await expect(
    page.getByRole("heading", { name: "Your action is needed", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Member Unified Portal", { exact: true })).toBeVisible();

  await activateWithKeyboard(
    page.getByRole("button", { name: "I've started the official step" }),
    page,
  );
  await expect(
    page.getByRole("heading", { name: "Waiting for record update", exact: true }),
  ).toBeVisible();
  await expectReadOnlyReload(page, "Waiting for record update");

  await activateWithKeyboard(
    page.getByRole("button", { name: "Check for update" }),
    page,
  );
  await expect(
    page.getByRole("heading", { name: "Not updated yet", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Demo only", { exact: true })).toBeVisible();
  await expectNoHorizontalOverflow(page);

  await activateWithKeyboard(
    page.getByRole("button", { name: "Simulate Date of Exit update" }),
    page,
  );
  await expect(page.getByText("Synthetic record updated.", { exact: true })).toBeVisible();
  await expect(
    page.getByText("Real government action performed: false", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Blocker resolved", { exact: true })).toHaveCount(0);

  await activateWithKeyboard(
    page.getByRole("button", { name: "I've started the official step again" }),
    page,
  );
  await expect(
    page.getByRole("heading", { name: "Waiting for record update", exact: true }),
  ).toBeVisible();
  await activateWithKeyboard(
    page.getByRole("button", { name: "Check for update" }),
    page,
  );
  await expect(
    page.getByRole("heading", { name: "Blocker resolved", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Form 13", { exact: true })).toHaveCount(0);
  await expect(
    page.getByText(
      "This does not automatically mean the whole transfer journey is ready.",
      { exact: true },
    ),
  ).toBeVisible();

  await activateWithKeyboard(
    page.getByRole("button", { name: "Check journey again" }),
    page,
  );
  await expect(
    page.getByRole("heading", { name: "Ready to proceed", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Form 13", { exact: true })).toBeVisible();
  await expect(page.getByText("Earlier check", { exact: true })).toBeVisible();
  await expect(page.getByText("Latest check", { exact: true })).toBeVisible();
  await increaseTextTo200(page);
  await expectNoHorizontalOverflow(page);
  await expectReadOnlyReload(page, "Ready to proceed");
});

test("Arjun displays an intentional policy safe stop and refresh remains read-only", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: /I left my job and want my PF/ }).click();
  await expect(page).toHaveURL(/\/journey\//);
  await expect(page.getByText("Form 19", { exact: true })).toHaveCount(0);

  await page.getByRole("button", { name: "Check my journey" }).click();
  await expect(
    page.getByRole("heading", {
      name: "Policy verification required",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByText("ClaimSaathi stopped instead of guessing.", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Form 19", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Ready to proceed", exact: true }),
  ).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Start resolution/ })).toHaveCount(0);
  await expect(page.getByText("AI was not used to fill the policy gap.")).toBeVisible();
  await increaseTextTo200(page);
  await expectNoHorizontalOverflow(page);
  await expectReadOnlyReload(page, "Policy verification required");
});

test("language and text preferences preserve Ravi's route, Decision ID, and PASS result", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: /I need some money from my PF/ }).click();
  await page.getByLabel("Amount in rupees").fill("80000");
  await page.getByRole("button", { name: "Prepare my journey" }).click();
  await page.getByRole("button", { name: "Check my journey" }).click();
  await expect(page.getByRole("heading", { name: "Ready to proceed" })).toBeVisible();

  await page.getByText("Technical details").click();
  const decisionId = await page.locator("dd").filter({ hasText: /^DEC-/ }).first().textContent();
  const journeyUrl = page.url();
  let postsDuringSwitch = 0;
  page.on("request", (request) => {
    if (request.method() === "POST") postsDuringSwitch += 1;
  });

  await switchToHindi(page);
  await expect(page).toHaveURL(journeyUrl);
  await expect(page.getByText(decisionId!, { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "आगे बढ़ने के लिए तैयार" })).toBeVisible();
  await expect(page.getByText("Form 31", { exact: true })).toBeVisible();
  expect(postsDuringSwitch).toBe(0);

  await increaseTextTo200(page);
  await expect(page.getByRole("heading", { name: "आगे बढ़ने के लिए तैयार" })).toBeVisible();
  await expect(page.getByRole("button", { name: "फिर जाँचें" })).toBeVisible();
  await expectNoHorizontalOverflow(page);

  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("lang", "hi");
  await expect(page.locator("html")).toHaveAttribute("data-text-scale", "200");
  await page.getByText("तकनीकी विवरण").click();
  await expect(page.getByText(decisionId!, { exact: true })).toBeVisible();
});

test("Priya's Hindi resolution remains ACTION_REQUIRED until explicit reevaluation", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await switchToHindi(page);
  await page.getByRole("button", { name: /मैंने नौकरी बदली है/ }).click();
  await page.getByRole("button", { name: "मेरी यात्रा जाँचें" }).click();
  await expect(page.getByRole("heading", { name: "कार्रवाई आवश्यक" })).toBeVisible();
  await expect(page.getByText("पिछले रोजगार की Date of Exit दर्ज नहीं है")).toBeVisible();

  await page.getByRole("button", { name: "समाधान शुरू करें" }).click();
  await page.getByRole("button", { name: "मैंने आधिकारिक चरण शुरू कर दिया है" }).click();
  await page.getByRole("button", { name: "अपडेट जाँचें" }).click();
  await expect(page.getByRole("heading", { name: "अभी अपडेट नहीं हुआ" })).toBeVisible();
  await page.getByRole("button", { name: "Date of Exit अपडेट का अनुकरण करें" }).click();
  await page.getByRole("button", { name: "मैंने आधिकारिक चरण फिर शुरू किया है" }).click();
  await page.getByRole("button", { name: "अपडेट जाँचें" }).click();
  await expect(page.getByRole("heading", { name: "रुकावट हल हुई" })).toBeVisible();
  await expect(page.getByText("Form 13", { exact: true })).toHaveCount(0);

  await page.getByRole("button", { name: "यात्रा फिर जाँचें" }).click();
  await expect(page.getByRole("heading", { name: "आगे बढ़ने के लिए तैयार" })).toBeVisible();
  await expect(page.getByText("Form 13", { exact: true })).toBeVisible();
  await increaseTextTo200(page);
  await expectNoHorizontalOverflow(page);
});

test("Arjun's Hindi safe stop preserves POLICY_REVIEW_REQUIRED and Form 19", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 844 });
  await page.goto("/");
  await switchToHindi(page);
  await page.getByRole("button", { name: /मैंने नौकरी छोड़ दी है/ }).click();
  await page.getByRole("button", { name: "मेरी यात्रा जाँचें" }).click();
  await expect(page.getByRole("heading", { name: "नीति सत्यापन आवश्यक" })).toBeVisible();
  await expect(
    page.getByText("ClaimSaathi ने अनुमान लगाने के बजाय प्रक्रिया रोक दी।"),
  ).toBeVisible();
  await expect(page.getByText("Form 19", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "आगे बढ़ने के लिए तैयार" })).toHaveCount(0);
  const text = await page.locator("main").innerText();
  expect(text).not.toMatch(/\b\d+\s*(?:दिन|महीने?)\b/);
  await increaseTextTo200(page);
  await expectNoHorizontalOverflow(page);
});

test("slow journey evaluation shows one pending infrastructure request and no policy error", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: /I need some money from my PF/ }).click();
  await page.getByLabel("Amount in rupees").fill("80000");
  await page.getByRole("button", { name: "Prepare my journey" }).click();

  let evaluations = 0;
  await page.route("**/evaluate", async (route) => {
    evaluations += 1;
    await new Promise((resolve) => setTimeout(resolve, 900));
    await route.continue();
  });
  const check = page.getByRole("button", { name: "Check my journey" });
  await check.click();
  await expect(page.getByRole("button", { name: "Checking your journey…" })).toBeDisabled();
  await expect(
    page.getByText("Reviewing configured rules and synthetic records."),
  ).toBeVisible();
  await expect(page.getByText(/slow connection/)).toHaveCount(0);
  await expect(page.getByText("Unable to verify", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Ready to proceed" })).toBeVisible();
  expect(evaluations).toBe(1);
});

test("System Explorer generates a real Ravi trace and exposes interactive backend detail", async ({
  page,
}) => {
  await page.goto("/how-it-works");
  await expect(
    page.getByRole("heading", { name: "From form hunting to guided journeys" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Generate synthetic trace" }).click();
  await expect(page.getByText("Ravi's stored decision", { exact: true })).toBeVisible();

  const policyStage = page.getByRole("button", { name: /Stage 3: Policy Engine/ });
  await activateWithKeyboard(policyStage, page);
  await expect(page.getByRole("heading", { name: "Policy Engine" })).toBeVisible();
  await expect(page.getByText("P31-UAN-001", { exact: true })).toBeVisible();
  await expect(page.getByText("AI used", { exact: true })).toBeVisible();
  await expect(page.getByText("No", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Inspect official source metadata" }),
  ).toBeVisible();

  const graphStage = page.getByRole("button", {
    name: /Stage 4: Prerequisite Graph/,
  });
  await activateWithKeyboard(graphStage, page);
  await expect(page.getByLabel("Connected prerequisite graph")).toBeVisible();
  await expect(page.getByText("Partial withdrawal prerequisites", { exact: true })).toBeVisible();
});

test("core pages remain usable without horizontal overflow at submission viewports", async ({
  page,
}) => {
  for (const width of [320, 390, 1280]) {
    await page.setViewportSize({ width, height: width < 600 ? 844 : 900 });
    await page.goto("/");
    for (const locale of ["en", "hi"] as const) {
      for (const scale of ["100", "200"] as const) {
        await page.evaluate(
          ({ nextLocale, nextScale }) => {
            localStorage.setItem("claimsaathi.locale", nextLocale);
            localStorage.setItem("claimsaathi.textScale", nextScale);
          },
          { nextLocale: locale, nextScale: scale },
        );
        await page.reload();
        await expect(page.locator("html")).toHaveAttribute("lang", locale);
        await expect(page.locator("html")).toHaveAttribute("data-text-scale", scale);
        await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
        await expect(page.getByLabel(/Accessibility settings|सुलभता सेटिंग/)).toBeVisible();
        await expectNoHorizontalOverflow(page);

        await page.goto("/how-it-works");
        await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
        await expect(page.getByRole("button", { name: /Generate synthetic trace|सिंथेटिक ट्रेस तैयार करें/ })).toBeVisible();
        await expectNoHorizontalOverflow(page);
        await page.goto("/");
      }
    }
  }
});

test("unknown pages have a distinct product-level not-found recovery", async ({
  page,
}) => {
  await page.goto("/not-a-claimsaathi-page");
  await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Return to ClaimSaathi" })).toBeVisible();
});

test("unsupported service lookups remain clearly informational", async ({
  page,
}) => {
  await page.goto("/services/claim-status");
  await expect(
    page.getByRole("heading", { name: "Claim status help", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("This lookup is not configured", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText(/does not have a live claim-status/),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Learn how ClaimSaathi works" }),
  ).toHaveAttribute("href", "/how-it-works");
});

test("expired in-memory journeys have a frontend-only restart path", async ({
  page,
}) => {
  await page.goto("/journey/JRN-EXPIRED-AFTER-BACKEND-RESTART");
  await expect(
    page.getByRole("heading", { name: "Demo journey expired" }),
  ).toBeVisible();
  await expect(
    page.getByText("Demo journeys reset when the backend restarts."),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Start a new journey" })).toHaveAttribute(
    "href",
    "/",
  );
  await expect(page.getByText("Unable to verify", { exact: true })).toHaveCount(0);
});
