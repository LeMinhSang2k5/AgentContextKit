import pc from "picocolors";
import {
  buildContextTree,
  resolveIndexOutput,
  writeContextTree,
} from "../indexer/context-tree.js";
import {
  readProject,
  resolveProjectCwd,
  validateInitTarget,
} from "../fs/read-project.js";
import { readReadyForAgentsConfig } from "../config/read.js";
import type { ContextTree } from "../indexer/context-tree.js";

export type IndexOptions = {
  cwd?: string;
  dryRun?: boolean;
  json?: boolean;
  output?: string;
};

export async function runIndex(options: IndexOptions): Promise<number> {
  const validationError = validateInitTarget(options.cwd);
  if (validationError) {
    if (options.json) {
      console.log(
        JSON.stringify({
          ok: false,
          error: validationError,
          tree: null,
        }),
      );
    } else {
      console.error(pc.red(validationError));
    }
    return 1;
  }

  const cwd = resolveProjectCwd(options.cwd);
  const configResult = readReadyForAgentsConfig(cwd);
  if (!configResult.ok) {
    if (options.json) {
      console.log(
        JSON.stringify({
          ok: false,
          error: configResult.error,
          tree: null,
        }),
      );
    } else {
      console.error(pc.red(configResult.error));
    }
    return 1;
  }

  const ctx = readProject(cwd);
  const tree = buildContextTree(ctx);
  const output = resolveIndexOutput(
    cwd,
    options.output ?? configResult.config.index.output,
  );

  if (options.json) {
    console.log(JSON.stringify(formatIndexJson(output, tree), null, 2));
    return 0;
  }

  console.log(pc.bold("rfa index"));
  console.log();
  console.log(`Output: ${output}`);
  console.log(
    `Files indexed: ${tree.files.filter((file) => file.exists).length}`,
  );
  console.log(
    `Sections indexed: ${tree.files.reduce(
      (total, file) => total + file.sections.length,
      0,
    )}`,
  );
  console.log();

  if (options.dryRun) {
    console.log(pc.yellow("Dry run — no files written."));
    return 0;
  }

  writeContextTree(output, tree);
  console.log(pc.green("Generated:"));
  console.log(`- ${output}`);
  return 0;
}

function formatIndexJson(
  output: string,
  tree: ContextTree,
): {
  ok: true;
  output: string;
  tree: ContextTree;
} {
  return {
    ok: true,
    output,
    tree,
  };
}
