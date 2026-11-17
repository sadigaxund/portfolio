import { expect, test } from "@playwright/test";
import type { RunOutcome } from "@markii/host";
import { parse } from "@markii/core";
import { makeLocalImageResolver } from "../../src/markii/links";
import { lastRunText, runNotice } from "../../src/markii/runText";
import { segmentNote } from "../../src/markii/segments";

const NOW = Date.UTC(2026, 10, 17, 12, 0, 0);

test.describe("lastRunText", () => {
  test("names the build month until this browser refreshes", () => {
    expect(lastRunText(undefined, NOW, "Nov 2026")).toBe("Nov 2026");
  });
  test("words the age of a refresh", () => {
    expect(lastRunText(NOW - 20_000, NOW, "Nov 2026")).toBe("just now");
    expect(lastRunText(NOW - 10 * 60_000, NOW, "Nov 2026")).toBe("10 minutes ago");
    expect(lastRunText(NOW - 3 * 3_600_000, NOW, "Nov 2026")).toBe("3 hours ago");
    expect(lastRunText(Date.UTC(2026, 10, 12, 9), NOW, "Nov 2026")).toBe("12 Nov 2026");
  });
});

const ran = (fields: Partial<Extract<RunOutcome, { kind: "ran" }>>): RunOutcome =>
  ({ kind: "ran", values: {}, failures: [], failureDetails: [], netDeclarationDiagnostics: [], freshCount: 0, errorCount: 0, ...fields }) as RunOutcome;

test.describe("runNotice", () => {
  test("reports fresh values", () => {
    expect(runNotice(ran({ freshCount: 1 }), "Nov 2026")).toEqual({ title: "Updated.", variant: "success" });
    expect(runNotice(ran({ freshCount: 3 }), "Nov 2026")).toEqual({ title: "Updated.", variant: "success" });
  });
  test("reports a declined grant without alarm", () => {
    const outcome = ran({ errorCount: 1, failures: [{ name: "repo", kind: "capability-denied" }] as never });
    expect(runNotice(outcome, "Nov 2026")).toEqual({ title: "Not allowed. Showing data from Nov 2026.", variant: "default" });
  });
  test("reports a failure", () => {
    const outcome = ran({ errorCount: 1, failures: [{ name: "repo", kind: "script-error" }] as never });
    expect(runNotice(outcome, "Nov 2026").variant).toBe("danger");
    expect(runNotice({ kind: "failed", reason: "boom" }, "Nov 2026").variant).toBe("danger");
  });
  test("reports a run with nothing new", () => {
    expect(runNotice(ran({}), "Nov 2026").title).toBe("Already up to date.");
  });
});

test.describe("segmentNote", () => {
  test("splits detail lines from the blocks around them", () => {
    const root = parse("## Unibank\n\n*Data engineer. Baku.*\n\nText with *one* word.\n\n- item\n");
    expect(segmentNote(root.children).map((segment) => [segment.kind, segment.nodes.length])).toEqual([
      ["blocks", 1],
      ["detail", 1],
      ["blocks", 2],
    ]);
  });
});

test.describe("makeLocalImageResolver", () => {
  const images = { "/content/projects/images/demo.webp": "/_astro/demo.abc.webp" };
  const resolve = makeLocalImageResolver("content/projects/tool.mk.md", images);
  test("maps a relative image beside the note to its built file", () => {
    expect(resolve("images/demo.webp")).toBe("/_astro/demo.abc.webp");
  });
  test("leaves absolute sources and unknown files alone", () => {
    expect(resolve("https://example.com/a.png")).toBeUndefined();
    expect(resolve("images/missing.webp")).toBeUndefined();
    expect(resolve("../../../escape.webp")).toBeUndefined();
  });
});
