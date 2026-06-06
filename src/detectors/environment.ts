import {
  type Dirent,
  existsSync,
  readdirSync,
  readFileSync,
  statSync,
} from "node:fs";
import { basename, join, relative, sep } from "node:path";
import { isIgnoredDirectory } from "../fs/ignore.js";

export type EnvVariableInfo = {
  name: string;
  sources: string[];
  sensitive: boolean;
};

export type EnvironmentScanResult = {
  variables: EnvVariableInfo[];
  safeTemplateFiles: string[];
  sensitiveEnvFiles: string[];
  scannedSourceFiles: number;
  truncated: boolean;
};

const SOURCE_ROOTS = [
  "src",
  "app",
  "pages",
  "server",
  "backend",
  "api",
  "lib",
  "config",
  "prisma",
];

const ROOT_SOURCE_FILES = [
  "server.js",
  "server.ts",
  "app.js",
  "app.ts",
  "index.js",
  "index.ts",
  "vite.config.js",
  "vite.config.ts",
  "next.config.js",
  "next.config.mjs",
  "next.config.ts",
];

const SOURCE_EXTENSIONS = new Set([
  ".js",
  ".jsx",
  ".ts",
  ".tsx",
  ".mjs",
  ".cjs",
  ".mts",
  ".cts",
]);

const MAX_SOURCE_FILES = 250;
const MAX_FILE_BYTES = 250_000;

export function detectEnvironmentUsage(cwd: string): EnvironmentScanResult {
  const variables = new Map<string, EnvVariableInfo>();
  const safeTemplateFiles: string[] = [];
  const sensitiveEnvFiles: string[] = [];
  let scannedSourceFiles = 0;
  let truncated = false;

  for (const entry of safeReadDir(cwd)) {
    if (!entry.isFile()) continue;
    const name = entry.name;
    if (!name.startsWith(".env")) continue;

    if (isSafeEnvTemplate(name)) {
      safeTemplateFiles.push(name);
      for (const envName of extractEnvNamesFromTemplate(join(cwd, name))) {
        addVariable(variables, envName, name);
      }
    } else {
      sensitiveEnvFiles.push(name);
    }
  }

  const candidates = collectSourceFiles(cwd);
  for (const file of candidates) {
    if (scannedSourceFiles >= MAX_SOURCE_FILES) {
      truncated = true;
      break;
    }

    if (fileSize(file) > MAX_FILE_BYTES) continue;
    const rel = normalizePath(relative(cwd, file));
    const content = safeReadFile(file);
    if (content === null) continue;

    scannedSourceFiles += 1;
    for (const envName of extractEnvNamesFromSource(content)) {
      addVariable(variables, envName, rel);
    }
  }

  return {
    variables: [...variables.values()].sort((a, b) =>
      a.name.localeCompare(b.name),
    ),
    safeTemplateFiles: safeTemplateFiles.sort(),
    sensitiveEnvFiles: sensitiveEnvFiles.sort(),
    scannedSourceFiles,
    truncated,
  };
}

function collectSourceFiles(cwd: string): string[] {
  const files: string[] = [];

  for (const name of ROOT_SOURCE_FILES) {
    const path = join(cwd, name);
    if (existsSync(path)) files.push(path);
  }

  for (const root of SOURCE_ROOTS) {
    const path = join(cwd, root);
    if (!existsSync(path)) continue;
    collectSourceFilesInDirectory(path, files);
  }

  return [...new Set(files)].sort();
}

function collectSourceFilesInDirectory(dir: string, files: string[]): void {
  for (const entry of safeReadDir(dir)) {
    if (entry.isDirectory()) {
      if (isIgnoredDirectory(entry.name)) continue;
      collectSourceFilesInDirectory(join(dir, entry.name), files);
      continue;
    }

    if (!entry.isFile()) continue;
    if (entry.name.startsWith(".env")) continue;
    if (SOURCE_EXTENSIONS.has(fileExtension(entry.name))) {
      files.push(join(dir, entry.name));
    }
  }
}

function extractEnvNamesFromTemplate(path: string): string[] {
  const content = safeReadFile(path);
  if (content === null) return [];

  const names = new Set<string>();
  for (const line of content.split(/\r?\n/u)) {
    const match = /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=/u.exec(
      line,
    );
    if (match) names.add(match[1]!);
  }
  return [...names];
}

export function extractEnvNamesFromSource(content: string): string[] {
  const names = new Set<string>();
  const patterns = [
    /\bprocess\.env\.([A-Za-z_][A-Za-z0-9_]*)\b/gu,
    /\bprocess\.env\[['"]([A-Za-z_][A-Za-z0-9_]*)['"]\]/gu,
    /\bimport\.meta\.env\.([A-Za-z_][A-Za-z0-9_]*)\b/gu,
    /\bDeno\.env\.get\(['"]([A-Za-z_][A-Za-z0-9_]*)['"]\)/gu,
  ];

  for (const pattern of patterns) {
    for (const match of content.matchAll(pattern)) {
      names.add(match[1]!);
    }
  }

  return [...names];
}

function addVariable(
  variables: Map<string, EnvVariableInfo>,
  name: string,
  source: string,
): void {
  const current = variables.get(name);
  if (current) {
    if (!current.sources.includes(source)) current.sources.push(source);
    current.sources.sort();
    return;
  }

  variables.set(name, {
    name,
    sources: [source],
    sensitive: isSensitiveEnvName(name),
  });
}

function isSafeEnvTemplate(name: string): boolean {
  const lower = name.toLowerCase();
  return (
    lower.startsWith(".env") &&
    /\b(example|sample|template|default|defaults|dist)\b/u.test(lower)
  );
}

function isSensitiveEnvName(name: string): boolean {
  return /(secret|token|password|passwd|pwd|private|credential|auth|api_?key|access_?key|database_url|mongo.*uri|redis.*url|dsn|uri)$/iu.test(
    name,
  );
}

function fileExtension(name: string): string {
  const base = basename(name);
  const index = base.lastIndexOf(".");
  return index >= 0 ? base.slice(index) : "";
}

function fileSize(path: string): number {
  try {
    return statSync(path).size;
  } catch {
    return Number.POSITIVE_INFINITY;
  }
}

function safeReadDir(path: string): Dirent[] {
  try {
    return readdirSync(path, { withFileTypes: true });
  } catch {
    return [];
  }
}

function safeReadFile(path: string): string | null {
  try {
    return readFileSync(path, "utf-8");
  } catch {
    return null;
  }
}

function normalizePath(path: string): string {
  return sep === "/" ? path : path.split(sep).join("/");
}
