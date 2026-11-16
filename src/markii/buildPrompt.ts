import type { HostPromptRequest } from "@markii/host";

// The request carries no host field, so the asked host is read from the start of markii's own message.
const ASKED_HOST = /^This note's scripts can send data to (\S+?)\. /;

/**
 * The build's answer to every question. Yes only to a `grant-host` for a host in the site settings, no to the rest.
 * The note decides nothing: its own declared hosts come after the asked host in the message and are never read.
 */
export function createBuildPrompt(allowedOrigins: readonly string[]): (request: HostPromptRequest) => Promise<boolean> {
  const hosts = new Set(allowedOrigins.map((origin) => new URL(origin).host));
  return async (request) => {
    if (request.kind !== "grant-host") return false;
    const asked = ASKED_HOST.exec(request.message)?.[1];
    return asked !== undefined && hosts.has(asked);
  };
}
