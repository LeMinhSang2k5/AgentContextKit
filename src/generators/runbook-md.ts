import {
  findRelatedScripts,
  pickCommonScripts,
  runScriptCommand,
} from "../detectors/scripts.js";
import {
  stackDatabaseSummary,
  stackFrameworkSummary,
} from "../detectors/stack.js";
import type { EnvironmentScanResult } from "../detectors/environment.js";
import type { PackageManager, ProjectContext, ScriptKey } from "../types.js";

export function generateRunbookMd(
  ctx: ProjectContext,
  env: EnvironmentScanResult,
): string {
  const body = `# RUNBOOK.md

Operational runbook for **${ctx.name}**. Use this when returning to the project after time away or when handing it to an AI coding agent.

## Project Summary

- Stack: **${stackFrameworkSummary(ctx.stack)}**
- Database: **${stackDatabaseSummary(ctx.stack) ?? "Not detected"}**
- Package manager: **${ctx.packageManager}**
- Important folders: ${formatInlineList(ctx.folders)}

## Privacy And Data Safety

- Secret values are not read from \`.env\`, \`.env.local\`, or other non-template \`.env*\` files.
- Environment values are not written to this file.
- Only variable names from safe templates and source references are listed.
- Treat every generated command as local development guidance. Verify before using it with production data.

${environmentSection(env)}
## Setup

${installBlock(ctx.packageManager)}

${scriptSection(ctx, "Development", "dev")}
${relatedDevSection(ctx)}
${scriptSection(ctx, "Build", "build")}
${scriptSection(ctx, "Test", "test")}
${scriptSection(ctx, "Lint", "lint")}
${scriptSection(ctx, "Typecheck", "typecheck")}
## Runtime Notes

${runtimeNotes(ctx)}
## Revival Checklist

1. Install dependencies.
2. Create local environment values from a safe template such as \`.env.example\`, if present.
3. Start required local services such as the database.
4. Run the development command.
5. Run the baseline verification command.
6. If startup fails, check environment variable names, ports, and database connectivity first.

## Agent Handoff

Before asking an AI agent to work on this project, prefer:

\`\`\`bash
rfa doctor --cwd .
rfa query "what should I know before changing this project?" --cwd .
\`\`\`
`;

  return `${body.trimEnd().replace(/\n{3,}/gu, "\n\n")}\n`;
}

function environmentSection(env: EnvironmentScanResult): string {
  const sections: string[] = ["## Environment\n"];

  if (env.safeTemplateFiles.length > 0) {
    sections.push(
      `Safe templates inspected for variable names: ${formatInlineList(
        env.safeTemplateFiles,
      )}.\n`,
    );
  } else {
    sections.push("No safe `.env.example`-style template was detected.\n");
  }

  if (env.sensitiveEnvFiles.length > 0) {
    sections.push(
      `Sensitive env files detected but not read: ${formatInlineList(
        env.sensitiveEnvFiles,
      )}.\n`,
    );
  }

  if (env.variables.length === 0) {
    sections.push(
      "No environment variable names were detected from safe sources.\n\n",
    );
    return sections.join("\n");
  }

  sections.push("| Variable | Sources | Notes |");
  sections.push("|---|---|---|");
  for (const variable of env.variables) {
    sections.push(
      `| \`${variable.name}\` | ${formatInlineList(variable.sources)} | ${
        variable.sensitive
          ? "Likely secret or connection value; value not read."
          : "Value not read."
      } |`,
    );
  }

  if (env.truncated) {
    sections.push(
      "\nSource scanning stopped early after the safety limit; inspect the project manually if more env variables may exist.",
    );
  }

  return `${sections.join("\n")}\n\n`;
}

function scriptSection(
  ctx: ProjectContext,
  title: string,
  key: ScriptKey,
): string {
  const entry = pickCommonScripts(ctx.scripts)[key];
  if (!entry) {
    return `## ${title}\n\nNot detected in \`package.json\`.\n\n`;
  }

  return `## ${title}

\`package.json\` script: \`${entry.command}\`

\`\`\`bash
${runScriptCommand(ctx.packageManager, entry.scriptName)}
\`\`\`

`;
}

function relatedDevSection(ctx: ProjectContext): string {
  const related = findRelatedScripts(ctx.scripts, "dev");
  if (related.length === 0) return "";

  const lines = related.map(
    (scriptName) => `- \`${runScriptCommand(ctx.packageManager, scriptName)}\``,
  );

  return `## Related Development Scripts

${lines.join("\n")}

`;
}

function runtimeNotes(ctx: ProjectContext): string {
  const notes: string[] = [];

  if (ctx.stack.frontend) {
    notes.push(`- Frontend detected: **${ctx.stack.frontend.label}**.`);
  }
  if (ctx.stack.backend) {
    notes.push(`- Backend detected: **${ctx.stack.backend.label}**.`);
  }
  if (ctx.stack.database) {
    notes.push(
      `- Database detected: **${ctx.stack.database.label}**. Start a local database before running backend code.`,
    );
  } else {
    notes.push("- No database dependency was detected.");
  }

  const dev = pickCommonScripts(ctx.scripts).dev;
  if (!dev && ctx.stack.backend) {
    notes.push(
      "- No main development script was detected; inspect backend entry points manually.",
    );
  }

  return `${notes.join("\n")}\n`;
}

function installBlock(pm: PackageManager): string {
  switch (pm) {
    case "pnpm":
      return "```bash\npnpm install\n```";
    case "yarn":
      return "```bash\nyarn install\n```";
    case "bun":
      return "```bash\nbun install\n```";
    case "npm":
    default:
      return "```bash\nnpm install\n```";
  }
}

function formatInlineList(items: string[]): string {
  if (items.length === 0) return "Not detected";
  return items.map((item) => `\`${item}\``).join(", ");
}
