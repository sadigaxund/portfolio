import { createMarkiiHost, type HostPromptRequest, type MarkiiHost } from "@markii/host";
import { createBrowserHostIsolate, createFetchNetProvider } from "@markii/host/browser";
import { createAdapter } from "./adapter";
import { BUNDLED } from "./bundled";
import { SETTINGS } from "./config";
import { createLocalStorageMemento } from "./memento";

export interface PromptBridge {
  /** Set by the dialog when it mounts. Unset means no one can answer. */
  ask: ((request: HostPromptRequest) => Promise<boolean>) | undefined;
}

/** `fetch` that fails on an error status, so a 403 or 500 counts as a failed update and the shown values stay. */
async function fetchOk(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const response = await fetch(input, init);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response;
}

/** The host a visitor's browser runs. Scripts reach only the origins in markii/settings.json. */
export function createBrowserHost(prompts: PromptBridge): MarkiiHost {
  return createMarkiiHost(
    createAdapter({
      isolate: createBrowserHostIsolate({ netProvider: createFetchNetProvider({ allowedOrigins: SETTINGS.allowedOrigins, fetch: fetchOk }) }),
      memento: createLocalStorageMemento(),
      packs: BUNDLED,
      prompt: (request) => prompts.ask?.(request) ?? Promise.resolve(false),
      diagnostics: (line) => console.info(line),
    }),
  );
}
