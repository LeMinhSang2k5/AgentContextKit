import type { PackageManager, ScriptKey } from "../types.js";
import { SCRIPT_KEYS } from "../types.js";

const SCRIPT_ALIASES: Record<ScriptKey, string[]> = {
  dev: ["dev", "start:dev", "develop"],
  build: ["build"],
  test: ["test", "test:unit", "test:run"],
  lint: ["lint", "eslint"],
  typecheck: ["typecheck", "type-check", "check:types"],
  format: ["format", "prettier", "fmt"],
};

const SCRIPT_REF_PATTERNS: RegExp[] = [
  /\bnpm run\s+([a-zA-Z0-9:_-]+)/g,
  /\bpnpm run\s+([a-zA-Z0-9:_-]+)/g,
  /\bbun run\s+([a-zA-Z0-9:_-]+)/g,
  /\byarn run\s+([a-zA-Z0-9:_-]+)/g,
];

const YARN_SCRIPT_PATTERN = /\byarn\s+([a-zA-Z0-9:_-]+)/g;

/** yarn subcommands that are NOT npm scripts */
const YARN_EXCLUDED = new Set([
  "add",
  "bin",
  "cache",
  "check",
  "config",
  "dedupe",
  "dlx",
  "global",
  "import",
  "info",
  "init",
  "install",
  "link",
  "node",
  "outdated",
  "plugin",
  "policies",
  "publish",
  "remove",
  "run",
  "set",
  "unlink",
  "up",
  "upgrade",
  "version",
  "why",
  "workspace",
  "workspaces",
]);

/** Maps common script keys to the actual script name in package.json. */
export function pickCommonScripts(
  packageScripts: Record<string, string> = {},
): Partial<Record<ScriptKey, { scriptName: string; command: string }>> {
  const result: Partial<
    Record<ScriptKey, { scriptName: string; command: string }>
  > = {};

  for (const key of SCRIPT_KEYS) {
    for (const alias of SCRIPT_ALIASES[key]) {
      const command = packageScripts[alias];
      if (command !== undefined) {
        result[key] = { scriptName: alias, command };
        break;
      }
    }
  }

  return result;
}

function collectFromPatterns(command: string, patterns: RegExp[]): string[] {
  const found = new Set<string>();
  for (const pattern of patterns) {
    const re = new RegExp(pattern.source, pattern.flags);
    for (const match of command.matchAll(re)) {
      const name = match[1];
      if (name) {
        found.add(name);
      }
    }
  }
  return [...found];
}

function collectYarnScriptRefs(command: string): string[] {
  const found = new Set<string>();
  const re = new RegExp(YARN_SCRIPT_PATTERN.source, YARN_SCRIPT_PATTERN.flags);
  for (const match of command.matchAll(re)) {
    const name = match[1];
    if (name && !YARN_EXCLUDED.has(name)) {
      found.add(name);
    }
  }
  return [...found];
}

/** Script names referenced inside a script command (e.g. dev:client inside dev). */
export function parseScriptRefsFromCommand(command: string): string[] {
  const found = new Set<string>([
    ...collectFromPatterns(command, SCRIPT_REF_PATTERNS),
    ...collectYarnScriptRefs(command),
  ]);
  return [...found];
}

/** Related scripts such as dev:client, dev:server for the dev workflow. */
export function findRelatedScripts(
  packageScripts: Record<string, string>,
  baseKey: ScriptKey,
): string[] {
  const prefix = `${baseKey}:`;
  const fromPrefix = Object.keys(packageScripts)
    .filter((name) => name.startsWith(prefix))
    .sort();

  const primary = pickCommonScripts(packageScripts)[baseKey];
  const fromCommand = primary
    ? parseScriptRefsFromCommand(primary.command)
    : [];

  const related = new Set<string>([...fromPrefix, ...fromCommand]);
  if (primary) {
    related.delete(primary.scriptName);
  }

  return [...related].sort();
}

/** dev → dev:* → build, test, lint, … → remaining (alphabetical). */
export function sortScriptNamesForDisplay(
  packageScripts: Record<string, string>,
  names: Iterable<string>,
): string[] {
  const remaining = new Set(names);
  const ordered: string[] = [];
  const common = pickCommonScripts(packageScripts);

  const add = (name: string) => {
    if (remaining.delete(name)) {
      ordered.push(name);
    }
  };

  if (common.dev) {
    add(common.dev.scriptName);
  } else {
    add("dev");
  }

  [...remaining]
    .filter((name) => name.startsWith("dev:"))
    .sort()
    .forEach((name) => add(name));

  for (const key of SCRIPT_KEYS) {
    if (key === "dev") {
      continue;
    }
    const entry = common[key];
    if (entry) {
      add(entry.scriptName);
    }
  }

  [...remaining].sort().forEach((name) => add(name));

  return ordered;
}

export function formatScriptListForTerminal(
  packageScripts: Record<string, string>,
): string {
  const names = new Set<string>();
  const common = pickCommonScripts(packageScripts);

  for (const key of SCRIPT_KEYS) {
    const entry = common[key];
    if (entry) {
      names.add(entry.scriptName);
      if (key === "dev") {
        for (const related of findRelatedScripts(packageScripts, "dev")) {
          names.add(related);
        }
      }
    }
  }

  if (names.size === 0) {
    return "Not detected";
  }
  return sortScriptNamesForDisplay(packageScripts, names).join(", ");
}

export function runScriptCommand(
  packageManager: PackageManager,
  scriptName: string,
): string {
  switch (packageManager) {
    case "pnpm":
      return `pnpm ${scriptName}`;
    case "yarn":
      return `yarn ${scriptName}`;
    case "bun":
      return `bun run ${scriptName}`;
    case "npm":
    default:
      return `npm run ${scriptName}`;
  }
}

export function relatedScriptsSection(
  packageManager: PackageManager,
  scriptNames: string[],
): string {
  if (scriptNames.length === 0) {
    return "";
  }

  const commands = scriptNames
    .map((name) => runScriptCommand(packageManager, name))
    .join("\n");

  return `\n## Related Development Scripts

\`\`\`bash
${commands}
\`\`\``;
}
