const DOC_EXT = /\.(mk\.md|md)$/;

/** The leaf route a document path belongs to, such as `professional/career` for `/content/professional/career.mk.md`. */
function routeOfDocument(path: string): string {
  return path.replace(/^\/?content\//, "").replace(DOC_EXT, "");
}

/** Compares leaf routes with document paths. Returns one message per problem, and none when they match. */
export function checkDocuments(leafRoutes: readonly string[], documentPaths: readonly string[]): string[] {
  const errors: string[] = [];
  const byRoute = new Map<string, string[]>();
  for (const path of documentPaths) {
    const route = routeOfDocument(path);
    byRoute.set(route, [...(byRoute.get(route) ?? []), path]);
  }
  for (const route of leafRoutes) {
    const found = byRoute.get(route) ?? [];
    if (found.length === 0) errors.push(`leaf "${route}" has no document; add content/${route}.md or content/${route}.mk.md`);
    if (found.length > 1) errors.push(`leaf "${route}" has ${found.length} documents (${found.join(", ")}); keep one`);
  }
  const leaves = new Set(leafRoutes);
  for (const [route, paths] of byRoute) {
    if (!leaves.has(route)) errors.push(`document ${paths.join(", ")} has no leaf; add "${route}" to content/site.yaml or delete the document`);
  }
  return errors;
}
