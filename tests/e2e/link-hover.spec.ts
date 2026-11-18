import { expect, test } from "@playwright/test";

test("a note link thickens its underline on hover and keeps its color", async ({ page }) => {
  await page.goto("/projects-blog/projects/mandible");
  const link = page.locator('.note p a[href^="http"]').first();
  const read = () => link.evaluate((el) => ({ thickness: getComputedStyle(el).textDecorationThickness, color: getComputedStyle(el).color }));
  await page.mouse.move(0, 0);
  const rest = await read();
  await link.hover();
  const hover = await read();
  expect(hover.thickness).toBe("2px");
  expect(rest.thickness).not.toBe("2px");
  expect(hover.color).toBe(rest.color);
});

test("a site foot contact link thickens on hover too", async ({ page }) => {
  await page.goto("/professional/career");
  const link = page.locator(".site-foot .contact-links a").first();
  await link.hover();
  expect(await link.evaluate((el) => getComputedStyle(el).textDecorationThickness)).toBe("2px");
});
