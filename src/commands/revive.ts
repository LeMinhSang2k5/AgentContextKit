import pc from "picocolors";
import { readReadyForAgentsConfig } from "../config/read.js";
import { detectEnvironmentUsage } from "../detectors/environment.js";
import { detectLocalServices } from "../detectors/services.js";
import { pickCommonScripts, runScriptCommand } from "../detectors/scripts.js";
import {
  readProject,
  resolveProjectCwd,
  validateInitTarget,
} from "../fs/read-project.js";
import { planWriteActions, writeGeneratedFiles } from "../fs/write-files.js";
import {
  generateDockerComposeFile,
  generateRunbookFile,
} from "../generators/index.js";
import {
  buildContextTree,
  resolveIndexOutput,
  writeContextTree,
} from "../indexer/context-tree.js";
import type {
  GeneratedFileMap,
  OutputFile,
  PackageManager,
  ProjectContext,
} from "../types.js";
import {
  formatCreatedLines,
  formatDryRunNotice,
  formatDryRunSeparator,
  formatOverwrittenLines,
  formatSkippedLines,
  formatWouldCreateLines,
  formatWouldOverwriteLines,
} from "./output.js";

export type ReviveOptions = {
  cwd?: string;
  dryRun?: boolean;
  force?: boolean;
  docker?: boolean;
  index?: boolean;
};

export async function runRevive(options: ReviveOptions): Promise<number> {
  const validationError = validateInitTarget(options.cwd);
  if (validationError) {
    console.error(pc.red(validationError));
    return 1;
  }

  const cwd = resolveProjectCwd(options.cwd);
  const configResult = readReadyForAgentsConfig(cwd);
  if (!configResult.ok) {
    console.error(pc.red(configResult.error));
    return 1;
  }

  const ctx = readProject(cwd);
  const env = detectEnvironmentUsage(cwd);
  const servicePlan = detectLocalServices(ctx);
  const includeDocker = options.docker !== false;
  const includeIndex = options.index !== false;
  const files: GeneratedFileMap = {
    ...generateRunbookFile(ctx, env),
    ...(includeDocker ? generateDockerComposeFile(ctx, servicePlan) : {}),
  };
  const force = options.force ?? false;
  const indexOutput = resolveIndexOutput(cwd, configResult.config.index.output);

  console.log(pc.bold("rfa revive"));
  console.log();
  console.log(pc.dim("Privacy: .env values are not read or written."));
  console.log(
    pc.dim(
      "Scope: prepares local revival files; it does not run Docker, install dependencies, or execute scripts.",
    ),
  );
  console.log();
  printRevivalSummary(ctx, servicePlan, includeDocker, includeIndex);

  if (options.dryRun) {
    printDryRunPreview(cwd, files, force);
    if (includeIndex) {
      console.log(pc.cyan("Would generate:"));
      console.log(`- ${configResult.config.index.output}`);
      console.log();
    }
    printNextSteps(ctx, includeDocker && servicePlan.services.length > 0);
    console.log();
    console.log(pc.dim(formatDryRunSeparator()));
    console.log(pc.yellow(formatDryRunNotice()));
    return 0;
  }

  const result = writeGeneratedFiles(cwd, files, { force });
  printResultLines(result.created, formatCreatedLines, pc.green);
  printResultLines(result.overwritten, formatOverwrittenLines, pc.magenta);
  printResultLines(result.skipped, formatSkippedLines, pc.yellow);

  if (includeIndex) {
    writeContextTree(indexOutput, buildContextTree(ctx));
    console.log(pc.green("Generated:"));
    console.log(`- ${configResult.config.index.output}`);
    console.log();
  }

  printNextSteps(ctx, includeDocker && servicePlan.services.length > 0);
  return 0;
}

function printRevivalSummary(
  ctx: ProjectContext,
  servicePlan: ReturnType<typeof detectLocalServices>,
  includeDocker: boolean,
  includeIndex: boolean,
): void {
  console.log("Revival automation:");
  console.log("- RUNBOOK.md");
  if (includeDocker && servicePlan.services.length > 0) {
    console.log("- docker-compose.yml");
  } else if (includeDocker) {
    console.log(
      "- docker-compose.yml skipped: no supported local service detected",
    );
  } else {
    console.log("- docker-compose.yml skipped by --no-docker");
  }
  if (includeIndex) {
    console.log("- .ready-for-agents/context-tree.json");
  } else {
    console.log("- context tree skipped by --no-index");
  }
  console.log();

  if (servicePlan.services.length > 0) {
    console.log("Detected local services:");
    for (const service of servicePlan.services) {
      console.log(`- ${service.label}: ${service.image} on ${service.port}`);
    }
    console.log();
  }

  if (servicePlan.notes.length > 0) {
    console.log("Notes:");
    for (const note of servicePlan.notes) {
      console.log(`- ${note}`);
    }
    console.log();
  }

  if (Object.keys(ctx.scripts).length === 0) {
    console.log(
      pc.yellow(
        "No package.json scripts detected; RUNBOOK.md will require manual startup notes.",
      ),
    );
    console.log();
  }
}

function printDryRunPreview(
  cwd: string,
  files: GeneratedFileMap,
  force: boolean,
): void {
  const { wouldCreate, wouldOverwrite, wouldSkip } = planWriteActions(
    cwd,
    force,
    files,
  );

  printResultLines(wouldCreate, formatWouldCreateLines, pc.cyan);
  if (wouldCreate.length > 0) console.log();

  printResultLines(wouldOverwrite, formatWouldOverwriteLines, pc.magenta);
  if (wouldOverwrite.length > 0) console.log();

  printResultLines(wouldSkip, formatSkippedLines, pc.yellow);
  if (wouldSkip.length > 0) console.log();

  for (const [name, content] of Object.entries(files) as [
    OutputFile,
    string,
  ][]) {
    console.log(
      pc.dim(`── ${name} ${"─".repeat(Math.max(0, 44 - name.length))}`),
    );
    console.log(content.trimEnd());
  }
}

function printNextSteps(ctx: ProjectContext, hasDockerServices: boolean): void {
  const common = pickCommonScripts(ctx.scripts);
  const steps = [
    ...(hasDockerServices ? ["docker compose up -d"] : []),
    installCommand(ctx.packageManager),
  ];

  if (common.dev) {
    steps.push(runScriptCommand(ctx.packageManager, common.dev.scriptName));
  }
  if (common.test) {
    steps.push(runScriptCommand(ctx.packageManager, common.test.scriptName));
  } else if (common.build) {
    steps.push(runScriptCommand(ctx.packageManager, common.build.scriptName));
  }

  console.log(pc.bold("Next steps:"));
  for (const step of steps) {
    console.log(`- ${step}`);
  }
  console.log(
    "- Open RUNBOOK.md for environment names, runtime notes, and fallback checks.",
  );
}

function installCommand(packageManager: PackageManager): string {
  switch (packageManager) {
    case "pnpm":
      return "pnpm install";
    case "yarn":
      return "yarn install";
    case "bun":
      return "bun install";
    case "npm":
    default:
      return "npm install";
  }
}

function printResultLines(
  files: OutputFile[],
  formatter: (files: OutputFile[]) => string[],
  color: (text: string) => string,
): void {
  for (const line of formatter(files)) {
    console.log(color(line));
  }
}
