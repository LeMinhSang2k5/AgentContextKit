import { pickCommonScripts, runScriptCommand } from "../detectors/scripts.js";
import type { ProjectContext } from "../types.js";

export function formatTestingExpectations(ctx: ProjectContext): string {
  const testScript = pickCommonScripts(ctx.scripts).test;

  if (testScript) {
    return `- Run tests with the project's \`test\` script before finishing substantive changes.
- Test script in package.json: \`${testScript.command}\``;
  }

  const buildScript = pickCommonScripts(ctx.scripts).build;
  if (buildScript) {
    const buildCmd = runScriptCommand(
      ctx.packageManager,
      buildScript.scriptName,
    );
    return `- No \`test\` script detected. Use \`${buildCmd}\` as the baseline verification command unless the user provides another check.`;
  }

  return "- No `test` script detected. Ask the user how to verify changes.";
}
