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

test("a page below the start offers skip, Back, and Contact first", async ({ page }) => {
  await page.goto("/professional");
  expect(await tabOrder(page, 3)).toEqual(["Skip to content", "Back to start", "Contact"]);
});

test("Contact leads to the site foot's links", async ({ page }) => {
  await page.goto("/professional/career");
  await page.locator(".site-contact a").click();
  await expect(page).toHaveURL(/#contact$/);
  await expect(page.locator("#contact").getByRole("link", { name: "Email" })).toBeInViewport();
});

test("the start page has no site foot, and every other page has one", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".site-foot")).toHaveCount(0);
  for (const path of ["/professional", "/professional/career", "/projects-blog/projects/git-resume"]) {
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
  await expect(page.getByRole("navigation", { name: "Back" }).getByRole("link")).toHaveText("Back to start");
});
