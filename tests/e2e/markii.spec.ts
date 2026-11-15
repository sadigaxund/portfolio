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

test("a note with scripts renders its empty state with JavaScript off", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(SCRIPTED);
  await expect(page.locator("h1")).toHaveText("Markii");
  await expect(page.locator(".note")).toContainText("computed in your browser");
  await context.close();
});

test("the script runs on open and the value is remembered on reload", async ({ page }) => {
  await page.goto(SCRIPTED);
  await expect(page.locator(TOTAL)).toContainText("55");
  await expect(page.locator(".note-run button")).toBeEnabled();
  // The remembered value shows from the first client render, before the new run lands.
  await page.route("**/*browser-worker*", (route) => route.abort());
  await page.reload();
  await expect(page.locator(TOTAL)).toContainText("55");
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
  await expect(page.locator(TOTAL)).toContainText("55");
  await expect(page.getByRole("dialog")).toHaveCount(0);
});
