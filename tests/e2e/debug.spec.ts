import { expect, test, type Page } from "@playwright/test";

const overlay = (page: Page) => page.locator("[data-line-debug]");

const idleMeasured = (page: Page) =>
  expect(overlay(page)).toContainText(/refreshHz: [1-9]/, { timeout: 10_000 });

interface DebugResult {
  rafFrames: number;
  to: number;
  browser: string;
  droppedFrames: number;
  gapMs: { max: number };
}

const result = (page: Page) =>
  page.evaluate(() => (window as unknown as { __lineDebug: DebugResult }).__lineDebug);

test("without the flag there is no overlay and the debug code is not fetched", async ({ page }) => {
  const requests: string[] = [];
  page.on("request", (request) => requests.push(request.url()));
  await page.goto("/");
  await page.waitForSelector(".line-stage[data-ready]");
  await page.getByRole("link", { name: "Projects & Blog" }).click();
  await expect(page.locator("h1")).toHaveText("Projects & Blog");
  await expect(overlay(page)).toHaveCount(0);
  expect(requests.filter((url) => /debug/.test(url))).toEqual([]);
});

test("?debug=line shows the overlay, and it survives a route change", async ({ page }) => {
  await page.goto("/?debug=line");
  await page.waitForSelector(".line-stage[data-ready]");
  await expect(overlay(page)).toBeVisible();
  await idleMeasured(page);
  // The overlay covers the bottom of a phone screen, where the fork sits, so the link is followed from the keyboard.
  await page.getByRole("link", { name: "Projects & Blog" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("h1")).toHaveText("Projects & Blog");
  await expect(page).not.toHaveURL(/debug/);
  await expect(overlay(page)).toHaveAttribute("data-state", "done");
  await expect(overlay(page)).toContainText("rafFrames");
  const first = await result(page);
  expect(first.rafFrames).toBeGreaterThan(20);
  expect(first.browser).toMatch(/Chrome/);

  await page.locator("[data-back]").getByRole("link").click();
  await expect(page.locator("h1")).toHaveText("Sadig Akhund");
  await expect.poll(async () => (await result(page)).to).toBe(0);
  await expect(overlay(page)).toHaveCount(1);
});

test("a planted 200 ms block shows up as dropped frames and a long gap", async ({ page }) => {
  await page.addInitScript(() => {
    document.addEventListener("line:transition-start", () =>
      setTimeout(() => {
        const until = performance.now() + 200;
        while (performance.now() < until);
      }, 300),
    );
  });
  await page.goto("/?debug=line");
  await page.waitForSelector(".line-stage[data-ready]");
  await idleMeasured(page);
  await page.getByRole("link", { name: "Personal" }).click();
  await expect(overlay(page)).toHaveAttribute("data-state", "done");
  const planted = await result(page);
  console.log("planted block", JSON.stringify(planted));
  expect(planted.gapMs.max).toBeGreaterThan(150);
  expect(planted.gapMs.max).toBeLessThan(400);
  expect(planted.droppedFrames).toBeGreaterThanOrEqual(6);
});

test("the grid layer is on with no URL param", async ({ page }) => {
  await page.goto("/");
  const image = await page.evaluate(() => getComputedStyle(document.querySelector(".line-world")!, "::before").backgroundImage);
  expect(image).toContain("radial-gradient");
});
