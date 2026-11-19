import { expect, test } from "@playwright/test";
import type { HostPromptRequest } from "@markii/host";
import { bakeHeaders, bakeNote } from "../../src/markii/bake";
import { createBuildPrompt } from "../../src/markii/buildPrompt";
import { staleValuesForRehydration as stale } from "@markii/host";

const ORIGINS = ["https://api.github.com"];
const ask = createBuildPrompt(ORIGINS);
const base = { message: "Allow?", allowLabel: "Allow", denyLabel: "Don't allow", consequential: true };
const grant = (host: string, declaredHosts: string[] = []): HostPromptRequest => ({ ...base, kind: "grant-host", host, declaredHosts });

test.describe("the build prompt", () => {
  test("allows a listed host", async () => {
    expect(await ask(grant("api.github.com"))).toBe(true);
  });
  test("refuses an unlisted host", async () => {
    expect(await ask(grant("example.com"))).toBe(false);
    expect(await ask(grant("api.github.com.evil.test"))).toBe(false);
  });
  test("a note cannot talk its way in through its declared hosts", async () => {
    expect(await ask(grant("example.com", ["api.github.com"]))).toBe(false);
  });
  test("refuses every other kind, even with a listed host in the message", async () => {
    const hosts = ["api.github.com"];
    const others: HostPromptRequest[] = [
      { ...base, kind: "grant-unknown-hosts", hosts },
      { ...base, kind: "grant-many-hosts", hosts },
      ...(["pack-install-consent", "pack-replace", "pack-overwrite-export", "enable-scripts"] as const).map((kind) => ({ ...base, kind })),
    ];
    for (const request of others) expect(await ask(request)).toBe(false);
  });
});

test.describe("stale", () => {
  test("marks fresh values stale and leaves other statuses alone", () => {
    const out = stale({
      a: { value: 1, status: "fresh", ranAt: 5 },
      b: { value: 2, status: "stale" },
      c: { value: undefined, status: "error", error: "x" },
    });
    expect(out.a).toEqual({ value: 1, status: "stale", ranAt: 5 });
    expect(out.b.status).toBe("stale");
    expect(out.c.status).toBe("error");
  });
});

test.describe("bakeNote", () => {
  const base = { documentKey: "content/x/note.mk.md", allowedOrigins: ORIGINS };
  const note = (name: string, code: string) => `# T\n\n\`\`\`lua {name=${name}}\n${code}\n\`\`\`\n`;

  test("returns the values of a good script", async () => {
    const values = await bakeNote({ ...base, text: note("total", "return 6 * 7"), log: () => {} });
    expect(values.total.value).toBe(42);
  });
  test("a Lua error fails the build with the note path and script name", async () => {
    const promise = bakeNote({ ...base, text: note("broken", 'error("boom")'), log: () => {}, retryDelaysMs: [], strict: true });
    await expect(promise).rejects.toThrow(/content\/x\/note\.mk\.md script "broken" script-error/);
  });
  test("a strict bake tries again after each delay, then fails", async () => {
    const lines: string[] = [];
    const promise = bakeNote({ ...base, text: note("broken", 'error("boom")'), log: (line) => lines.push(line), retryDelaysMs: [1, 1], strict: true });
    await expect(promise).rejects.toThrow(/script "broken" script-error/);
    expect(lines.filter((line) => line.includes("trying again"))).toHaveLength(2);
  });
  test("a local bake logs a failure and returns no values", async () => {
    const lines: string[] = [];
    const values = await bakeNote({ ...base, text: note("broken", 'error("boom")'), log: (line) => lines.push(line), retryDelaysMs: [], strict: false });
    expect(values).toEqual({});
    expect(lines.at(-1)).toContain("empty state in this local build");
  });
  test("a denied network call logs one line and leaves the value empty", async () => {
    const lines: string[] = [];
    const text = note("far", 'return net.fetch_json("https://example.org/data")');
    const values = await bakeNote({ ...base, text, log: (line) => lines.push(line) });
    expect(values.far).toBeUndefined();
    expect(lines).toHaveLength(1);
    expect(lines[0]).toContain('script "far"');
  });
});

test.describe("bakeHeaders", () => {
  test("gives the token to the GitHub API origin only", () => {
    expect(bakeHeaders({ GITHUB_TOKEN: "t0k" })).toEqual({ "https://api.github.com": { Authorization: "Bearer t0k" } });
  });
  test("adds no headers without a token", () => {
    expect(bakeHeaders({})).toBeUndefined();
    expect(bakeHeaders({ GITHUB_TOKEN: "" })).toBeUndefined();
  });
});
