import { useEffect, useState } from "react";
import type { HostPromptRequest } from "@markii/host";
import { ConfirmDialog } from "my-you-eye";
import type { PromptBridge } from "./browser";

interface Pending {
  request: HostPromptRequest;
  answer: (allowed: boolean) => void;
}

/** Answers markii's questions for this page with markii's own sentence and labels. Closing any way but Allow answers no. */
export function GrantDialog({ bridge }: { bridge: PromptBridge }) {
  const [pending, setPending] = useState<Pending>();

  useEffect(() => {
    bridge.ask = (request) => new Promise<boolean>((resolve) => setPending({ request, answer: resolve }));
    return () => {
      bridge.ask = undefined;
    };
  }, [bridge]);

  const answer = (allowed: boolean) => {
    pending?.answer(allowed);
    setPending(undefined);
  };
  if (!pending) return null;
  const { request } = pending;

  return (
    <ConfirmDialog
      open
      title={request.kind === "grant-host" ? `Update from ${request.host}?` : "Allow this page to continue?"}
      description={request.message}
      cancelLabel={request.denyLabel}
      cancelVariant="secondary"
      confirmLabel={request.allowLabel}
      onConfirm={() => answer(true)}
      onOpenChange={(open) => open || answer(false)}
    />
  );
}
