import { expect, test, type Page } from "@playwright/test";
import { siteNodes } from "./site-nodes.mjs";

const progress = (page: Page) =>
  page.evaluate(() =>
    Number(getComputedStyle(document.querySelector(".line-stage")!).getPropertyValue("--line-p")),
  );

const chosen = (page: Page) =>
  page.evaluate(() => document.querySelector<HTMLElement>(".line-stage")!.dataset.chosen);

const whenReady = (page: Page) => page.waitForSelector(".line-stage[data-ready]");

// --line-p holds the destination from the first frame, so a run must also be settled.
const settledAt = async (page: Page, value: number) => {
  await page.waitForSelector('.line-stage[data-settled="true"]');
  await expect.poll(() => progress(page)).toBe(value);
};

test("the line survives a route change and keeps moving, with nothing written per frame", async ({ page }) => {
  await page.goto("/");
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

  await page.getByRole("link", { name: "Projects & Blog" }).click();
  await expect(page).toHaveURL(/\/projects-blog$/);
  await expect(page.locator("h1")).toHaveText("Projects & Blog");
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
  await page.goto("/");
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
  await page.goto("/");
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
      covered: document
        .elementsFromPoint(tail.x + 1, innerHeight - 20)
        .some((el) => el.closest("main") && getComputedStyle(el).backgroundColor !== "rgba(0, 0, 0, 0)"),
    };
  });
  expect(box.bottom).toBeGreaterThanOrEqual(box.page - 1);
  expect(box.covered).toBe(false);
  expect(parseFloat(box.otherRetract)).toBe(1);
  await expect(page.getByRole("link", { name: "Projects & Blog" })).toBeHidden();
});

test("a deep link draws the walked line with no animation", async ({ page }) => {
  await page.goto("/personal");
  await whenReady(page);
  expect(await progress(page)).toBe(1);
  await expect(page.locator("[data-back]").getByRole("link")).toBeVisible();
});

test("back retraces the path, and an interrupted choice settles", async ({ page }) => {
  await page.goto("/");
  await whenReady(page);
  await page.getByRole("link", { name: "Professional" }).click();
  await settledAt(page, 1);
  await page.goBack();
  await expect(page.locator("h1")).toHaveText("Sadig Akhund");
  await settledAt(page, 0);
  await expect(page.getByRole("link", { name: "Personal" })).toBeVisible();

  await page.getByRole("link", { name: "Personal" }).click();
  await expect(page).toHaveURL(/\/personal$/);
  await page.waitForTimeout(120);
  await page.goBack();
  await expect(page.locator("h1")).toHaveText("Sadig Akhund");
  await settledAt(page, 0);
  await expect(page.getByRole("link", { name: "Projects & Blog" })).toBeVisible();
});

test("every tree node has its own page", async ({ page }) => {
  for (const node of siteNodes()) {
    // Status and heading only.
    const response = await page.goto(node.url, { waitUntil: "domcontentloaded" });
    expect(response?.status(), node.url).toBe(200);
    if (node.ownHeading) await expect(page.locator("h1")).not.toBeEmpty();
    else await expect(page.locator("h1")).toHaveText(node.label);
  }
});

test("a leaf deep link rests on its branch, and Back climbs one level at a time", async ({ page }) => {
  await page.goto("/personal/engineering-science");
  await whenReady(page);
  expect(await progress(page)).toBe(1);
  expect(await chosen(page)).toBe("-1");
  await page.locator("[data-back]").getByRole("link").click();
  await expect(page).toHaveURL(/\/personal$/);
  await page.locator("[data-back]").getByRole("link").click();
  await expect(page).toHaveURL(/\/$/);
  await settledAt(page, 0);
  await expect(page.getByRole("link", { name: "Personal" })).toBeVisible();
});

test("opening a leaf and returning leaves the line still", async ({ page }) => {
  await page.goto("/personal/engineering-science");
  await whenReady(page);
  await page.evaluate(() => {
    const win = window as unknown as { started: number };
    win.started = 0;
    document.addEventListener("line:transition-start", () => (win.started += 1));
  });
  await page.getByRole("link", { name: "Digital Logic Design" }).click();
  await expect(page.locator("h1")).toHaveText("Digital Logic Design");
  await page.goBack();
  await expect(page.locator("h1")).toHaveText("Engineering & Science");
  expect(await page.evaluate(() => (window as unknown as { started: number }).started)).toBe(0);
});

test("changing branch through history passes the fork and lands on the new branch", async ({ page }) => {
  await page.goto("/personal");
  await whenReady(page);
  await page.locator("[data-back]").getByRole("link").click();
  await settledAt(page, 0);
  await page.getByRole("link", { name: "Projects & Blog" }).click();
  await settledAt(page, 1);
  await page.evaluate(() => {
    const win = window as unknown as { targets: number[] };
    win.targets = [];
    document.addEventListener("line:transition-start", (event) => win.targets.push((event as CustomEvent).detail.to));
  });
  await page.evaluate(() => history.go(-2));
  await expect(page.locator("h1")).toHaveText("Personal");
  await expect.poll(() => page.evaluate(() => (window as unknown as { targets: number[] }).targets)).toEqual([0, 1]);
  await settledAt(page, 1);
  expect(await chosen(page)).toBe("-1");
  await expect(page.locator("[data-back]").getByRole("link")).toHaveAttribute("href", "/");
});

test("wheel past the page bottom at the fork continues straight on", async ({ page }) => {
  await page.goto("/");
  await whenReady(page);
  await page.mouse.move(100, 100);
  await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
  await page.waitForTimeout(100);
  await page.mouse.wheel(0, -40);
  await page.waitForTimeout(100);
  await expect(page).toHaveURL(/\/$/);
  await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
  await page.waitForTimeout(100);
  await page.mouse.wheel(0, 150);
  await expect(page).toHaveURL(/\/professional$/);
  await settledAt(page, 1);
  expect(await chosen(page)).toBe("0");

  // Past the fork the wheel only scrolls.
  await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
  await page.waitForTimeout(100);
  await page.mouse.wheel(0, 300);
  await page.waitForTimeout(200);
  await expect(page).toHaveURL(/\/professional$/);
});

test("a fast scroll down to the fork stops at the bottom, and only a new gesture walks on", async ({ page }) => {
  await page.goto("/");
  await whenReady(page);
  await page.addStyleTag({ content: "main { min-height: 300vh !important; }" });
  await page.mouse.move(100, 100);
  await page.waitForTimeout(300);
  for (let i = 0; i < 40; i += 1) {
    await page.mouse.wheel(0, 200);
    await page.waitForTimeout(30);
  }
  await expect.poll(() => page.evaluate(() => scrollY + innerHeight >= document.documentElement.scrollHeight - 1)).toBe(true);
  await page.waitForTimeout(300);
  await expect(page).toHaveURL(/\/$/);
  await page.mouse.wheel(0, 150);
  await expect(page).toHaveURL(/\/professional$/);
});

test("arrow keys pick a branch at the fork, and modified arrows stay with the browser", async ({ page }) => {
  await page.goto("/");
  await whenReady(page);
  await page.keyboard.press("Alt+ArrowRight");
  await page.keyboard.press("Shift+ArrowLeft");
  await page.waitForTimeout(100);
  await expect(page).toHaveURL(/\/$/);
  await page.keyboard.press("ArrowLeft");
  await expect(page).toHaveURL(/\/personal$/);
  await settledAt(page, 1);
  await page.keyboard.press("ArrowRight");
  await page.waitForTimeout(100);
  await expect(page).toHaveURL(/\/personal$/);
});

test.describe("on a touch screen", () => {
  test.use({ hasTouch: true });
  test("a swipe up from the page bottom at the fork continues straight on", async ({ page, context }) => {
    await page.goto("/");
    await whenReady(page);
    await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
    await page.waitForTimeout(100);
    const client = await context.newCDPSession(page);
    const touch = (type: "touchStart" | "touchMove" | "touchEnd", y: number) =>
      client.send("Input.dispatchTouchEvent", {
        type,
        touchPoints: type === "touchEnd" ? [] : [{ x: 20, y }],
      });
    await touch("touchStart", 500);
    await touch("touchMove", 400);
    await touch("touchEnd", 400);
    await expect(page).toHaveURL(/\/professional$/);
  });
});

test("reduced motion jumps straight to the end state", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await whenReady(page);
  await page.getByRole("link", { name: "Projects & Blog" }).click();
  await expect(page.locator("h1")).toHaveText("Projects & Blog");
  expect(await progress(page)).toBe(1);
});

test("the stage starts at the page top, and labels have large tap targets", async ({ page }) => {
  await page.goto("/");
  await whenReady(page);
  const top = await page.evaluate(() => document.querySelector(".line-stage")!.getBoundingClientRect().top);
  expect(top).toBe(0);
  // A phone shows the summary first, so the fork may sit one scroll below it.
  if (page.viewportSize()!.width <= 640) await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
  const label = await page.getByRole("link", { name: "Personal" }).boundingBox();
  expect(label!.height).toBeGreaterThanOrEqual(44);
  expect(label!.y + label!.height).toBeLessThanOrEqual(page.viewportSize()!.height);
});

test("fork labels stay on screen, apart, and centered on their branches", async ({ page }) => {
  await page.goto("/");
  await whenReady(page);
  const labels = await page.evaluate(() =>
    [...document.querySelectorAll("[data-option] a")].map((link) => {
      const range = document.createRange();
      range.selectNodeContents(link);
      const box = range.getBoundingClientRect();
      const option = link.closest<HTMLElement>("[data-option]")!;
      const branch = document.querySelector<SVGPathElement>(`[data-branch="${option.dataset.option}"]`)!;
      const end = branch.getPointAtLength(branch.getTotalLength());
      return { left: box.left, right: box.right, lines: range.getClientRects().length, branchX: branch.getScreenCTM()!.a * end.x + branch.getScreenCTM()!.e };
    }),
  );
  labels.forEach((label, index) => {
    expect(label.left).toBeGreaterThanOrEqual(0);
    expect(label.right).toBeLessThanOrEqual(page.viewportSize()!.width);
    expect(label.lines).toBeLessThanOrEqual(2);
    expect(Math.abs((label.left + label.right) / 2 - label.branchX)).toBeLessThan(2);
    if (index > 0) expect(label.left).toBeGreaterThan(labels[index - 1].right);
  });
});

test("no sideways page scroll in any state", async ({ page }) => {
  for (const path of ["/", "/personal", "/projects-blog/blog"]) {
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
    await page.goto("/");
    await page.getByRole("link", { name: "Personal" }).click();
    await expect(page.locator("h1")).toHaveText("Personal");
    await page.locator("[data-back]").getByRole("link").click();
    await expect(page.locator("h1")).toHaveText("Sadig Akhund");
  });
});

test.describe("scrolling back along the straight path", () => {
  const waitSettled = (page: Page) => page.waitForSelector('.line-stage[data-settled="true"]');

  test("wheel up from the top of Professional returns to the landing page", async ({ page }) => {
    await page.goto("/professional");
    await whenReady(page);
    await page.mouse.move(100, 100);
    await page.mouse.wheel(0, -150);
    await expect(page).toHaveURL(/\/$/);
    await settledAt(page, 0);
  });

  test("a fast scroll up through a long page stops at the top", async ({ page }) => {
    await page.goto("/professional");
    await whenReady(page);
    await page.addStyleTag({ content: "main { min-height: 300vh !important; }" });
    await page.evaluate(() => scrollTo(0, 200));
    await page.mouse.move(100, 100);
    await page.waitForTimeout(300);
    for (let i = 0; i < 6; i += 1) {
      await page.mouse.wheel(0, -120);
      await page.waitForTimeout(30);
    }
    await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
    await expect(page).toHaveURL(/\/professional$/);
    await page.waitForTimeout(300);
    await page.mouse.wheel(0, -150);
    await expect(page).toHaveURL(/\/$/);
  });

  test("the up arrow returns from the top, and only from the top", async ({ page }) => {
    await page.goto("/professional");
    await whenReady(page);
    await page.addStyleTag({ content: "main { min-height: 300vh !important; }" });
    await page.evaluate(() => scrollTo(0, 200));
    await page.keyboard.press("ArrowUp");
    await page.waitForTimeout(100);
    await expect(page).toHaveURL(/\/professional$/);
    await page.evaluate(() => scrollTo(0, 0));
    await page.keyboard.press("ArrowUp");
    await expect(page).toHaveURL(/\/$/);
  });

  test("the paths reached by a choice do not scroll back", async ({ page }) => {
    await page.goto("/personal");
    await whenReady(page);
    await page.mouse.move(100, 100);
    await page.mouse.wheel(0, -300);
    await page.keyboard.press("ArrowUp");
    await page.waitForTimeout(200);
    await expect(page).toHaveURL(/\/personal$/);
  });

  test("a wheel during the return cannot send the line forward again", async ({ page }) => {
    await page.goto("/professional");
    await whenReady(page);
    await page.mouse.move(100, 100);
    await page.mouse.wheel(0, -150);
    await expect(page).toHaveURL(/\/$/);
    await page.mouse.wheel(0, 300);
    await waitSettled(page);
    await page.waitForTimeout(200);
    await expect(page).toHaveURL(/\/$/);
  });
});

test("the whole stop is one link target, and its focus outline wraps the text", async ({ page }) => {
  await page.goto("/professional");
  const stop = page.locator(".stop").first();
  const url = await stop.getAttribute("data-stop-url");
  const branch = await stop.locator(".stop-branch").boundingBox();
  await page.mouse.move(branch!.x + 4, branch!.y + 4);
  const thickness = await stop.locator("a").evaluate((el) => getComputedStyle(el).textDecorationThickness);
  expect(thickness).toBe("2px");
  // The stretched link receives the click, so a real click point is used instead of an actionability check.
  const detail = await stop.locator(".role-detail").boundingBox();
  await page.mouse.click(detail!.x + 4, detail!.y + 4);
  await expect(page).toHaveURL(new RegExp(`${url}/?$`));
  await page.goBack();
  const second = page.locator(".stop").nth(1);
  const target = await second.getAttribute("data-stop-url");
  const box = await second.locator(".stop-branch").boundingBox();
  await page.mouse.click(box!.x + 4, box!.y + 4);
  await expect(page).toHaveURL(new RegExp(`${target}/?$`));
});

test("keyboard focus on a stop outlines its text in the route color", async ({ page }) => {
  await page.goto("/professional");
  await page.locator(".stop a").first().focus();
  await page.keyboard.press("Shift+Tab");
  await page.keyboard.press("Tab");
  const focus = await page.evaluate(() => {
    const text = document.querySelector(".stop-text:has(a:focus-visible)");
    const probe = document.createElement("div");
    probe.style.color = "var(--color-route)";
    document.body.append(probe);
    const style = text ? getComputedStyle(text) : null;
    return { found: !!text, kind: style?.outlineStyle, color: style?.outlineColor, token: getComputedStyle(probe).color };
  });
  expect(focus.found).toBe(true);
  expect(focus.kind).toBe("solid");
  expect(focus.color).toBe(focus.token);
});

test("a section stop ends in a filled dot that takes the route color on hover, and a leaf keeps its ring", async ({ page }) => {
  await page.goto("/personal");
  const read = (selector: string) =>
    page.evaluate((sel) => {
      const probe = (token: string) => {
        const el = document.createElement("div");
        el.style.color = `var(${token})`;
        document.body.append(el);
        const color = getComputedStyle(el).color;
        el.remove();
        return color;
      };
      const style = getComputedStyle(document.querySelector(sel)!, "::before");
      return { content: style.content, width: style.width, background: style.backgroundColor, primary: probe("--color-primary"), route: probe("--color-route") };
    }, selector);
  const rest = await read('.stop[data-kind="section"] .stop-branch');
  expect(rest.content).toBe('""');
  expect(rest.width).toBe("12px");
  expect(rest.background).toBe(rest.primary);
  const leaf = await read('.stop[data-kind="leaf"] .stop-branch');
  expect(leaf.content).toBe("none");
  await page.locator('.stop[data-kind="section"] .stop-text a').hover();
  await expect.poll(async () => (await read('.stop[data-kind="section"] .stop-branch')).background).toBe(rest.route);
});

test("after walking into a taller page, the parent's line stops where the next level leaves it", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");
  await whenReady(page);
  await page.getByRole("link", { name: "Projects & Blog" }).click();
  await settledAt(page, 1);
  await page.locator(".stop").getByRole("link", { name: "Projects", exact: true }).click();
  await expect(page.locator("h1")).toHaveText("Projects");
  await settledAt(page, 1);
  const gap = await page.evaluate(() => {
    const tail = document.querySelector(".line-tail")!.getBoundingClientRect();
    const curve = document.querySelector(".line-level-curve")!.getBoundingClientRect();
    return tail.bottom - curve.top;
  });
  expect(Math.abs(gap)).toBeLessThanOrEqual(2);
});

test("walking back, each branch has closed before the retracting line passes its root", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/projects-blog/projects");
  await whenReady(page);
  await page.waitForSelector('.line-stage[data-settled="true"]');
  await page.evaluate(() => {
    const win = window as unknown as { late: string[] };
    win.late = [];
    const run = [...document.querySelectorAll<HTMLElement>(".line-run")].at(-1)!;
    const branches = [...document.querySelectorAll<HTMLElement>("main .stop-branch")];
    const sample = () => {
      const tip = run.getBoundingClientRect().bottom;
      branches.forEach((branch, index) => {
        const animation = branch.getAnimations()[0];
        if (!animation || !branch.isConnected) return;
        const progress = animation.effect?.getComputedTiming().progress ?? 1;
        if (tip < branch.getBoundingClientRect().top - 1 && progress < 1) win.late.push(`stop ${index} at ${progress.toFixed(2)}`);
      });
      if (document.contains(run)) requestAnimationFrame(sample);
    };
    requestAnimationFrame(sample);
  });
  await page.locator("[data-back]").getByRole("link").click();
  await expect(page.locator("h1")).toHaveText("Projects & Blog");
  expect(await page.evaluate(() => (window as unknown as { late: string[] }).late)).toEqual([]);
});
