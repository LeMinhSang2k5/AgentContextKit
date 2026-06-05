import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, describe, expect, it, vi } from "vitest";
import { runInit } from "../src/commands/init.js";
import { runPrompt } from "../src/commands/prompt.js";
import { CONFIG_FILE } from "../src/config/types.js";
import type { PromptJsonOutput } from "../src/prompt/types.js";

const tempDirs: string[] = [];

function writeFileWithParents(filePath: string, content: string): void {
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, content);
}

function makeProject(name: string, extra: Record<string, string> = {}): string {
  const dir = mkdtempSync(join(tmpdir(), `ack-prompt-context-${name}-`));
  tempDirs.push(dir);
  const files = {
    "package.json": JSON.stringify({
      name: "prompt-context-app",
      scripts: {
        build: "vite build",
        test: "vitest run",
        typecheck: "tsc --noEmit",
      },
      dependencies: {
        react: "18.0.0",
        vite: "5.0.0",
      },
      devDependencies: {
        typescript: "5.0.0",
        vitest: "3.0.0",
      },
    }),
    "pnpm-lock.yaml": "",
    ...extra,
  };

  for (const [rel, content] of Object.entries(files)) {
    writeFileWithParents(join(dir, rel), content);
  }

  return dir;
}

function captureConsole() {
  const logs: string[] = [];
  const errors: string[] = [];
  vi.spyOn(console, "log").mockImplementation((...args) => {
    logs.push(args.map(String).join(" "));
  });
  vi.spyOn(console, "error").mockImplementation((...args) => {
    errors.push(args.map(String).join(" "));
  });
  return {
    output: () => logs.join("\n"),
    errors: () => errors.join("\n"),
  };
}

afterEach(() => {
  vi.restoreAllMocks();
  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

describe("prompt context integration", () => {
  it("renders compact prompt with relevant context references", async () => {
    const dir = makeProject("compact");
    await runInit({ cwd: dir, index: true });
    const { output } = captureConsole();

    const code = await runPrompt({
      cwd: dir,
      text: "kiểm tra doctor --json hoạt động đúng chưa",
      context: true,
      compact: true,
      contextLimit: 3,
    });

    expect(code).toBe(0);
    expect(output()).toContain("## Relevant Context");
    expect(output()).toContain("COMMANDS.md#test");
    expect(output()).toContain("## Verify");
  });

  it("prints prompt context in JSON output", async () => {
    const dir = makeProject("json");
    await runInit({ cwd: dir, index: true });
    const { output } = captureConsole();

    const code = await runPrompt({
      cwd: dir,
      text: "show stack dependencies",
      context: true,
      compact: true,
      json: true,
      contextLimit: 2,
    });
    const parsed = JSON.parse(output()) as PromptJsonOutput;

    expect(code).toBe(0);
    expect(parsed.style).toBe("compact");
    expect(parsed.relevantContext.length).toBeGreaterThan(0);
    expect(
      parsed.relevantContext.some((item) => item.file === "PROJECT_CONTEXT.md"),
    ).toBe(true);
  });

  it("uses prompt context and compact style from config", async () => {
    const dir = makeProject("config", {
      [CONFIG_FILE]: JSON.stringify({
        prompt: {
          context: true,
          style: "compact",
          contextLimit: 2,
        },
      }),
    });
    await runInit({ cwd: dir, index: true });
    const { output } = captureConsole();

    const code = await runPrompt({
      cwd: dir,
      text: "kiểm tra build test",
    });

    expect(code).toBe(0);
    expect(output()).toContain("## Relevant Context");
    expect(output()).toContain("COMMANDS.md#test");
  });
});
