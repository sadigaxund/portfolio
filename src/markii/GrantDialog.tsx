import { useEffect, useState } from "react";
import type { HostPromptRequest } from "@markii/host";
import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "my-you-eye";
import type { PromptBridge } from "./browser";
import { askedHost } from "./promptHost";

interface Pending {
  request: HostPromptRequest;
  answer: (allowed: boolean) => void;
}

/**
 * Answers markii's questions for this page. The site frames the question in plain words, then quotes
 * markii's own sentence and labels unchanged. Closing the dialog any way other than Allow answers no.
 */
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
  const host = pending && askedHost(pending.request);

  return (
    <Dialog open={pending !== undefined} onOpenChange={(open) => open || answer(false)}>
      {pending && (
        <DialogContent size="sm">
          <DialogHeader>
            <DialogTitle>{host ? `Refresh values from ${host}?` : "Allow this page to continue?"}</DialogTitle>
            <DialogDescription>
              {host
                ? `The figures on this page come from ${host}. Refreshing them makes your browser ask ${host} for the latest ones.`
                : "Markii, which runs this page, needs your answer first."}
            </DialogDescription>
          </DialogHeader>
          {host && <p className="role-detail">Markii, which runs this page, asks first:</p>}
          <blockquote className="grant-quote role-detail">{pending.request.message}</blockquote>
          <DialogFooter>
            <Button variant="secondary" onClick={() => answer(false)}>
              {pending.request.denyLabel}
            </Button>
            <Button onClick={() => answer(true)}>{pending.request.allowLabel}</Button>
          </DialogFooter>
        </DialogContent>
      )}
    </Dialog>
  );
}
