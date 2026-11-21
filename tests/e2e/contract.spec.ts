import { expect, test } from "@playwright/test";

test("a leaf renders its note on the surface", async ({ page }) => {
  await page.goto("/professional/career");
  await expect(page.locator("h1")).toHaveCount(1);
  await expect(page.locator("h1")).toHaveText("Career");
  await expect(page.locator(".leaf-surface .note h2")).toHaveCount(3);
  await expect(page.locator(".leaf-surface .note strong")).toHaveCount(0);
  await page.locator("[data-back]").getByRole("link").click();
  await expect(page.locator("h1")).toHaveText("Professional");
});

test("a placeholder note renders as a note", async ({ page }) => {
  await page.goto("/personal/hobbies/gym");
  await expect(page.locator("h1")).toHaveText("Gym");
  await expect(page.locator(".leaf-surface .note")).toContainText("Nothing here yet.");
});

for (const path of ["/", "/professional", "/personal/hobbies", "/professional/career"]) {
  test(`long unbroken text in every slot keeps ${path} from scrolling sideways`, async ({ page }) => {
    await page.goto(path);
    const overflow = await page.evaluate(() => {
      const slots = document.querySelectorAll("h1, .role-detail, .role-body, .role-item, main a, .line-option a");
      for (const slot of slots) slot.textContent = "x".repeat(220);
      return document.documentElement.scrollWidth - document.documentElement.clientWidth;
    });
    expect(overflow).toBe(0);
  });
}

test("the site icon loads", async ({ page, request }) => {
  await page.goto("/");
  const href = await page.locator('link[rel="icon"]').getAttribute("href");
  expect((await request.get(href ?? "")).status()).toBe(200);
});

test("keyboard focus is visible on the first link of a leaf", async ({ page }) => {
  await page.goto("/professional/career");
  await page.keyboard.press("Tab");
  const focus = await page.evaluate(() => {
    const element = document.activeElement;
    const style = element ? getComputedStyle(element) : null;
    const probe = document.createElement("div");
    probe.style.color = "var(--color-route)";
    document.body.append(probe);
    return { tag: element?.tagName, kind: style?.outlineStyle, color: style?.outlineColor, token: getComputedStyle(probe).color };
  });
  expect(focus.tag).toBe("A");
  expect(focus.kind).toBe("solid");
  expect(focus.color).toBe(focus.token);
});
