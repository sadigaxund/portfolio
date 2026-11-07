import { expect, test } from "@playwright/test";

test("a leaf with a folder renders its own content on the surface", async ({ page }) => {
  await page.goto("/professional/career");
  await expect(page.locator("h1")).toHaveCount(1);
  await expect(page.locator("h1")).toHaveText("Career");
  await expect(page.locator(".leaf-surface .timeline-entry")).toHaveCount(3);
  await expect(page.locator(".leaf-surface .role-result")).toHaveCount(5);
  await page.getByRole("link", { name: "Back" }).click();
  await expect(page.locator("h1")).toHaveText("Professional");
});

test("a leaf with no folder gets the default leaf", async ({ page }) => {
  await page.goto("/personal/instagram");
  await expect(page.locator("h1")).toHaveText("Instagram");
  await expect(page.locator(".leaf-surface")).toContainText("PLACEHOLDER");
  await expect(page.locator(".timeline")).toHaveCount(0);
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
