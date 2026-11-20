import { expect, test } from "@playwright/test";
import { hiddenRoutes, hideDrafts, hidesDrafts } from "../../src/tree/drafts";
import { parseTree } from "../../src/tree/schema";

const tree = parseTree({
  label: "Root",
  children: [
    {
      slug: "a",
      label: "A",
      side: "left",
      children: [
        { slug: "x", label: "X", draft: true },
        { slug: "g", label: "G", children: [{ slug: "y", label: "Y", draft: true }] },
      ],
    },
    {
      slug: "b",
      label: "B",
      side: "straight",
      children: [
        { slug: "p", label: "P" },
        { slug: "q", label: "Q", draft: true, children: [{ slug: "deep", label: "Deep" }] },
      ],
    },
    { slug: "c", label: "C", side: "right", children: [{ slug: "r", label: "R" }] },
  ],
});

test.describe("drafts", () => {
  test("only the value hide turns the filter on", () => {
    expect(hidesDrafts("hide")).toBe(true);
    expect(hidesDrafts("")).toBe(false);
    expect(hidesDrafts(undefined)).toBe(false);
  });
  test("a draft takes its subtree, and a section left empty goes too, but a road stays", () => {
    const kept = hideDrafts(tree);
    expect(kept.children.map((road) => road.slug)).toEqual(["a", "b", "c"]);
    expect(kept.children[0].children).toEqual([]);
    expect(kept.children[1].children?.map((child) => child.slug)).toEqual(["p"]);
  });
  test("a road marked draft itself is hidden", () => {
    const own = { ...tree, children: [{ ...tree.children[0], draft: true as const }, ...tree.children.slice(1)] };
    expect(hideDrafts(own).children.map((road) => road.slug)).toEqual(["b", "c"]);
    expect(hiddenRoutes(own)).toEqual(["a", "b/q"]);
  });
  test("lists the hidden routes without descending into them", () => {
    expect(hiddenRoutes(tree)).toEqual(["a/x", "a/g", "b/q"]);
  });
  test("rejects a draft that is not a boolean", () => {
    expect(() => parseTree({ label: "R", children: [{ slug: "a", label: "A", side: "left", draft: "yes" }] })).toThrow("draft must be true or false");
  });
});
