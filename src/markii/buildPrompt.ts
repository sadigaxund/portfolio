import type { HostPromptRequest } from "@markii/host";
import { askedHost } from "./promptHost";

/**
 * The build's answer to every question. Yes only to a `grant-host` for a host in the site settings, no to the rest.
 * The note decides nothing: its own declared hosts come after the asked host in the message and are never read.
 */
export function createBuildPrompt(allowedOrigins: readonly string[]): (request: HostPromptRequest) => Promise<boolean> {
  const hosts = new Set(allowedOrigins.map((origin) => new URL(origin).host));
  return async (request) => {
    const asked = askedHost(request);
    return asked !== undefined && hosts.has(asked);
  };
}
