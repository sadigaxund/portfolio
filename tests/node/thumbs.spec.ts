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

test("the schema takes a star count only as a number with an optional plus, within the preview's length", () => {
  expect(parseTree(road({ stars: "200+" })).children[0]?.children?.[0]?.stars).toBe("200+");
  expect(parseTree(road({ stars: 14 })).children[0]?.children?.[0]?.stars).toBe("14");
  expect(() => parseTree(road({ stars: "lots" }))).toThrow("stars must be a number");
  expect(() => parseTree(road({ stars: "200+", preview: "x".repeat(80) }))).toThrow("keep both to 90");
});
