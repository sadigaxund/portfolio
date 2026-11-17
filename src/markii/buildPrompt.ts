import type { HostPromptRequest } from "@markii/host";

/** Yes only to a `grant-host` for a host in the site settings. A note's declared hosts decide nothing. */
export function createBuildPrompt(allowedOrigins: readonly string[]): (request: HostPromptRequest) => Promise<boolean> {
  const hosts = new Set(allowedOrigins.map((origin) => new URL(origin).host));
  return async (request) => request.kind === "grant-host" && hosts.has(request.host);
}
