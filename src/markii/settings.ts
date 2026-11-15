import { asList, asRecord, fail } from "../tree/check";

const FILE = "markii/settings.json";
const KEYS = ["allowedOrigins", "runOnOpen"] as const;

export interface MarkiiSettings {
  /** The origins a script may fetch. Everything else is refused. */
  allowedOrigins: string[];
  /** Run a note's scripts when a visitor opens it. */
  runOnOpen: boolean;
}

/** Turns parsed JSON into settings, or throws naming the first bad key. */
export function parseSettings(data: unknown): MarkiiSettings {
  const record = asRecord(FILE, "(root)", data, KEYS);
  const origins = asList(FILE, "allowedOrigins", record.allowedOrigins).map((origin, index) => {
    if (typeof origin !== "string") fail(FILE, `allowedOrigins[${index}]`, "must be a string");
    let url: URL;
    try {
      url = new URL(origin);
    } catch {
      fail(FILE, `allowedOrigins[${index}]`, `must be an origin such as https://api.github.com but is "${origin}"`);
    }
    if ((url.protocol !== "https:" && url.protocol !== "http:") || url.origin !== origin) {
      fail(FILE, `allowedOrigins[${index}]`, `must be an http(s) origin with no path, such as https://api.github.com, but is "${origin}"`);
    }
    return origin;
  });
  if (typeof record.runOnOpen !== "boolean") fail(FILE, "runOnOpen", "must be true or false");
  return { allowedOrigins: origins, runOnOpen: record.runOnOpen };
}
