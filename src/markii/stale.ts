import type { StoredValue } from "@markii/runtime";

// Local copy of @markii/host's staleValuesForRehydration until markii-org/markii#75 ships the export.
/** Marks every fresh value stale and leaves every other status as it is. */
export function stale(values: Readonly<Record<string, StoredValue>>): Record<string, StoredValue> {
  return Object.fromEntries(
    Object.entries(values).map(([name, value]): [string, StoredValue] => [name, value.status === "fresh" ? { ...value, status: "stale" } : value]),
  );
}
