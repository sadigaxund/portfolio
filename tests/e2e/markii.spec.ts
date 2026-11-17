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
  await expect(page.locator(".note-bar")).toContainText(/Values as of [A-Z][a-z]{2} \d{4}/);
  await context.close();
});

test("a first visit loads no host and keeps the build's values", async ({ page }) => {
  const scripts = collectScripts(page);
  await page.goto(SCRIPTED);
  await expect(page.getByRole("button", { name: "Refresh values" })).toBeEnabled();
  await page.waitForLoadState("networkidle");
  expect(scripts.filter((url) => HOST_CODE.test(url))).toEqual([]);
  await expect(page.locator(".note-bar")).toHaveAttribute("data-runs", "0");
  await expect(page.locator(TOTAL).first()).toHaveClass(/mk-value--stale/);
});

test("the note bar follows the note and comes before the leaf foot", async ({ page }) => {
  await page.goto(SCRIPTED);
  const order = await page.evaluate(() =>
    [".note", ".note-bar", ".leaf-foot"].map((selector) => document.querySelector(selector)?.getBoundingClientRect().top ?? -1),
  );
  expect(order[0]).toBeGreaterThanOrEqual(0);
  expect(order[1]).toBeGreaterThan(order[0]);
  expect(order[2]).toBeGreaterThan(order[1]);
});

test("refreshing asks with markii's own words, and a no keeps the values", async ({ page }) => {
  await page.goto(SCRIPTED);
  const before = await page.locator(TOTAL).first().textContent();
  await page.getByRole("button", { name: "Refresh values" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.locator(".grant-quote")).toHaveText(/^This page's scripts can send data to api\.github\.com\./);
  await dialog.getByRole("button", { name: "Don't allow" }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.locator(".note-bar")).toHaveAttribute("data-runs", "1", { timeout: 15000 });
  await expect(page.getByText(/^Not allowed\. Values stay as of [A-Z][a-z]{2} \d{4}\.$/)).toBeVisible();
  await expect(page.locator(TOTAL).first()).toHaveText(before ?? "");
  await expect(page.locator(TOTAL).first()).toHaveClass(/mk-value--stale/);
});

test("after a refresh, opening the note runs it without a prompt", async ({ page }) => {
  await page.goto(SCRIPTED);
  await page.getByRole("button", { name: "Refresh values" }).click();
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

test("a leaf foot links to the next leaf, and the last leaf links only back", async ({ page }) => {
  await page.goto("/professional/career");
  await expect(page.locator(".leaf-foot a")).toHaveText(["Next: Education", "Back to Professional"]);
  await page.goto("/professional/certifications");
  await expect(page.locator(".leaf-foot a")).toHaveText(["Back to Professional"]);
});
