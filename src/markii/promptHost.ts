import type { HostPromptRequest } from "@markii/host";

// The request carries no host field until markii-org/markii#80 ships, so the host is read from markii's own sentence.
const ASKED_HOST = /^This note's scripts can send data to (\S+?)\. /;

/** The one host a `grant-host` question asks about, or undefined for any other question. */
export function askedHost(request: HostPromptRequest): string | undefined {
  return request.kind === "grant-host" ? ASKED_HOST.exec(request.message)?.[1] : undefined;
}
