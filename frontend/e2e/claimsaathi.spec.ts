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
  await expectNoHorizontalOverflow(page);
  await expectReadOnlyReload(page, "Policy verification required");
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
  for (const width of [320, 375, 390, 430, 1280, 1440]) {
    await page.setViewportSize({ width, height: width < 600 ? 844 : 900 });
    await page.goto("/");
    await expect(page.locator("main")).toHaveCount(1);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expectNoHorizontalOverflow(page);

    await page.goto("/how-it-works");
    await expect(page.locator("main")).toHaveCount(1);
    await expectNoHorizontalOverflow(page);
  }
});

test("unknown pages have a distinct product-level not-found recovery", async ({
  page,
}) => {
  await page.goto("/not-a-claimsaathi-page");
  await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Return to ClaimSaathi" })).toBeVisible();
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
