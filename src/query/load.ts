import { existsSync, readFileSync } from "node:fs";
import { buildContextTree, type ContextTree } from "../indexer/context-tree.js";
import { readProject } from "../fs/read-project.js";

export type ContextTreeLoadResult =
  | { ok: true; source: "cache" | "live"; tree: ContextTree }
  | { ok: false; error: string };

export function loadContextTree(
  cwd: string,
  treePath: string,
): ContextTreeLoadResult {
  if (!existsSync(treePath)) {
    return {
      ok: true,
      source: "live",
      tree: buildContextTree(readProject(cwd)),
    };
  }

  try {
    const tree = JSON.parse(readFileSync(treePath, "utf-8")) as unknown;
    if (!isContextTree(tree)) {
      return {
        ok: false,
        error: "Invalid context tree. Re-run `rfa index`.",
      };
    }
    return { ok: true, source: "cache", tree };
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    return {
      ok: false,
      error: `Cannot read context tree: ${treePath}. ${detail}`,
    };
  }
}

function isContextTree(tree: unknown): tree is ContextTree {
  return (
    typeof tree === "object" &&
    tree !== null &&
    (tree as { tool?: unknown }).tool === "ready-for-agents" &&
    Array.isArray((tree as { files?: unknown }).files)
  );
}
