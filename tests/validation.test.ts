import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, describe, expect, it, vi } from "vitest";
import { runInit } from "../src/commands/init.js";
import { formatDryRunSeparator } from "../src/commands/output.js";
import { validateInitTarget } from "../src/fs/read-project.js";
import { validateCwd } from "../src/fs/validate.js";
import { existsSync } from "node:fs";

const tempDirs: string[] = [];

function makeDir(name: string): string {
  const dir = mkdtempSync(join(tmpdir(), `ack-val-${name}-`));
  tempDirs.push(dir);
  return dir;
}

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

describe("validateCwd", () => {
  it("rejects missing directory", () => {
    expect(validateCwd("/path/that/does/not/exist-ack-xyz")).toMatch(
      /does not exist/,
    );
  });

  it("rejects file path", () => {
    const dir = makeDir("file");
    const file = join(dir, "not-a-dir");
    writeFileSync(file, "x");
    expect(validateCwd(file)).toMatch(/Not a directory/);
  });
});

describe("validateInitTarget", () => {
  it("rejects missing package.json", () => {
    const dir = makeDir("no-pkg");
    expect(validateInitTarget(dir)).toMatch(/No package\.json found/);
  });

  it("rejects invalid JSON", () => {
    const dir = makeDir("bad-json");
    writeFileSync(join(dir, "package.json"), "{ not json");
    expect(validateInitTarget(dir)).toMatch(/JSON parse error/);
  });
});

describe("runInit validation", () => {
  it("exits 1 when cwd does not exist", async () => {
    const code = await runInit({
      cwd: join(tmpdir(), "ack-missing-cwd-xyz"),
    });
    expect(code).toBe(1);
  });
});

describe("runInit dry-run", () => {
  it("writes nothing", async () => {
    const dir = makeDir("dry");
    writeFileSync(
      join(dir, "package.json"),
      JSON.stringify({ name: "dry-app", scripts: { build: "tsc" } }),
    );
    const code = await runInit({ cwd: dir, dryRun: true });
    expect(code).toBe(0);
    expect(existsSync(join(dir, "AGENTS.md"))).toBe(false);
  });

  it("prints separator before dry-run notice", async () => {
    const dir = makeDir("dry-sep");
    writeFileSync(
      join(dir, "package.json"),
      JSON.stringify({ name: "app", scripts: {} }),
    );
    const logs: string[] = [];
    const spy = vi.spyOn(console, "log").mockImplementation((...args) => {
      logs.push(args.map(String).join(" "));
    });
    await runInit({ cwd: dir, dryRun: true });
    spy.mockRestore();
    const out = logs.join("\n");
    expect(out).toContain(formatDryRunSeparator());
    expect(out).toContain("Dry run — no files written.");
    expect(out.indexOf(formatDryRunSeparator())).toBeLessThan(
      out.indexOf("Dry run — no files written."),
    );
  });
});
