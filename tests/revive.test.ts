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
import { runDocker } from "../src/commands/docker.js";
import { runRevive } from "../src/commands/revive.js";
import { detectLocalServices } from "../src/detectors/services.js";
import { readProject } from "../src/fs/read-project.js";

const tempDirs: string[] = [];

function writeFileWithParents(filePath: string, content: string): void {
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, content);
}

function makeProject(name: string, extra: Record<string, string> = {}): string {
  const dir = mkdtempSync(join(tmpdir(), `ack-revive-${name}-`));
  tempDirs.push(dir);

  const files = {
    "package.json": JSON.stringify({
      name: "revive-app",
      scripts: {
        dev: "vite --host 0.0.0.0",
        build: "vite build",
        test: "vitest run",
      },
      dependencies: {
        express: "5.0.0",
        mongoose: "8.0.0",
        redis: "4.0.0",
        react: "18.0.0",
        vite: "5.0.0",
      },
    }),
    "pnpm-lock.yaml": "",
    "src/server.ts": `
      const mongo = process.env.MONGODB_URI;
      const secret = process.env.JWT_SECRET;
      const redis = process.env.REDIS_URL;
    `,
    ".env": "JWT_SECRET=real-secret\nMONGODB_URI=mongodb://production\n",
    ".env.example":
      "MONGODB_URI=mongodb://localhost:27017/revive\nREDIS_URL=redis://localhost:6379\n",
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

describe("local service detection", () => {
  it("detects supported local services conservatively", () => {
    const dir = makeProject("services");
    const plan = detectLocalServices(readProject(dir));

    expect(plan.services.map((service) => service.id)).toEqual([
      "mongodb",
      "redis",
    ]);
    expect(plan.notes).toEqual([]);
  });

  it("uses Prisma datasource provider when available", () => {
    const dir = makeProject("prisma", {
      "package.json": JSON.stringify({
        name: "prisma-app",
        dependencies: {
          "@prisma/client": "5.0.0",
          prisma: "5.0.0",
        },
      }),
      "prisma/schema.prisma":
        'datasource db { provider = "postgresql" url = env("DATABASE_URL") }',
    });
    const plan = detectLocalServices(readProject(dir));

    expect(plan.services.map((service) => service.id)).toEqual(["postgresql"]);
  });
});

describe("runDocker", () => {
  it("previews docker-compose.yml without writing or leaking .env values", async () => {
    const dir = makeProject("docker-dry");
    const { output } = captureConsole();

    const code = await runDocker({ cwd: dir, dryRun: true });

    expect(code).toBe(0);
    expect(existsSync(join(dir, "docker-compose.yml"))).toBe(false);
    expect(output()).toContain("rfa docker");
    expect(output()).toContain("mongo:7");
    expect(output()).toContain("redis:7-alpine");
    expect(output()).toContain(
      "MONGODB_URI=mongodb://localhost:27017/revive_app",
    );
    expect(output()).not.toContain("real-secret");
    expect(output()).not.toContain("mongodb://production");
  });

  it("writes docker-compose.yml safely and preserves existing files unless forced", async () => {
    const dir = makeProject("docker-write");
    const target = join(dir, "docker-compose.yml");

    expect(await runDocker({ cwd: dir })).toBe(0);
    const generated = readFileSync(target, "utf-8");
    expect(generated).toContain("services:");
    expect(generated).toContain("mongodb:");
    expect(generated).toContain(
      '# ready-for-agents:generated file="docker-compose.yml"',
    );

    writeFileWithParents(target, "KEEP\n");
    expect(await runDocker({ cwd: dir })).toBe(0);
    expect(readFileSync(target, "utf-8")).toBe("KEEP\n");

    expect(await runDocker({ cwd: dir, force: true })).toBe(0);
    expect(readFileSync(target, "utf-8")).toContain("redis:");
  });
});

describe("runRevive", () => {
  it("previews runbook, docker compose, and index without writing", async () => {
    const dir = makeProject("revive-dry");
    const { output } = captureConsole();

    const code = await runRevive({ cwd: dir, dryRun: true });

    expect(code).toBe(0);
    expect(existsSync(join(dir, "RUNBOOK.md"))).toBe(false);
    expect(existsSync(join(dir, "docker-compose.yml"))).toBe(false);
    expect(existsSync(join(dir, ".ready-for-agents/context-tree.json"))).toBe(
      false,
    );
    expect(output()).toContain("rfa revive");
    expect(output()).toContain("Would generate:");
    expect(output()).toContain("RUNBOOK.md");
    expect(output()).toContain("docker-compose.yml");
    expect(output()).toContain(".ready-for-agents/context-tree.json");
    expect(output()).toContain("docker compose up -d");
  });

  it("writes revival files and refreshes the context tree", async () => {
    const dir = makeProject("revive-write");

    expect(await runRevive({ cwd: dir })).toBe(0);

    const runbook = readFileSync(join(dir, "RUNBOOK.md"), "utf-8");
    const compose = readFileSync(join(dir, "docker-compose.yml"), "utf-8");
    const tree = JSON.parse(
      readFileSync(join(dir, ".ready-for-agents/context-tree.json"), "utf-8"),
    ) as {
      files: Array<{ path: string; kind: string; exists: boolean }>;
    };

    expect(runbook).toContain("Operational runbook");
    expect(compose).toContain("Local development services");
    expect(tree.files).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: "RUNBOOK.md",
          kind: "runbook",
          exists: true,
        }),
        expect.objectContaining({
          path: "docker-compose.yml",
          kind: "docker",
          exists: true,
        }),
      ]),
    );
  });

  it("can skip docker compose and context index", async () => {
    const dir = makeProject("revive-skip");

    expect(await runRevive({ cwd: dir, docker: false, index: false })).toBe(0);

    expect(existsSync(join(dir, "RUNBOOK.md"))).toBe(true);
    expect(existsSync(join(dir, "docker-compose.yml"))).toBe(false);
    expect(existsSync(join(dir, ".ready-for-agents/context-tree.json"))).toBe(
      false,
    );
  });
});
