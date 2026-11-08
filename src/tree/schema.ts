import { asList, asRecord, asString, fail } from "./check";
import type { NodeSpec, RoadSpec, Side, TreeSpec } from "./tree";

const FILE = "content/site.yaml";
const SLUG = /^[a-z0-9-]+$/;
const NODE_KEYS = ["slug", "label", "summary", "preview", "children"] as const;
const SIDES: readonly Side[] = ["left", "straight", "right"];

function parseNode(value: unknown, path: string, keys: readonly string[] = NODE_KEYS): NodeSpec {
  const record = asRecord(FILE, path, value, keys);
  const slug = asString(FILE, `${path}.slug`, record.slug);
  if (!SLUG.test(slug)) fail(FILE, `${path}.slug`, `must match ${SLUG} but is "${slug}"`);
  const node: NodeSpec = { slug, label: asString(FILE, `${path}.label`, record.label) };
  const hasChildren = record.children !== undefined;
  if (record.summary !== undefined) {
    if (!hasChildren) fail(FILE, `${path}.summary`, "is only allowed on a section, which has children");
    node.summary = asString(FILE, `${path}.summary`, record.summary);
  }
  if (record.preview !== undefined) {
    if (hasChildren) fail(FILE, `${path}.preview`, "is only allowed on a leaf, which has no children");
    node.preview = asString(FILE, `${path}.preview`, record.preview);
  }
  if (hasChildren) {
    const list = asList(FILE, `${path}.children`, record.children);
    if (list.length === 0) fail(FILE, `${path}.children`, "must not be empty; omit it for a leaf");
    node.children = list.map((child, index) => parseNode(child, `${path}.children[${index}]`));
    const seen = new Set<string>();
    node.children.forEach((child, index) => {
      if (seen.has(child.slug)) fail(FILE, `${path}.children[${index}].slug`, `"${child.slug}" repeats among siblings`);
      seen.add(child.slug);
    });
  }
  return node;
}

function parseRoad(value: unknown, path: string): RoadSpec {
  const node = parseNode(value, path, [...NODE_KEYS, "side"]);
  const side = asString(FILE, `${path}.side`, (value as Record<string, unknown>).side);
  if (!SIDES.includes(side as Side)) fail(FILE, `${path}.side`, `must be one of ${SIDES.join(", ")} but is "${side}"`);
  return { ...node, side: side as Side };
}

/** Turns the parsed YAML into the tree, or throws naming the first bad field. */
export function parseTree(data: unknown): TreeSpec {
  const record = asRecord(FILE, "(root)", data, ["label", "children"]);
  const roads = asList(FILE, "children", record.children).map((road, index) => parseRoad(road, `children[${index}]`));
  // The fork draws one road per side. More per side needs engine work first.
  for (const side of SIDES) {
    const count = roads.filter((road) => road.side === side).length;
    if (count !== 1) fail(FILE, "children", `must have exactly one road with side: ${side}, but has ${count}; the fork draws one road per side`);
  }
  const seen = new Set<string>();
  roads.forEach((road, index) => {
    if (seen.has(road.slug)) fail(FILE, `children[${index}].slug`, `"${road.slug}" repeats among siblings`);
    seen.add(road.slug);
  });
  return { label: asString(FILE, "label", record.label), children: roads };
}
