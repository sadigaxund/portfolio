import { expect, test, type Page } from "@playwright/test";

const progress = (page: Page) =>
  page.evaluate(() =>
    Number(getComputedStyle(document.querySelector(".line-stage")!).getPropertyValue("--line-p")),
  );

const whenReady = (page: Page) => page.waitForSelector(".line-stage[data-ready]");

test("the line survives a route change and keeps animating through it", async ({ page }) => {
  await page.goto("/spike");
  await whenReady(page);
  await page.evaluate(() => {
    const win = window as unknown as { svg: Element; samples: number[][] };
    win.svg = document.querySelector("svg.line-world")!;
    win.samples = [];
    const tick = () => {
      const stage = document.querySelector(".line-stage")!;
      win.samples.push([performance.now(), Number(getComputedStyle(stage).getPropertyValue("--line-p"))]);
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });

  await page.getByRole("link", { name: "Projects" }).click();
  await expect(page).toHaveURL(/\/spike\/projects$/);
  await expect(page.locator("h1")).toHaveText("Projects");
  await expect.poll(() => progress(page)).toBe(1);

  const result = await page.evaluate(() => {
    const win = window as unknown as { svg: Element; samples: number[][] };
    const moving = win.samples.filter(([, p]) => p > 0 && p < 1);
    const gaps = moving.slice(1).map(([t], i) => t - moving[i][0]);
    return {
      sameElement: win.svg === document.querySelector("svg.line-world"),
      frames: moving.length,
      worstGap: Math.max(...gaps),
      monotonic: moving.every(([, p], i) => i === 0 || p >= moving[i - 1][1]),
    };
  });
  console.log("transition", JSON.stringify(result));
  expect(result.sameElement).toBe(true);
  expect(result.monotonic).toBe(true);
  expect(result.frames).toBeGreaterThan(20);
  expect(result.worstGap).toBeLessThan(200);
});

test("the chosen branch reaches the page bottom and the others retract", async ({ page }) => {
  await page.goto("/spike");
  await whenReady(page);
  await page.getByRole("link", { name: "Personal" }).click();
  await expect.poll(() => progress(page)).toBe(1);
  const box = await page.evaluate(() => {
    const chosen = document.querySelector<SVGPathElement>('[data-branch="-1"]')!;
    const other = document.querySelector<SVGPathElement>('[data-branch="1"]')!;
    return {
      bottom: chosen.getBoundingClientRect().bottom + window.scrollY,
      page: document.documentElement.scrollHeight,
      otherDash: other.getAttribute("stroke-dasharray"),
    };
  });
  expect(box.bottom).toBeGreaterThanOrEqual(box.page - 1);
  // The main line stays visible next to the content, so nothing paints over it.
  const covered = await page.evaluate(() => {
    const chosen = document.querySelector<SVGPathElement>('[data-branch="-1"]')!;
    // A left branch's box starts at its straight part, and ends at the curve.
    const x = chosen.getBoundingClientRect().left + 1;
    return document.elementsFromPoint(x, innerHeight - 20).some((el) => el.closest("main"));
  });
  expect(covered).toBe(false);
  expect(box.otherDash).toBe("0 1");
  await expect(page.getByRole("link", { name: "Projects" })).toBeHidden();
});

test("a deep link draws the walked line with no animation", async ({ page }) => {
  await page.goto("/spike/personal");
  await whenReady(page);
  expect(await progress(page)).toBe(1);
  await expect(page.getByRole("link", { name: "Back" })).toBeVisible();
});

test("back retraces the path, and an interrupted choice settles", async ({ page }) => {
  await page.goto("/spike");
  await whenReady(page);
  await page.getByRole("link", { name: "Professional" }).click();
  await expect.poll(() => progress(page)).toBe(1);
  await page.goBack();
  await expect(page.locator("h1")).toHaveText("Start");
  await expect.poll(() => progress(page)).toBe(0);
  await expect(page.getByRole("link", { name: "Personal" })).toBeVisible();

  await page.getByRole("link", { name: "Personal" }).click();
  await page.waitForTimeout(120);
  await page.goBack();
  await expect(page.locator("h1")).toHaveText("Start");
  await expect.poll(() => progress(page)).toBe(0);
  await expect(page.getByRole("link", { name: "Projects" })).toBeVisible();
});

test("reduced motion jumps straight to the end state", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/spike");
  await whenReady(page);
  await page.getByRole("link", { name: "Projects" }).click();
  await expect(page.locator("h1")).toHaveText("Projects");
  expect(await progress(page)).toBe(1);
});

test("the stage starts at the page top, and labels have large tap targets", async ({ page }) => {
  await page.goto("/spike");
  await whenReady(page);
  const top = await page.evaluate(() => document.querySelector(".line-stage")!.getBoundingClientRect().top);
  expect(top).toBe(0);
  const label = await page.getByRole("link", { name: "Personal" }).boundingBox();
  expect(label!.height).toBeGreaterThanOrEqual(44);
  expect(label!.y + label!.height).toBeLessThanOrEqual(page.viewportSize()!.height);
});

test("no sideways page scroll in any state", async ({ page }) => {
  for (const path of ["/spike", "/spike/personal", "/spike/projects"]) {
    await page.goto(path);
    await whenReady(page);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow, path).toBe(0);
  }
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });
  test("every path is a real link", async ({ page }) => {
    await page.goto("/spike");
    await page.getByRole("link", { name: "Personal" }).click();
    await expect(page.locator("h1")).toHaveText("Personal");
    await page.getByRole("link", { name: "Back" }).click();
    await expect(page.locator("h1")).toHaveText("Start");
  });
});
