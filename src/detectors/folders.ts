import { existsSync, statSync } from "node:fs";
import { join } from "node:path";
import { isIgnoredDirectory } from "../fs/ignore.js";
import { IMPORTANT_FOLDERS } from "../types.js";

export function detectImportantFolders(cwd: string): string[] {
  const found: string[] = [];

  for (const folder of IMPORTANT_FOLDERS) {
    if (isIgnoredDirectory(folder)) {
      continue;
    }

    const fullPath = join(cwd, folder);
    if (!existsSync(fullPath)) {
      continue;
    }

    try {
      if (statSync(fullPath).isDirectory()) {
        found.push(folder);
      }
    } catch {
      // ignore unreadable paths
    }
  }

  return found;
}
