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

/** The host a visitor's browser runs. Scripts reach only the origins in markii/settings.json. */
export function createBrowserHost(prompts: PromptBridge): MarkiiHost {
  return createMarkiiHost(
    createAdapter({
      isolate: createBrowserHostIsolate({ netProvider: createFetchNetProvider({ allowedOrigins: SETTINGS.allowedOrigins }) }),
      memento: createLocalStorageMemento(),
      packs: BUNDLED,
      prompt: (request) => prompts.ask?.(request) ?? Promise.resolve(false),
      diagnostics: (line) => console.info(line),
    }),
  );
}
