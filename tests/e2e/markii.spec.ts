import { expect, test, type Page } from "@playwright/test";

const SCRIPTED = "/projects-blog/projects/markii";
const TOTAL = ".mk-value";
const HOST_CODE = /browser-worker|browser\.[\w-]+\.js|useNoteRun-browser/i;

/** Every script URL the page requests, collected from the start. */
function collectScripts(page: Page): string[] {
  const scripts: string[] = [];
  page.on("request", (req) => {
    if (req.resourceType() === "script" || req.url().includes("worker")) scripts.push(req.url());
  });
  return scripts;
}

test.describe("notes without scripts", () => {
  test.use({ javaScriptEnabled: false });

  test("the career note is in the static HTML", async ({ page }) => {
    await page.goto("/professional/career");
    await expect(page.locator(".note h2").first()).toHaveText("KDM Force");
    await expect(page.locator(".note")).toContainText("Cut new-environment bring-up from 5–6 hours");
  });

  test("a role line written as one emphasis run renders as detail text", async ({ page }) => {
    await page.goto("/professional/career");
    const role = page.locator(".note > p.note-detail").first();
    await expect(role).toHaveText("Data platform engineer. Remote, Rome. Jun 2022 to Nov 2025.");
    await expect(role.locator("em")).toHaveCount(0);
  });
});

test("a note with no scripts loads no markii script and has no note bar", async ({ page }) => {
  const scripts = collectScripts(page);
  await page.goto("/professional/career");
  await page.waitForLoadState("networkidle");
  expect(scripts.filter((url) => /NoteIsland|browser-worker|@markii/i.test(url))).toEqual([]);
  await expect(page.locator(".note-bar")).toHaveCount(0);
});

test("a note with scripts carries the build's values with JavaScript off", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(SCRIPTED);
  // The build ran the note, so the value is in the HTML and reads stale.
  await expect(page.locator(TOTAL).first()).toHaveClass(/mk-value--stale/);
  await expect(page.locator(".note-bar")).toContainText(/Updated [A-Z][a-z]{2} \d{4}/);
  await context.close();
});

test("a first visit loads no host and keeps the build's values", async ({ page }) => {
  const scripts = collectScripts(page);
  await page.goto(SCRIPTED);
  await expect(page.getByRole("button", { name: "Update" })).toBeEnabled();
  await page.waitForLoadState("networkidle");
  expect(scripts.filter((url) => HOST_CODE.test(url))).toEqual([]);
  await expect(page.locator(".note-bar")).toHaveAttribute("data-runs", "0");
  await expect(page.locator(TOTAL).first()).toHaveClass(/mk-value--stale/);
});

test("the update controls sit in the leaf header, above the note", async ({ page }) => {
  await page.goto(SCRIPTED);
  const [head, bar, note] = await page.evaluate(() =>
    [".leaf-head", ".note-bar", ".note"].map((selector) => document.querySelector(selector)!.getBoundingClientRect()),
  );
  expect(bar.top).toBeGreaterThanOrEqual(head.top);
  expect(bar.bottom).toBeLessThanOrEqual(head.bottom + 1);
  expect(note.top).toBeGreaterThan(head.bottom);
});

const headLayout = (page: import("@playwright/test").Page) =>
  page.evaluate(() => {
    const [head, age, button, back] = [".leaf-head", ".note-bar-age", ".note-bar-refresh", "[data-back] a"].map((selector) =>
      document.querySelector(selector)!.getBoundingClientRect().toJSON(),
    );
    return { head, age, button, back };
  });

for (const [width, rows] of [[1280, 1], [360, 1], [320, 2]] as const) {
  test(`at ${width}px the header takes ${rows} row(s), and Update clears its line`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.goto(SCRIPTED);
    await page.waitForSelector(".leaf-surface[data-head-fit], .leaf-surface[data-head-wrap]");
    const { head, age, button, back } = await headLayout(page);
    expect(head.bottom - button.bottom).toBeGreaterThanOrEqual(10);
    expect(button.left - age.right).toBeLessThanOrEqual(16);
    if (rows === 1) {
      expect(Math.abs(back.top + back.height / 2 - (button.top + button.height / 2))).toBeLessThanOrEqual(2);
      expect(age.left - back.right).toBeGreaterThanOrEqual(-1);
    } else {
      expect(age.top).toBeGreaterThanOrEqual(back.bottom - 1);
    }
  });
}

test("a longer age moves the update controls to a second row instead of under Back", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto(SCRIPTED);
  await page.waitForSelector(".leaf-surface[data-head-fit]");
  await page.locator(".note-bar-age").evaluate((age) => (age.lastChild!.textContent = "48 minutes ago, and more"));
  await page.waitForSelector(".leaf-surface[data-head-wrap]");
  const { age, back } = await headLayout(page);
  expect(age.top).toBeGreaterThanOrEqual(back.bottom - 1);
});

test("refreshing asks with markii's own words, and a no keeps the values", async ({ page }) => {
  await page.goto(SCRIPTED);
  const before = await page.locator(TOTAL).first().textContent();
  await page.getByRole("button", { name: "Update" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("heading")).toHaveText("Update from api.github.com?");
  await expect(dialog.getByText(/^This page's scripts can send data to api\.github\.com\./)).toBeVisible();
  await dialog.getByRole("button", { name: "Don't allow" }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.locator(".note-bar")).toHaveAttribute("data-runs", "1", { timeout: 15000 });
  await expect(page.getByText(/^Not allowed\. Showing data from [A-Z][a-z]{2} \d{4}\.$/)).toBeVisible();
  await expect(page.locator(TOTAL).first()).toHaveText(before ?? "");
  await expect(page.locator(TOTAL).first()).toHaveClass(/mk-value--stale/);
});

test("after a refresh, opening the note runs it without a prompt", async ({ page }) => {
  await page.goto(SCRIPTED);
  await page.getByRole("button", { name: "Update" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Don't allow" }).click();
  await expect(page.locator(".note-bar")).toHaveAttribute("data-runs", "1", { timeout: 15000 });
  await page.reload();
  await expect(page.locator(".note-bar")).toHaveAttribute("data-runs", "1", { timeout: 15000 });
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("script markers stay hidden while the note renders", async ({ page }) => {
  await page.goto(SCRIPTED);
  await expect(page.locator(".mk-script").first()).toBeAttached();
  await expect(page.locator(".mk-script").first()).toBeHidden();
});

test("prose, a video, and a stat row end at the same edge", async ({ page }, info) => {
  test.skip(info.project.name !== "desktop", "measured at 1280");
  await page.goto("/projects-blog/projects/mandible");
  const edge = (selector: string) => page.locator(`.note ${selector}`).evaluateAll((els) => els.map((el) => el.getBoundingClientRect().right));
  const prose = await edge("> p:not(.note-detail)");
  expect(prose.length).toBeGreaterThan(1);
  const figure = (await edge("> .mk-video"))[0];
  for (const right of [...prose, ...(await edge("> .mk-row"))]) expect(Math.abs(right - figure)).toBeLessThanOrEqual(1);
});

test("every leaf ends in one foot with the contact links and the Markii credit", async ({ page }) => {
  await page.goto("/professional/career");
  await expect(page.locator("footer")).toHaveCount(1);
  await expect(page.locator("footer .markii-credit")).toHaveAttribute("href", "https://github.com/markii-org/markii");
  await expect(page.locator("footer .markii-credit")).toHaveAccessibleName("Powered by Markii GitHub");
});

test.describe("project notes without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("a project shows its local clip and its links as a pack group", async ({ page }) => {
    await page.goto("/projects-blog/projects/mandible");
    const clip = page.locator(".note video").first();
    await expect(clip).toHaveAttribute("src", /mandible-demo\.[\w-]+\.mp4$/);
    await expect(clip).toHaveAttribute("poster", /mandible-demo\.[\w-]+\.webp$/);
    await expect(clip).toHaveAttribute("aria-label", /^Mandible in a terminal/);
    await expect(page.getByRole("link", { name: "Watch the demo" })).toBeVisible();
    const links = page.locator(".note a[href='https://github.com/AS-FOSS/mandible']");
    await expect(links).toHaveCount(1);
    await expect(page.locator(".note")).not.toContainText("nav_link");
  });
});

test("an update that gets an error status says so and keeps the values", async ({ page }) => {
  await page.route("https://api.github.com/**", (route) => route.fulfill({ status: 403, contentType: "application/json", body: '{"message":"API rate limit exceeded"}' }));
  await page.goto(SCRIPTED);
  const before = await page.locator(TOTAL).first().textContent();
  await page.getByRole("button", { name: "Update" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Allow", exact: true }).click();
  await expect(page.getByText(/^Could not update\. Showing data from [A-Z][a-z]{2} \d{4}\.$/)).toBeVisible({ timeout: 15000 });
  await expect(page.locator(TOTAL).first()).toHaveText(before ?? "");
});
