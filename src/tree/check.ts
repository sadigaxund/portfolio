/** Small checks shared by the content validators. Each throws an error that names the field path. */
export function fail(file: string, path: string, rule: string): never {
  throw new Error(`${file}: ${path} ${rule}`);
}

export function asRecord(file: string, path: string, value: unknown, allowed: readonly string[]): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) fail(file, path, "must be a mapping");
  const record = value as Record<string, unknown>;
  for (const key of Object.keys(record)) {
    if (!allowed.includes(key)) fail(file, `${path}.${key}`, `is not a known key (allowed: ${allowed.join(", ")})`);
  }
  return record;
}

export function asString(file: string, path: string, value: unknown): string {
  if (typeof value !== "string" || value.trim() === "") fail(file, path, "must be a non-empty string");
  return value;
}

export function asList(file: string, path: string, value: unknown): unknown[] {
  if (!Array.isArray(value)) fail(file, path, "must be a list");
  return value;
}
