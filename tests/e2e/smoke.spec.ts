import { expect, test, type Page } from "@playwright/test";

type Colors = { background: string; border: string; text: string };

async function openWatched(page: Page, path: string) {
  const problems: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") problems.push(`console: ${msg.text()}`);
  });
  page.on("pageerror", (error) => problems.push(`pageerror: ${error.message}`));
  page.on("requestfailed", (req) => problems.push(`failed: ${req.url()}`));
  page.on("response", (res) => {
    if (res.status() >= 400) problems.push(`${res.status()}: ${res.url()}`);
  });
  await page.goto(path);
  await page.getByRole("button", { name: "PLACEHOLDER" }).waitFor();
  return problems;
}

function colorsOf(page: Page): Promise<Colors> {
  return page.getByRole("button", { name: "PLACEHOLDER" }).evaluate((el) => {
    const style = getComputedStyle(el);
    return {
      background: style.backgroundColor,
      border: style.borderTopColor,
      text: style.color,
    };
  });
}

function primaryToken(page: Page): Promise<string> {
  return page.evaluate(() => {
    const probe = document.createElement("div");
    probe.style.backgroundColor = "var(--color-primary)";
    document.body.append(probe);
    const value = getComputedStyle(probe).backgroundColor;
    probe.remove();
    return value;
  });
}

test("loads without console errors or failed requests", async ({ page }) => {
  const problems = await openWatched(page, "/smoke");
  await page.waitForLoadState("networkidle");
  expect(problems).toEqual([]);
});

test("button is visible and styled by the library", async ({ page }) => {
  await openWatched(page, "/smoke");
  const button = page.getByRole("button", { name: "PLACEHOLDER" });
  await expect(button).toBeVisible();
  const colors = await colorsOf(page);
  const token = await primaryToken(page);
  expect(token).not.toBe("rgba(0, 0, 0, 0)");
  expect(colors.background).toBe(token);
});

test("button colors differ between light and dark", async ({ page }) => {
  await openWatched(page, "/smoke");
  const light = await colorsOf(page);
  await openWatched(page, "/smoke?theme=dark");
  await expect(page.locator("html")).toHaveClass(/dark/);
  const dark = await colorsOf(page);
  expect(dark).not.toEqual(light);
});

test("keyboard focus shows a focus style", async ({ page }) => {
  await openWatched(page, "/smoke");
  const button = page.getByRole("button", { name: "PLACEHOLDER" });
  const read = () =>
    button.evaluate((el) => {
      const style = getComputedStyle(el);
      return style.boxShadow;
    });
  expect(await read()).toBe("none");
  await page.keyboard.press("Tab");
  await expect(button).toBeFocused();
  expect(await read()).not.toBe("none");
});

test("the landing hero answers first, and stays clear of the line", async ({ page }) => {
  {
    await page.goto("/");
    await page.waitForSelector(".line-stage[data-ready]");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    for (const label of ["Email", "GitHub", "LinkedIn"]) {
      await expect(page.getByRole("link", { name: label })).toBeInViewport();
    }
    const clash = await page.evaluate(() => {
      const hero = document.querySelector(".hero")!.getBoundingClientRect();
      const trunk = document.querySelector(".line-trunk")!.getBoundingClientRect();
      const texts = [...document.querySelectorAll(".hero h1, .hero p, .hero li")].map((el) => {
        const range = document.createRange();
        range.selectNodeContents(el);
        return range.getBoundingClientRect();
      });
      return {
        crosses: texts.some((box) => box.left < trunk.right && box.right > trunk.left && box.top < trunk.bottom && box.bottom > trunk.top),
        offscreen: hero.left < 0 || hero.right > document.documentElement.clientWidth,
      };
    });
    expect(clash).toEqual({ crosses: false, offscreen: false });
  }
});

for (const path of ["/", "/projects-blog", "/projects-blog/projects"]) {
  test(`every text on ${path} sits on paper, not on the grid`, async ({ page }) => {
    await page.goto(path);
    const bare = await page.evaluate(() => {
      const probe = document.createElement("div");
      probe.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue("--color-bg");
      document.body.append(probe);
      const paper = getComputedStyle(probe).backgroundColor;
      probe.remove();
      const roots = [...document.querySelectorAll<HTMLElement>("main, .line-option")];
      const holders = roots.flatMap((root) =>
        [root, ...root.querySelectorAll<HTMLElement>("*")].filter((el) =>
          [...el.childNodes].some((n) => n.nodeType === Node.TEXT_NODE && n.textContent!.trim() !== ""),
        ),
      );
      const onPaper = (el: HTMLElement | null): boolean =>
        el !== null && (getComputedStyle(el).backgroundColor === paper || (el.tagName !== "MAIN" && onPaper(el.parentElement)));
      return holders.filter((el) => el.checkVisibility() && !onPaper(el)).map((el) => el.textContent!.trim().slice(0, 40));
    });
    expect(bare).toEqual([]);
  });
}

test("section text sits on plain paper, sized to its words", async ({ page }) => {
  await page.goto("/projects-blog/projects");
  const read = () =>
    page.evaluate(() => {
      const paper = getComputedStyle(document.documentElement).getPropertyValue("--color-bg");
      const probe = document.createElement("div");
      probe.style.backgroundColor = paper;
      document.body.append(probe);
      const bg = getComputedStyle(probe).backgroundColor;
      probe.remove();
      const h1 = document.querySelector<HTMLElement>(".line-content h1")!;
      const text = document.createRange();
      text.selectNodeContents(h1);
      const em = parseFloat(getComputedStyle(h1).fontSize);
      return {
        bg,
        h1: getComputedStyle(h1).backgroundColor,
        slack: h1.getBoundingClientRect().width - text.getBoundingClientRect().width,
        em,
        stops: [...document.querySelectorAll(".stop h2")].map((h2) => getComputedStyle(h2).backgroundColor),
      };
    });
  const got = await read();
  expect(got.stops.length).toBeGreaterThan(0);
  expect(got.h1).toBe(got.bg);
  for (const stop of got.stops) expect(stop).toBe(got.bg);
  expect(got.slack).toBeLessThanOrEqual(got.em);
});
