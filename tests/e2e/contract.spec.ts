import { expect, test } from "@playwright/test";

test("a leaf with a folder renders its own content on the surface", async ({ page }) => {
  await page.goto("/professional/career");
  await expect(page.locator("h1")).toHaveCount(1);
  await expect(page.locator("h1")).toHaveText("Career");
  await expect(page.locator(".leaf-surface .timeline-entry")).toHaveCount(2);
  await expect(page.locator(".leaf-surface .role-result")).toHaveCount(1);
  await page.getByRole("link", { name: "Back" }).click();
  await expect(page.locator("h1")).toHaveText("Professional");
});

test("a leaf with no folder gets the default leaf", async ({ page }) => {
  await page.goto("/personal/instagram");
  await expect(page.locator("h1")).toHaveText("Instagram");
  await expect(page.locator(".leaf-surface")).toContainText("PLACEHOLDER");
  await expect(page.locator(".timeline")).toHaveCount(0);
});

test("the timeline thread uses the route token", async ({ page }) => {
  await page.goto("/professional/career");
  const colors = await page.evaluate(() => {
    const thread = document.querySelector(".timeline-body");
    const probe = document.createElement("div");
    probe.style.color = "var(--color-route)";
    document.body.append(probe);
    return { thread: thread ? getComputedStyle(thread).borderLeftColor : "", token: getComputedStyle(probe).color };
  });
  expect(colors.thread).toBe(colors.token);
});
