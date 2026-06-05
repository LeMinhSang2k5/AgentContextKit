import { existsSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import pc from "picocolors";
import { validateCwd } from "../fs/validate.js";
import { CONFIG_FILE } from "../config/types.js";
import { stringifyDefaultConfig } from "../config/read.js";

export type ConfigInitOptions = {
  cwd?: string;
  dryRun?: boolean;
  force?: boolean;
};

export async function runConfigInit(
  options: ConfigInitOptions,
): Promise<number> {
  const cwd = resolve(options.cwd ?? process.cwd());
  const validationError = validateCwd(cwd);
  if (validationError) {
    console.error(pc.red(validationError));
    return 1;
  }

  const targetPath = join(cwd, CONFIG_FILE);
  const content = stringifyDefaultConfig();
  const existed = existsSync(targetPath);

  console.log(pc.bold("rfa config init"));
  console.log();

  if (existed && !options.force) {
    console.log(pc.yellow("Skipped:"));
    console.log(`- ${CONFIG_FILE} already exists. Use --force to overwrite.`);
    return 0;
  }

  if (options.dryRun) {
    console.log(existed ? "Would overwrite:" : "Would generate:");
    console.log(`- ${CONFIG_FILE}`);
    console.log();
    console.log(content.trimEnd());
    console.log();
    console.log(pc.yellow("Dry run — no files written."));
    return 0;
  }

  writeFileSync(targetPath, content, "utf-8");
  console.log(pc.green(existed ? "Overwritten:" : "Generated:"));
  console.log(`- ${CONFIG_FILE}`);
  return 0;
}
