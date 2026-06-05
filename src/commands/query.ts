import pc from "picocolors";
import { readReadyForAgentsConfig } from "../config/read.js";
import { resolveIndexOutput } from "../indexer/context-tree.js";
import { resolveProjectCwd, validateInitTarget } from "../fs/read-project.js";
import { selectContextSections, type QueryMatch } from "../query/select.js";
import type { ContextTree } from "../indexer/context-tree.js";
import { loadContextTree } from "../query/load.js";

export type QueryOptions = {
  cwd?: string;
  json?: boolean;
  limit?: number | string;
  tree?: string;
  text?: string;
};

export type QueryJsonOutput =
  | {
      ok: true;
      cwd: string;
      query: string;
      source: "cache" | "live";
      treePath: string;
      summary: ContextTree["summary"];
      matches: QueryMatch[];
    }
  | {
      ok: false;
      cwd: string;
      query: string;
      error: string;
      matches: [];
    };

export async function runQuery(options: QueryOptions): Promise<number> {
  const query = normalizeQuery(options.text);
  const cwd = resolveProjectCwd(options.cwd);

  if (!query) {
    return failQuery(options, cwd, "", "Query text is required.");
  }

  const validationError = validateInitTarget(options.cwd);
  if (validationError) {
    return failQuery(options, cwd, query, validationError);
  }

  const configResult = readReadyForAgentsConfig(cwd);
  if (!configResult.ok) {
    return failQuery(options, cwd, query, configResult.error);
  }

  const treePath = resolveIndexOutput(
    cwd,
    options.tree ?? configResult.config.index.output,
  );
  const loadResult = loadContextTree(cwd, treePath);
  if (!loadResult.ok) {
    return failQuery(options, cwd, query, loadResult.error);
  }

  const matches = selectContextSections(loadResult.tree, query, {
    limit: parseLimit(options.limit),
  });
  const output: QueryJsonOutput = {
    ok: true,
    cwd,
    query,
    source: loadResult.source,
    treePath,
    summary: loadResult.tree.summary,
    matches,
  };

  if (options.json) {
    console.log(JSON.stringify(output, null, 2));
  } else {
    printQueryOutput(output);
  }

  return 0;
}

function printQueryOutput(
  output: Extract<QueryJsonOutput, { ok: true }>,
): void {
  console.log(pc.bold("rfa query"));
  console.log();
  console.log(`Task: ${output.query}`);
  console.log(
    `Source: ${
      output.source === "cache" ? `cache (${output.treePath})` : "live scan"
    }`,
  );
  console.log(
    `Indexed: ${output.summary.filesIndexed} files, ${output.summary.sectionsIndexed} sections, ~${output.summary.tokensEstimate} tokens`,
  );
  console.log();

  if (output.matches.length === 0) {
    console.log("No generated context sections found.");
    console.log(
      "Run `rfa init --index` first, or create AGENTS.md / PROJECT_CONTEXT.md / COMMANDS.md.",
    );
    return;
  }

  console.log("Relevant context:");
  for (const match of output.matches) {
    console.log(
      `- ${formatMatchRef(match)} — score ${match.score}, ~${match.tokensEstimate} tokens`,
    );
    if (match.summary) {
      console.log(`  Summary: ${match.summary}`);
    }
    if (match.reasons.length > 0) {
      console.log(`  Reason: ${match.reasons.join(", ")}`);
    }
    if (match.commands.length > 0) {
      console.log(
        `  Commands: ${match.commands.map((cmd) => `\`${cmd}\``).join(", ")}`,
      );
    }
  }
  console.log();
  console.log("Suggested use:");
  console.log("1. Read the listed sections first.");
  console.log("2. Open the full file only if those sections are not enough.");
  console.log("3. Re-run `rfa index` after context files change.");
}

function formatMatchRef(match: QueryMatch): string {
  return `${match.file}${match.anchor} (lines ${match.lineStart}-${match.lineEnd})`;
}

function failQuery(
  options: QueryOptions,
  cwd: string,
  query: string,
  error: string,
): number {
  if (options.json) {
    const output: QueryJsonOutput = {
      ok: false,
      cwd,
      query,
      error,
      matches: [],
    };
    console.log(JSON.stringify(output, null, 2));
  } else {
    console.error(pc.red(error));
  }
  return 1;
}

function normalizeQuery(text: string | undefined): string {
  return (text ?? "").trim().replace(/\s+/gu, " ");
}

function parseLimit(value: number | string | undefined): number | undefined {
  if (value === undefined) return undefined;
  if (typeof value === "number") return value;
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? undefined : parsed;
}
