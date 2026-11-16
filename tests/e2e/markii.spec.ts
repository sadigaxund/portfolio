import { expect, test } from "@playwright/test";

const SCRIPTED = "/projects-blog/projects/markii";
const TOTAL = ".mk-value";

test.describe("notes without scripts", () => {
  test.use({ javaScriptEnabled: false });

  test("the career note is in the static HTML", async ({ page }) => {
    await page.goto("/professional/career");
    await expect(page.locator(".note h2").first()).toHaveText("KDM Force");
    await expect(page.locator(".note")).toContainText("Cut new-environment bring-up from 5–6 hours");
  });
});

test("a note with no scripts loads no markii script", async ({ page }) => {
  const scripts: string[] = [];
  page.on("request", (req) => {
    if (req.resourceType() === "script") scripts.push(req.url());
  });
  await page.goto("/professional/career");
  await page.waitForLoadState("networkidle");
  expect(scripts.filter((url) => /NoteIsland|browser-worker|@markii/i.test(url))).toEqual([]);
  await expect(page.locator(".note-run")).toHaveCount(0);
});

test("a note with scripts carries the build's values with JavaScript off", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(SCRIPTED);
  // The build ran the note, so the value is in the HTML and reads stale.
  await expect(page.locator(TOTAL).first()).toHaveClass(/mk-value--stale/);
  await expect(page.locator(".note-run")).toContainText(/Values as of [A-Z][a-z]{2} \d{4}/);
  await context.close();
});

test("a first visit's run on open keeps the build's values", async ({ page }) => {
  await page.goto(SCRIPTED);
  const before = await page.locator(TOTAL).first().textContent();
  // The run has no network grant, so each network value fails and the build's value stays.
  await expect(page.locator(".note-run")).toHaveAttribute("data-runs", "1", { timeout: 15000 });
  await expect(page.locator(TOTAL).first()).toHaveText(before ?? "");
  await expect(page.locator(TOTAL).first()).toHaveClass(/mk-value--stale/);
  await expect(page.locator(".note-run button")).toBeEnabled();
});

test("the Run button sits directly under the first heading", async ({ page }) => {
  await page.goto(SCRIPTED);
  const order = await page.evaluate(() => {
    const note = document.querySelector(".note");
    return [...(note?.children ?? [])].slice(0, 2).map((el) => el.tagName + "." + el.className);
  });
  expect(order[0]).toBe("H1.");
  expect(order[1]).toBe("DIV.note-run");
});

test("a run on open never shows a prompt", async ({ page }) => {
  await page.goto(SCRIPTED);
  await expect(page.locator(".note-run")).toHaveAttribute("data-runs", "1", { timeout: 15000 });
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("script markers stay hidden while the note renders", async ({ page }) => {
  await page.goto(SCRIPTED);
  await expect(page.locator(".mk-script").first()).toBeAttached();
  await expect(page.locator(".mk-script").first()).toBeHidden();
});
