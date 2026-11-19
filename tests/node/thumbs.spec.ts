import { expect, test } from "@playwright/test";
import { thumbUrl } from "../../src/sections/thumbs";
import { parseTree } from "../../src/tree/schema";

const road = (child: Record<string, unknown>) => ({
  label: "Site",
  children: [
    { slug: "a", label: "A", side: "left", children: [{ slug: "x", label: "X", ...child }] },
    { slug: "b", label: "B", side: "straight" },
    { slug: "c", label: "C", side: "right" },
  ],
});

test("a missing thumb file fails the build naming the file", () => {
  expect(() => thumbUrl("projects/images/nope.webp", {})).toThrow('content/projects/images/nope.webp" does not exist');
});

test("a present thumb resolves to its built URL", () => {
  expect(thumbUrl("p/a.webp", { "/content/p/a.webp": "/_astro/a.1.webp" })).toBe("/_astro/a.1.webp");
});

test("the schema names a thumb of the wrong type or place", () => {
  expect(() => parseTree(road({ thumb: 3 }))).toThrow("thumb");
  expect(() => parseTree(road({ thumb: "../x.webp" }))).toThrow("inside content/");
  expect(() => parseTree(road({ thumb: "x.gif" }))).toThrow("inside content/");
  expect(parseTree(road({ thumb: "p/x.webp" })).children[0]?.children?.[0]?.thumb).toBe("p/x.webp");
});
