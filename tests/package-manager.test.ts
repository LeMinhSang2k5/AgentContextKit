import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, describe, expect, it } from "vitest";
import {
  parsePackageManagerField,
  resolvePackageManager,
} from "../src/detectors/package-manager.js";

const tempDirs: string[] = [];

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

describe("parsePackageManagerField", () => {
  it("parses pnpm@9.0.0", () => {
    expect(parsePackageManagerField("pnpm@9.0.0")).toBe("pnpm");
  });

  it("returns undefined for invalid value", () => {
    expect(parsePackageManagerField("invalid")).toBeUndefined();
  });
});

describe("resolvePackageManager", () => {
  it("prefers lockfile over packageManager field", () => {
    const dir = mkdtempSync(join(tmpdir(), "ack-pm-"));
    tempDirs.push(dir);
    writeFileSync(join(dir, "pnpm-lock.yaml"), "");
    writeFileSync(
      join(dir, "package.json"),
      JSON.stringify({ packageManager: "npm@10.0.0" }),
    );
    expect(resolvePackageManager(dir, "npm@10.0.0")).toEqual({
      manager: "pnpm",
      source: "lockfile",
    });
  });

  it("uses packageManager field when no lockfile", () => {
    const dir = mkdtempSync(join(tmpdir(), "ack-pm2-"));
    tempDirs.push(dir);
    mkdirSync(dir, { recursive: true });
    expect(resolvePackageManager(dir, "pnpm@9.0.0")).toEqual({
      manager: "pnpm",
      source: "package.json",
    });
  });

  it("falls back to npm", () => {
    const dir = mkdtempSync(join(tmpdir(), "ack-pm3-"));
    tempDirs.push(dir);
    expect(resolvePackageManager(dir, undefined)).toEqual({
      manager: "npm",
      source: "fallback",
    });
  });
});
