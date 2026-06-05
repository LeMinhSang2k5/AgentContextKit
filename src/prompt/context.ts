import { readReadyForAgentsConfig } from "../config/read.js";
import { resolveIndexOutput } from "../indexer/context-tree.js";
import { resolveProjectCwd, validateInitTarget } from "../fs/read-project.js";
import { loadContextTree } from "../query/load.js";
import { selectContextSections, type QueryMatch } from "../query/select.js";
import type { PromptContextReference } from "./types.js";

export type PromptContextLookupResult =
  | {
      ok: true;
      cwd: string;
      source: "cache" | "live";
      treePath: string;
      references: PromptContextReference[];
    }
  | {
      ok: false;
      cwd: string;
      error: string;
    };

export function lookupPromptContext(
  cwdInput: string | undefined,
  query: string,
  limit: number,
): PromptContextLookupResult {
  const cwd = resolveProjectCwd(cwdInput);
  const validationError = validateInitTarget(cwd);
  if (validationError) {
    return { ok: false, cwd, error: validationError };
  }

  const configResult = readReadyForAgentsConfig(cwd);
  if (!configResult.ok) {
    return { ok: false, cwd, error: configResult.error };
  }

  const treePath = resolveIndexOutput(cwd, configResult.config.index.output);
  const loadResult = loadContextTree(cwd, treePath);
  if (!loadResult.ok) {
    return { ok: false, cwd, error: loadResult.error };
  }

  return {
    ok: true,
    cwd,
    source: loadResult.source,
    treePath,
    references: selectContextSections(loadResult.tree, query, {
      limit,
    }).map(toPromptContextReference),
  };
}

function toPromptContextReference(match: QueryMatch): PromptContextReference {
  return {
    file: match.file,
    heading: match.heading,
    anchor: match.anchor,
    lineStart: match.lineStart,
    lineEnd: match.lineEnd,
    summary: match.summary,
    tokensEstimate: match.tokensEstimate,
    commands: match.commands,
    reasons: match.reasons,
  };
}
