import { expect, test, type Page } from "@playwright/test";

const progress = (page: Page) =>
  page.evaluate(() =>
    Number(getComputedStyle(document.querySelector(".line-stage")!).getPropertyValue("--line-p")),
  );

const whenReady = (page: Page) => page.waitForSelector(".line-stage[data-ready]");

// --line-p holds the destination from the first frame, so a run must also be settled.
const settledAt = async (page: Page, value: number) => {
  await page.waitForSelector('.line-stage[data-settled="true"]');
  await expect.poll(() => progress(page)).toBe(value);
};

test("the line survives a route change and keeps moving, with nothing written per frame", async ({ page }) => {
  await page.goto("/spike");
  await whenReady(page);
  await page.evaluate(() => {
    const win = window as unknown as { fork: Element; samples: number[][]; writes: number };
    const stage = document.querySelector(".line-stage")!;
    win.fork = document.querySelector("svg.line-fork")!;
    win.samples = [];
    win.writes = 0;
    new MutationObserver((list) => (win.writes += list.length)).observe(stage, { attributes: true, subtree: true });
    const tick = () => {
      const world = document.querySelector(".line-world")!;
      win.samples.push([performance.now(), new DOMMatrix(getComputedStyle(world).transform).m42]);
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });

  await page.getByRole("link", { name: "Projects" }).click();
  await expect(page).toHaveURL(/\/spike\/projects$/);
  await expect(page.locator("h1")).toHaveText("Projects");
  await settledAt(page, 1);

  const result = await page.evaluate(() => {
    const win = window as unknown as { fork: Element; samples: number[][]; writes: number };
    const lifted = Math.min(...win.samples.map(([, y]) => y));
    const moving = win.samples.filter(([, y]) => y < 0 && y > lifted);
    const gaps = moving.slice(1).map(([t], i) => t - moving[i][0]);
    return {
      sameElement: win.fork === document.querySelector("svg.line-fork"),
      frames: moving.length,
      worstGap: Math.max(...gaps),
      monotonic: moving.every(([, y], i) => i === 0 || y <= moving[i - 1][1]),
      writes: win.writes,
    };
  });
  console.log("transition", JSON.stringify(result));
  expect(result.sameElement).toBe(true);
  expect(result.monotonic).toBe(true);
  expect(result.frames).toBeGreaterThan(20);
  expect(result.worstGap).toBeLessThan(200);
  // A per-frame engine would write about 50 times per property here.
  expect(result.writes).toBeLessThan(40);
});

test("the parts of the line meet exactly, before and after a choice", async ({ page }) => {
  const edges = () =>
    page.evaluate(() => {
      const box = (selector: string) => document.querySelector(selector)!.getBoundingClientRect();
      const fork = box("svg.line-fork");
      // Read the true end of the curve, because Firefox pads a path's bounding box for its stroke.
      const branch = document.querySelector<SVGPathElement>('[data-branch="-1"]')!;
      const end = branch.getPointAtLength(branch.getTotalLength());
      const matrix = branch.getScreenCTM()!;
      return {
        trunkX: box(".line-trunk").x,
        forkX: fork.x + fork.width / 2 - 1,
        tailX: box(".line-tail").x,
        branchX: matrix.a * end.x + matrix.e - 1,
        trunkBottom: box(".line-trunk").bottom,
        forkTop: fork.top,
      };
    });
  await page.goto("/spike");
  await whenReady(page);
  let at = await edges();
  expect(at.trunkX).toBeCloseTo(at.forkX, 0);
  expect(at.trunkBottom).toBeCloseTo(at.forkTop, 0);
  await page.getByRole("link", { name: "Personal" }).click();
  await settledAt(page, 1);
  await page.waitForTimeout(100);
  at = await edges();
  expect(at.tailX).toBeCloseTo(at.branchX, 0);
});

test("the chosen line reaches the page bottom, stays visible, and the others retract", async ({ page }) => {
  await page.goto("/spike");
  await whenReady(page);
  await page.getByRole("link", { name: "Personal" }).click();
  await settledAt(page, 1);
  await page.waitForTimeout(100);
  const box = await page.evaluate(() => {
    const tail = document.querySelector(".line-tail")!.getBoundingClientRect();
    const other = document.querySelector<SVGPathElement>('[data-branch="1"]')!;
    return {
      bottom: tail.bottom + window.scrollY,
      page: document.documentElement.scrollHeight,
      otherRetract: getComputedStyle(other).strokeDashoffset,
      // The main line stays visible next to the content, so nothing paints over it.
      covered: document.elementsFromPoint(tail.x + 1, innerHeight - 20).some((el) => el.closest("main")),
    };
  });
  expect(box.bottom).toBeGreaterThanOrEqual(box.page - 1);
  expect(box.covered).toBe(false);
  expect(parseFloat(box.otherRetract)).toBe(1);
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
  await settledAt(page, 1);
  await page.goBack();
  await expect(page.locator("h1")).toHaveText("Start");
  await settledAt(page, 0);
  await expect(page.getByRole("link", { name: "Personal" })).toBeVisible();

  await page.getByRole("link", { name: "Personal" }).click();
  await page.waitForTimeout(120);
  await page.goBack();
  await expect(page.locator("h1")).toHaveText("Start");
  await settledAt(page, 0);
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
