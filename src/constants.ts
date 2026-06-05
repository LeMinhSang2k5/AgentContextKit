/** Directories that must never be scanned or traversed. */
export const IGNORED_SCAN_DIRS = new Set([
  "node_modules",
  ".git",
  ".ready-for-agents",
  "dist",
  "build",
  ".next",
  "coverage",
]);
