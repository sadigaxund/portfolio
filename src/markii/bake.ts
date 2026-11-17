import { createMarkiiHost } from "@markii/host";
import { createNodeHostIsolate } from "@markii/host/node";
import type { StoredValue } from "@markii/runtime";
import { createAdapter } from "./adapter";
import { createBuildPrompt } from "./buildPrompt";
import { createMemoryMemento } from "./memento";
import { bundlePacks } from "./packs";

// A denied or failed network call leaves the value empty and logs one line. Any other failure fails the build.
const NETWORK_KINDS: readonly string[] = ["capability-denied", "tier-blocked", "network"];

// In CI a failed bake waits and tries again before it fails the deploy, so a short rate limit does not.
const RETRY_DELAYS_MS: readonly number[] = process.env.CI ? [60_000, 300_000, 600_000] : [];

export interface BakeRequest {
  documentKey: string;
  text: string;
  allowedOrigins: readonly string[];
  /** One line to the build log. */
  log: (line: string) => void;
  /** Waits between attempts. Defaults to 1, 5, then 10 minutes in CI, and none locally. */
  retryDelaysMs?: readonly number[];
  /** Fail the build after the last attempt. Defaults to on in CI; off locally, where the note shows its empty state. */
  strict?: boolean;
}

/**
 * Runs a note's scripts once at build time and returns the values that can be shown.
 * A script error or a run that did not finish fails the build. A network denial logs one line and leaves that value empty.
 * The memento is new for each call and is never written anywhere.
 */
async function bakeOnce(request: BakeRequest): Promise<Record<string, StoredValue>> {
  const host = createMarkiiHost(
    createAdapter({
      isolate: createNodeHostIsolate(),
      memento: createMemoryMemento(),
      packs: bundlePacks({}),
      prompt: createBuildPrompt(request.allowedOrigins),
      diagnostics: () => {},
    }),
  );
  const outcome = await host.run({ documentKey: request.documentKey, text: request.text, trigger: "manual" });
  if (outcome.kind !== "ran") {
    const why = outcome.kind === "failed" ? `: ${outcome.reason}` : "";
    throw new Error(`Markii bake failed: ${request.documentKey} run ${outcome.kind}${why}`);
  }
  const problems: string[] = [];
  const empty = new Set<string>();
  for (const failure of outcome.failureDetails) {
    empty.add(failure.name);
    if (NETWORK_KINDS.includes(failure.kind)) {
      request.log(`markii: ${request.documentKey} script "${failure.name}" had no network access (${failure.kind}); the note shows its empty state`);
    } else {
      problems.push(`${request.documentKey} script "${failure.name}" ${failure.kind}: ${failure.message}`);
    }
  }
  if (problems.length > 0) throw new Error(`Markii bake failed:\n- ${problems.join("\n- ")}`);
  return Object.fromEntries(Object.entries(outcome.values).filter(([name]) => !empty.has(name)));
}

/** Bakes a note, trying again after each delay. A strict bake throws the last failure; otherwise it logs it and returns no values. */
export async function bakeNote(request: BakeRequest): Promise<Record<string, StoredValue>> {
  for (const delay of request.retryDelaysMs ?? RETRY_DELAYS_MS) {
    try {
      return await bakeOnce(request);
    } catch (error) {
      request.log(`${String(error)}; trying again in ${delay / 1000} s`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  try {
    return await bakeOnce(request);
  } catch (error) {
    if (request.strict ?? Boolean(process.env.CI)) throw error;
    request.log(`${String(error)}; the note shows its empty state in this local build`);
    return {};
  }
}
