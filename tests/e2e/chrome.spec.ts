import { expect, test, type Page } from "@playwright/test";

async function tabOrder(page: Page, count: number): Promise<string[]> {
  const names: string[] = [];
  for (let step = 0; step < count; step += 1) {
    await page.keyboard.press("Tab");
    names.push(await page.evaluate(() => document.activeElement?.textContent?.trim() ?? ""));
  }
  return names;
}

test("the landing page reaches the contact links before the roads", async ({ page }) => {
  await page.goto("/");
  expect(await tabOrder(page, 5)).toEqual(["Resume", "Email", "GitHub", "LinkedIn", "Personal"]);
});

test("a page below the start offers skip and then Back first", async ({ page }) => {
  await page.goto("/professional");
  expect(await tabOrder(page, 2)).toEqual(["Skip to content", "Back to Start"]);
});

test("only leaves have a site foot", async ({ page }) => {
  for (const path of ["/", "/professional"]) {
    await page.goto(path);
    await expect(page.locator(".site-foot")).toHaveCount(0);
  }
  for (const path of ["/professional/career", "/projects-blog/projects/git-resume"]) {
    await page.goto(path);
    await expect(page.locator("footer.site-foot .contact-links a")).toHaveCount(4);
  }
});

test("after a walk, focus starts at the new page's heading", async ({ page }) => {
  await page.goto("/professional");
  await page.locator(".stop a").first().focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/professional\/career$/);
  await expect(page.locator("main h1")).toBeFocused({ timeout: 10000 });
});

test("Back sits in a navigation landmark", async ({ page }) => {
  await page.goto("/professional");
  await expect(page.getByRole("navigation", { name: "Back" }).getByRole("link")).toHaveText("Back to Start");
});

test("a short leaf keeps its foot in the window", async ({ page }) => {
  await page.goto("/personal/instagram");
  const foot = await page.locator("footer.site-foot").boundingBox();
  const height = page.viewportSize()!.height;
  expect(foot!.y + foot!.height).toBeLessThanOrEqual(height + 1);
  expect(foot!.y + foot!.height).toBeGreaterThanOrEqual(height - 1);
});
