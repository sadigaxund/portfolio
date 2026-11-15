import type { StoredValue } from "@markii/runtime";

// Local copy of @markii/host's mergeArrivingValue until markii-org/markii#75 ships the export.
/** Folds one arriving value into the page's values. A new error never replaces a good value, which stays and reads stale. */
export function mergeArrivingValue(
  values: Readonly<Record<string, StoredValue>>,
  name: string,
  value: StoredValue,
): Record<string, StoredValue> {
  const existing = Object.hasOwn(values, name) ? values[name] : undefined;
  const keep = value.status === "error" && existing !== undefined && existing.status !== "error";
  const next: StoredValue = keep ? { ...existing, status: "stale" } : value;
  const entries = Object.entries(values).map(([key, current]): [string, StoredValue] => [key, key === name ? next : current]);
  if (existing === undefined) entries.push([name, next]);
  return Object.fromEntries(entries);
}
