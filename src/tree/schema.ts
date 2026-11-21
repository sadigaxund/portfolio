import { asList, asRecord, asString, fail } from "./check";
import type { NodeSpec, RoadColor, RoadSpec, Side, TreeSpec } from "./tree";

const FILE = "content/site.yaml";
const SLUG = /^[a-z0-9-]+$/;
const NODE_KEYS = ["slug", "label", "summary", "preview", "stars", "thumb", "children", "draft"] as const;
const THUMB = /^(?!\/)(?!.*\.\.)[^\s]+\.(webp|png|jpg)$/;
const STARS = /^[0-9]+\+?$/;
const SIDES: readonly Side[] = ["left", "straight", "right"];
const HEX = /^#[0-9a-f]{6}$/;
/** Three lines of a stop hold about 100 characters on a 360px phone, so a legal preview is never cut off. */
const PREVIEW_MAX = 90;

function parseNode(value: unknown, path: string, keys: readonly string[] = NODE_KEYS): NodeSpec {
  const record = asRecord(FILE, path, value, keys);
  const slug = asString(FILE, `${path}.slug`, record.slug);
  if (!SLUG.test(slug)) fail(FILE, `${path}.slug`, `must match ${SLUG} but is "${slug}"`);
  const node: NodeSpec = { slug, label: asString(FILE, `${path}.label`, record.label) };
  if (record.draft !== undefined) {
    if (typeof record.draft !== "boolean") fail(FILE, `${path}.draft`, "must be true or false");
    if (record.draft) node.draft = true;
  }
  const hasChildren = record.children !== undefined;
  if (record.summary !== undefined) {
    if (!hasChildren) fail(FILE, `${path}.summary`, "is only allowed on a section, which has children");
    node.summary = asString(FILE, `${path}.summary`, record.summary);
  }
  if (record.preview !== undefined) {
    if (hasChildren) fail(FILE, `${path}.preview`, "is only allowed on a leaf, which has no children");
    node.preview = asString(FILE, `${path}.preview`, record.preview);
    if (node.preview.length > PREVIEW_MAX) {
      fail(FILE, `${path}.preview`, `is ${node.preview.length} characters; keep it to ${PREVIEW_MAX} so a phone shows it whole`);
    }
  }
  if (record.stars !== undefined) {
    if (hasChildren) fail(FILE, `${path}.stars`, "is only allowed on a leaf, which has no children");
    node.stars = asString(FILE, `${path}.stars`, String(record.stars));
    if (!STARS.test(node.stars)) fail(FILE, `${path}.stars`, `must be a number with an optional +, such as 200+, but is "${node.stars}"`);
    const length = `${node.stars} stars. ${node.preview ?? ""}`.length;
    if (length > PREVIEW_MAX) fail(FILE, `${path}.stars`, `with the preview makes ${length} characters; keep both to ${PREVIEW_MAX}`);
  }
  if (record.thumb !== undefined) {
    if (hasChildren) fail(FILE, `${path}.thumb`, "is only allowed on a leaf, which has no children");
    node.thumb = asString(FILE, `${path}.thumb`, record.thumb);
    if (!THUMB.test(node.thumb)) fail(FILE, `${path}.thumb`, `must be a .webp, .png, or .jpg path inside content/, but is "${node.thumb}"`);
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

function parseColor(value: unknown, path: string): RoadColor {
  const record = asRecord(FILE, path, value, ["light", "dark"]);
  const pick = (scheme: "light" | "dark") => {
    const color = asString(FILE, `${path}.${scheme}`, record[scheme]);
    if (!HEX.test(color)) fail(FILE, `${path}.${scheme}`, `must be a lowercase #rrggbb color but is "${color}"`);
    return color;
  };
  return { light: pick("light"), dark: pick("dark") };
}

function parseRoad(value: unknown, path: string): RoadSpec {
  const node = parseNode(value, path, [...NODE_KEYS, "side", "color"]);
  const record = value as Record<string, unknown>;
  const side = asString(FILE, `${path}.side`, record.side);
  if (!SIDES.includes(side as Side)) fail(FILE, `${path}.side`, `must be one of ${SIDES.join(", ")} but is "${side}"`);
  return { ...node, side: side as Side, color: parseColor(record.color, `${path}.color`) };
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
