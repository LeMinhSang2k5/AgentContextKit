import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, describe, expect, it, vi } from "vitest";
import { runRunbook } from "../src/commands/runbook.js";
import { extractEnvNamesFromSource } from "../src/detectors/environment.js";

const tempDirs: string[] = [];

function writeFileWithParents(filePath: string, content: string): void {
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, content);
}

function makeProject(name: string, extra: Record<string, string> = {}): string {
  const dir = mkdtempSync(join(tmpdir(), `ack-runbook-${name}-`));
  tempDirs.push(dir);

  const files = {
    "package.json": JSON.stringify({
      name: "runbook-app",
      scripts: {
        dev: "concurrently \"npm run dev:client\" \"npm run dev:server\"",
        "dev:client": "vite",
        "dev:server": "nodemon server.js",
        build: "vite build",
      },
      dependencies: {
        express: "5.0.0",
        mongoose: "8.0.0",
        react: "18.0.0",
        vite: "5.0.0",
      },
    }),
    "package-lock.json": "",
    "src/server.ts": `
      const uri = process.env.MONGODB_URI;
      const secret = process.env["JWT_SECRET"];
      const publicUrl = import.meta.env.VITE_API_URL;
    `,
    ".env": "JWT_SECRET=real-production-secret\nMONGODB_URI=mongodb://secret\n",
    ".env.example": "PORT=3000\nMONGODB_URI=mongodb://example\n",
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

describe("environment detection", () => {
  it("extracts env names from common source patterns", () => {
    expect(
      extractEnvNamesFromSource(`
        process.env.API_TOKEN;
        process.env["DATABASE_URL"];
        import.meta.env.VITE_API_URL;
        Deno.env.get("DENO_TOKEN");
      `),
    ).toEqual(["API_TOKEN", "DATABASE_URL", "VITE_API_URL", "DENO_TOKEN"]);
  });
});

describe("runRunbook", () => {
  it("previews RUNBOOK.md without reading or printing .env values", async () => {
    const dir = makeProject("dry");
    const { output } = captureConsole();

    const code = await runRunbook({ cwd: dir, dryRun: true });

    expect(code).toBe(0);
    expect(existsSync(join(dir, "RUNBOOK.md"))).toBe(false);
    expect(output()).toContain("rfa runbook");
    expect(output()).toContain("RUNBOOK.md");
    expect(output()).toContain("Privacy: .env values are not read or written.");
    expect(output()).toContain("Sensitive env files detected but not read");
    expect(output()).toContain("`JWT_SECRET`");
    expect(output()).toContain("`MONGODB_URI`");
    expect(output()).toContain("`PORT`");
    expect(output()).toContain("`VITE_API_URL`");
    expect(output()).not.toContain("real-production-secret");
    expect(output()).not.toContain("mongodb://secret");
    expect(output()).not.toContain("mongodb://example");
  });

  it("writes RUNBOOK.md safely and preserves existing files unless forced", async () => {
    const dir = makeProject("write");
    const target = join(dir, "RUNBOOK.md");

    expect(await runRunbook({ cwd: dir })).toBe(0);
    const generated = readFileSync(target, "utf-8");
    expect(generated).toContain("# RUNBOOK.md");
    expect(generated).not.toMatch(/\n{3,}/);
    expect(generated).toContain(
      '<!-- ready-for-agents:generated file="RUNBOOK.md"',
    );

    writeFileWithParents(target, "KEEP\n");
    expect(await runRunbook({ cwd: dir })).toBe(0);
    expect(readFileSync(target, "utf-8")).toBe("KEEP\n");

    expect(await runRunbook({ cwd: dir, force: true })).toBe(0);
    expect(readFileSync(target, "utf-8")).toContain("Operational runbook");
  });
});
