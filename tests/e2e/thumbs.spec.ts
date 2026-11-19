import { expect, test } from "@playwright/test";

const ROUTE = "/projects-blog/projects";

test("each project stop shows one hashed thumbnail", async ({ page }) => {
  await page.goto(ROUTE);
  const thumbs = page.locator(".stop .stop-thumb");
  await expect(thumbs).toHaveCount(4);
  for (const src of await thumbs.evaluateAll((els) => els.map((el) => el.getAttribute("src") ?? ""))) {
    expect(src).toMatch(/\/_astro\/thumb-[a-z-]+\.[\w-]+\.webp$/);
  }
  await expect(thumbs.first()).toHaveAttribute("alt", "");
});

test("a stop without a thumb has no image", async ({ page }) => {
  await page.goto("/professional");
  await expect(page.locator(".stop")).not.toHaveCount(0);
  await expect(page.locator(".stop-thumb")).toHaveCount(0);
});

test("clicking a thumbnail opens its project", async ({ page }) => {
  await page.goto(ROUTE);
  await page.waitForSelector('.line-stage[data-settled="true"]');
  const thumb = page.locator(".stop .stop-thumb").nth(1);
  await thumb.scrollIntoViewIfNeeded();
  // A real mouse click at the image's center: the stretched link sits over it, so a locator click would wait on "intercepts pointer events".
  const box = (await thumb.boundingBox())!;
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await expect(page).toHaveURL(/\/projects-blog\/projects\/mandible\/?$/);
});

test.describe("phone width", () => {
  test.use({ viewport: { width: 320, height: 640 } });
  test("thumbnails cause no horizontal scroll", async ({ page }) => {
    await page.goto(ROUTE);
    await page.waitForSelector('.line-stage[data-settled="true"]');
    const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(over).toBe(0);
    const width = await page.locator(".stop-thumb").first().evaluate((el) => el.getBoundingClientRect().width);
    expect(width).toBeLessThanOrEqual(128.5);
  });
});
