import { expect, test, type Page } from "@playwright/test";

const whenReady = (page: Page) => page.waitForSelector(".line-stage[data-ready]");

const seamIdle = (page: Page) =>
  expect
    .poll(() =>
      page.evaluate(() =>
        [...document.querySelectorAll<HTMLElement>("[data-seam]")].every(
          (panel) => getComputedStyle(panel).visibility === "hidden",
        ),
      ),
    )
    .toBe(true);

test("a leaf owns the whole screen, with no line and Back still in reach", async ({ page }) => {
  await page.goto("/personal/hobbies");
  await whenReady(page);
  const view = await page.evaluate(() => {
    const main = document.querySelector("main")!.getBoundingClientRect();
    return {
      world: getComputedStyle(document.querySelector(".line-world")!).visibility,
      left: main.left,
      width: main.width,
      space: document.documentElement.clientWidth,
    };
  });
  expect(view.world).toBe("hidden");
  expect(view.left).toBe(0);
  expect(view.width).toBe(view.space);

  await page.evaluate(() => {
    document.querySelector("main")!.style.height = "300vh";
    scrollTo(0, 800);
  });
  const back = page.getByRole("link", { name: "Back" });
  await expect(back).toBeInViewport();
  const hit = await back.evaluate((link) => {
    const box = link.getBoundingClientRect();
    return document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2) === link;
  });
  expect(hit).toBe(true);
});

test("the seam shuts before the swap, then parts to both edges", async ({ page }) => {
  await page.goto("/personal");
  await whenReady(page);
  await page.evaluate(() => {
    const win = window as unknown as { atSwap: string; path: number[] };
    const end = document.querySelector(".line-seam-end")!;
    win.path = [];
    document.addEventListener("astro:before-swap", () => (win.atSwap = getComputedStyle(end).opacity));
    document.addEventListener("astro:after-swap", () => {
      const tick = () => {
        win.path.push(new DOMMatrix(getComputedStyle(end).transform).m41);
        if (getComputedStyle(end).visibility !== "hidden") requestAnimationFrame(tick);
      };
      tick();
    });
  });
  await page.getByRole("link", { name: "Hobbies" }).click();
  await expect(page.locator("h1")).toHaveText("Hobbies");
  await seamIdle(page);
  const { atSwap, path } = await page.evaluate(() => {
    const win = window as unknown as { atSwap: string; path: number[] };
    return { atSwap: win.atSwap, path: win.path };
  });
  expect(atSwap).toBe("1");
  expect(path.length).toBeGreaterThan(10);
  expect(path.every((x, i) => i === 0 || x >= path[i - 1])).toBe(true);
  expect(path[0]).toBeLessThan(path[path.length - 1] / 4);
  await expect(page.locator(".line-world")).toBeHidden();
});

test("both sides of the seam meet exactly on the resting line", async ({ page }) => {
  await page.goto("/personal");
  await whenReady(page);
  const edges = await page.evaluate(() => {
    const [start, end] = [...document.querySelectorAll<HTMLElement>("[data-seam]")];
    return {
      line: document.querySelector(".line-tail")!.getBoundingClientRect().left,
      startEdge: start.offsetLeft + start.offsetWidth,
      endEdge: end.offsetLeft,
      width: parseFloat(getComputedStyle(end, "::after").width),
    };
  });
  expect(edges.endEdge).toBeCloseTo(edges.line, 0);
  expect(edges.startEdge - edges.width).toBeCloseTo(edges.line, 0);
});

test("Back shuts the seam and returns to the line, one level at a time", async ({ page }) => {
  await page.goto("/personal/hobbies");
  await whenReady(page);
  await page.getByRole("link", { name: "Back" }).click();
  await expect(page).toHaveURL(/\/personal$/);
  await expect(page.locator("h1")).toHaveText("Personal");
  await seamIdle(page);
  await expect(page.locator(".line-tail")).toBeVisible();
  await page.getByRole("link", { name: "Back" }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("link", { name: "Personal" })).toBeVisible();
});

test("a leaf interrupted by browser back still settles on the line", async ({ page }) => {
  await page.goto("/");
  await whenReady(page);
  await page.getByRole("link", { name: "Personal" }).click();
  await page.waitForSelector('.line-stage[data-settled="true"]');
  await page.getByRole("link", { name: "Hobbies" }).click();
  await page.waitForTimeout(80);
  await page.goBack();
  await seamIdle(page);
  await expect(page.locator(".line-world")).toBeVisible();
  await expect(page.locator("main")).toBeVisible();
});

test("reduced motion enters a leaf with no seam", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/personal");
  await whenReady(page);
  await page.evaluate(() => {
    const win = window as unknown as { shown: boolean };
    win.shown = false;
    document.addEventListener("astro:before-swap", () => {
      win.shown = getComputedStyle(document.querySelector(".line-seam-end")!).visibility !== "hidden";
    });
  });
  await page.getByRole("link", { name: "Hobbies" }).click();
  await expect(page.locator("h1")).toHaveText("Hobbies");
  expect(await page.evaluate(() => (window as unknown as { shown: boolean }).shown)).toBe(false);
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });
  test("a leaf is a real page with no line, and Back is a real link", async ({ page }) => {
    await page.goto("/personal");
    await page.getByRole("link", { name: "Hobbies" }).click();
    await expect(page.locator("h1")).toHaveText("Hobbies");
    await expect(page.locator(".line-tail")).toBeHidden();
    await page.getByRole("link", { name: "Back" }).click();
    await expect(page.locator("h1")).toHaveText("Personal");
  });
});
