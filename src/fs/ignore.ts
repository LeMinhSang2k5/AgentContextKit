import { IGNORED_SCAN_DIRS } from "../constants.js";

export function isIgnoredDirectory(name: string): boolean {
  return IGNORED_SCAN_DIRS.has(name);
}
