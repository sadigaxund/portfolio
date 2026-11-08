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
  await page.goto("/personal/instagram");
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
  await page.getByRole("link", { name: "Instagram" }).click();
  await expect(page.locator("h1")).toHaveText("Instagram");
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
  await page.goto("/personal/instagram");
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
  await page.getByRole("link", { name: "Instagram" }).click();
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
  await page.getByRole("link", { name: "Instagram" }).click();
  await expect(page.locator("h1")).toHaveText("Instagram");
  expect(await page.evaluate(() => (window as unknown as { shown: boolean }).shown)).toBe(false);
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });
  test("a leaf is a real page with no line, and Back is a real link", async ({ page }) => {
    await page.goto("/personal");
    await page.getByRole("link", { name: "Instagram" }).click();
    await expect(page.locator("h1")).toHaveText("Instagram");
    await expect(page.locator(".line-tail")).toBeHidden();
    await page.getByRole("link", { name: "Back" }).click();
    await expect(page.locator("h1")).toHaveText("Personal");
  });
});

test("a level can mix leaves and subsections, at any depth", async ({ page }) => {
  await page.goto("/personal");
  await whenReady(page);
  await expect(page.locator('[data-stop-url="/personal/hobbies"]')).toHaveAttribute("data-kind", "section");
  await expect(page.locator('[data-stop-url="/personal/instagram"]')).toHaveAttribute("data-kind", "leaf");
  await page.getByRole("link", { name: "Hobbies" }).click();
  await expect(page.locator("h1")).toHaveText("Hobbies");
  await page.getByRole("link", { name: "PLACEHOLDER group" }).click();
  await expect(page).toHaveURL(/\/personal\/hobbies\/placeholder-group$/);
  await page.getByRole("link", { name: "PLACEHOLDER deep leaf" }).click();
  await expect(page.locator("h1")).toHaveText("PLACEHOLDER deep leaf");
  await expect(page.locator(".line-world")).toBeHidden();
  await seamIdle(page);
  for (const label of ["PLACEHOLDER group", "Hobbies", "Personal"]) {
    await page.getByRole("link", { name: "Back" }).click();
    await expect(page.locator("h1")).toHaveText(label);
  }
});

test("the stops sit on the line, on both sides on desktop and one side on a phone", async ({ page }) => {
  await page.goto("/professional");
  await whenReady(page);
  const { line, branches } = await page.evaluate(() => ({
    line: document.querySelector(".line-tail")!.getBoundingClientRect().left,
    branches: [...document.querySelectorAll(".stop-branch")].map((branch) => {
      const box = branch.getBoundingClientRect();
      return { left: box.left, right: box.right };
    }),
  }));
  const wide = page.viewportSize()!.width > 640;
  expect(branches[0].left).toBeCloseTo(line, 0);
  if (wide) expect(branches[1].right).toBeCloseTo(line + 2, 0);
  else expect(branches[1].left).toBeCloseTo(line, 0);
});

const sampleWalk = (page: Page) =>
  page.evaluate(() => {
    const win = window as unknown as { rows: { y: number; tail: number; main: string; hero: string }[] };
    win.rows = [];
    const started = performance.now();
    const tick = () => {
      const tail = document.querySelector(".line-tail")!.getBoundingClientRect();
      const hero = document.querySelector(".hero");
      win.rows.push({
        y: new DOMMatrix(getComputedStyle(document.querySelector(".line-world")!).transform).m42,
        tail: tail.height,
        main: getComputedStyle(document.querySelector("main")!).visibility,
        hero: hero ? getComputedStyle(hero).opacity : "none",
      });
      if (performance.now() - started < 2400) requestAnimationFrame(tick);
    };
    tick();
  });

const walkRows = (page: Page) =>
  page.evaluate(() => (window as unknown as { rows: { y: number; tail: number; main: string; hero: string }[] }).rows);

test("entering a subsection pans the whole line in one world, with the root line kept", async ({ page }) => {
  await page.goto("/personal");
  await whenReady(page);
  await sampleWalk(page);
  await page.getByRole("link", { name: "Hobbies" }).click();
  await expect(page.locator("h1")).toHaveText("Hobbies");
  await page.waitForSelector('.line-stage[data-settled="true"]');
  await page.waitForTimeout(300);
  const rows = await walkRows(page);
  const lifted = rows.map((row) => row.y);
  expect(lifted.every((y, i) => i === 0 || y <= lifted[i - 1] + 1)).toBe(true);
  expect(Math.min(...lifted)).toBeLessThan(lifted[0] - 50);
  // The root line shortens to the chosen stop, and it never disappears.
  expect(Math.min(...rows.map((row) => row.tail))).toBeGreaterThan(20);
  // The new content waits for the camera.
  const firstMove = rows.findIndex((row) => row.y < lifted[0] - 1);
  const shown = rows.findLastIndex((row) => row.main !== "visible");
  expect(shown).toBeGreaterThan(firstMove);
  await expect(page.locator(".line-run")).toHaveCount(1);
});

test("going back up a level pans back too, and the stop returns where it left", async ({ page }) => {
  await page.goto("/personal/hobbies");
  await whenReady(page);
  await sampleWalk(page);
  await page.getByRole("link", { name: "Back" }).click();
  await expect(page.locator("h1")).toHaveText("Personal");
  await page.waitForSelector('.line-stage[data-settled="true"]');
  await page.waitForTimeout(300);
  const lifted = (await walkRows(page)).map((row) => row.y);
  expect(lifted.every((y, i) => i === 0 || y >= lifted[i - 1] - 1)).toBe(true);
  expect(Math.max(...lifted)).toBeGreaterThan(lifted[0] + 50);
  await expect(page.locator(".line-run")).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Hobbies" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Instagram" })).toBeVisible();
});

test("a deep link draws the walked line at any depth, with no animation", async ({ page }) => {
  await page.goto("/personal/hobbies/placeholder-group");
  await whenReady(page);
  await expect(page.locator(".line-run")).toHaveCount(2);
  const { runX, center } = await page.evaluate(() => ({
    runX: [...document.querySelectorAll(".line-run")].at(-1)!.getBoundingClientRect().left,
    center: document.querySelector("main .stop-branch")!.getBoundingClientRect().left,
  }));
  expect(Math.abs(runX - center)).toBeLessThan(2);
});

test("going back to the landing page shows the hero only after the fork has returned", async ({ page }) => {
  await page.goto("/professional");
  await whenReady(page);
  await sampleWalk(page);
  await page.getByRole("link", { name: "Back" }).click();
  await expect(page.locator(".hero")).toBeVisible();
  await page.waitForSelector('.line-stage[data-settled="true"]');
  await page.waitForTimeout(100);
  const rows = await walkRows(page);
  const home = rows.findIndex((row) => row.y >= -1);
  const visibleEarly = rows.slice(0, home).some((row) => row.hero !== "none" && row.main === "visible" && Number(row.hero) > 0);
  expect(home).toBeGreaterThan(0);
  expect(visibleEarly).toBe(false);
  await expect(page.getByRole("link", { name: "Personal" })).toBeVisible();
});

for (const [name, from, go] of [
  ["the fork", "/", "Professional"],
  ["a subsection", "/personal", "Hobbies"],
  ["a leaf", "/personal", "Instagram"],
] as const) {
  test(`a scroll cannot run ahead while the line moves into ${name}`, async ({ page }) => {
    await page.goto(from);
    await whenReady(page);
    await page.mouse.move(100, 100);
    await page.getByRole("link", { name: go }).click();
    await page.waitForTimeout(120);
    await page.addStyleTag({ content: "main { min-height: 300vh !important; }" });
    await page.mouse.wheel(0, 400);
    await page.waitForTimeout(100);
    expect(await page.evaluate(() => scrollY)).toBe(0);
    await page.waitForFunction(
      () =>
        document.querySelector<HTMLElement>(".line-stage")!.dataset.settled === "true" &&
        [...document.querySelectorAll<HTMLElement>("[data-seam], [data-continue]")].every(
          (part) => getComputedStyle(part).visibility === "hidden",
        ),
    );
    await page.addStyleTag({ content: "main { min-height: 300vh !important; }" });
    await page.mouse.wheel(0, 400);
    await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(0);
  });
}

const stopDelays = (page: Page) =>
  page.evaluate(() =>
    [...document.querySelectorAll(".stop-branch")].map((branch) =>
      branch.getAnimations().map((animation) => Number(animation.effect!.getTiming().delay)),
    ),
  );

test("after a move the stops sprout in order, once the camera has settled", async ({ page }) => {
  await page.goto("/");
  await whenReady(page);
  await page.getByRole("link", { name: "Personal" }).click();
  await page.waitForFunction(() => {
    const branch = document.querySelector(".stop-branch");
    return branch !== null && branch.getAnimations().length > 0 && !document.documentElement.dataset.lineReveal;
  });
  const delays = (await stopDelays(page)).map((list) => list[0]);
  expect(delays.length).toBeGreaterThan(1);
  expect(delays.every((delay, i) => i === 0 || delay > delays[i - 1])).toBe(true);
  await page.waitForSelector('.line-stage[data-settled="true"]');
  await expect(page.getByRole("link", { name: "Instagram" })).toBeVisible();
});

test("a direct load and a return from a leaf show stops at once", async ({ page }) => {
  await page.goto("/personal");
  await whenReady(page);
  expect((await stopDelays(page)).flat()).toEqual([]);
  await page.getByRole("link", { name: "Instagram" }).click();
  await expect(page.locator("h1")).toHaveText("Instagram");
  await seamIdle(page);
  await page.getByRole("link", { name: "Back" }).click();
  await expect(page.locator("h1")).toHaveText("Personal");
  expect((await stopDelays(page)).flat()).toEqual([]);
});

test("the line grows smoothly, and each stop sprouts only after its tip has passed", async ({ page }) => {
  await page.goto("/");
  await whenReady(page);
  await page.evaluate(() => {
    const win = window as unknown as { rows: { tip: number; base: number; early: boolean }[] };
    win.rows = [];
    document.addEventListener("line:transition-start", () => {
      const started = performance.now();
      const tick = () => {
        const tail = document.querySelector(".line-tail")!.getBoundingClientRect();
        const early = [...document.querySelectorAll(".stop-branch")].some((branch) => {
          const progress = branch.getAnimations()[0]?.effect?.getComputedTiming().progress ?? 0;
          return progress > 0 && branch.getBoundingClientRect().top > tail.bottom;
        });
        win.rows.push({ tip: tail.bottom, base: tail.top, early });
        if (performance.now() - started < 1700) requestAnimationFrame(tick);
      };
      tick();
    });
  });
  await page.getByRole("link", { name: "Personal" }).click();
  await page.waitForSelector('.line-stage[data-settled="true"]');
  await page.waitForTimeout(800);
  const rows = await page.evaluate(() => (window as unknown as { rows: { tip: number; base: number; early: boolean }[] }).rows);
  const lengths = rows.map((row) => row.tip - row.base);
  const steps = lengths.slice(1).map((length, i) => length - lengths[i]);
  expect(Math.max(...lengths)).toBeGreaterThan(300);
  expect(Math.max(...steps)).toBeLessThan(120);
  expect(rows.some((row) => row.early)).toBe(false);
});

test("spamming Back cannot stall the seam or skip a level", async ({ page }) => {
  await page.goto("/personal/instagram");
  await whenReady(page);
  const result = await page.evaluate(
    () =>
      new Promise<{ positions: number[]; swappedTo: string; swappedAfter: number }>((resolve) => {
        const end = document.querySelector(".line-seam-end")!;
        const link = document.querySelector<HTMLAnchorElement>("[data-back] a")!;
        const positions: number[] = [];
        const started = performance.now();
        let sampling = true;
        const sample = () => {
          positions.push(new DOMMatrix(getComputedStyle(end).transform).m41);
          if (sampling) requestAnimationFrame(sample);
        };
        document.addEventListener(
          "astro:after-swap",
          () => {
            sampling = false;
            resolve({ positions, swappedTo: location.pathname, swappedAfter: performance.now() - started });
          },
          { once: true },
        );
        link.click();
        requestAnimationFrame(sample);
        const spam = setInterval(() => link.click(), 40);
        setTimeout(() => clearInterval(spam), 400);
      }),
  );
  console.log("spam", result.swappedTo, Math.round(result.swappedAfter));
  expect(result.swappedTo).toBe("/personal");
  expect(result.swappedAfter).toBeLessThan(900);
  const closing = result.positions.filter((x) => x > 0);
  expect(closing.every((x, i) => i === 0 || x <= closing[i - 1] + 1)).toBe(true);
});

test("spamming a stop or a fork label runs its transition once", async ({ page }) => {
  await page.goto("/");
  await whenReady(page);
  const started = await page.evaluate(
    () =>
      new Promise<number>((resolve) => {
        let count = 0;
        document.addEventListener("line:transition-start", () => (count += 1));
        const link = document.querySelector<HTMLAnchorElement>('[data-option="-1"] a')!;
        link.click();
        const spam = setInterval(() => link.click(), 40);
        setTimeout(() => {
          clearInterval(spam);
          resolve(count);
        }, 400);
      }),
  );
  expect(started).toBe(1);
  await page.waitForSelector('.line-stage[data-settled="true"]');
  await expect(page).toHaveURL(/\/personal$/);
});

test("Projects lists its four stops in order", async ({ page }) => {
  await page.goto("/projects-blog/projects");
  await whenReady(page);
  await expect(page.locator("h1")).toHaveText("Projects");
  await expect(page.locator(".stop .role-item")).toHaveText(["git-resume", "Mandible", "Markii", "Aqueduct"]);
});
