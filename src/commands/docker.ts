import pc from "picocolors";
import {
  readProject,
  resolveProjectCwd,
  validateInitTarget,
} from "../fs/read-project.js";
import { planWriteActions, writeGeneratedFiles } from "../fs/write-files.js";
import { detectLocalServices } from "../detectors/services.js";
import { generateDockerComposeFile } from "../generators/index.js";
import type { GeneratedFileMap, OutputFile } from "../types.js";
import {
  formatCreatedLines,
  formatDryRunNotice,
  formatDryRunSeparator,
  formatOverwrittenLines,
  formatSkippedLines,
  formatWouldCreateLines,
  formatWouldOverwriteLines,
} from "./output.js";

export type DockerOptions = {
  cwd?: string;
  dryRun?: boolean;
  force?: boolean;
};

export async function runDocker(options: DockerOptions): Promise<number> {
  const validationError = validateInitTarget(options.cwd);
  if (validationError) {
    console.error(pc.red(validationError));
    return 1;
  }

  const cwd = resolveProjectCwd(options.cwd);
  const ctx = readProject(cwd);
  const plan = detectLocalServices(ctx);
  const files = generateDockerComposeFile(ctx, plan);
  const force = options.force ?? false;

  console.log(pc.bold("rfa docker"));
  console.log();
  console.log(pc.dim("Privacy: .env values are not read or written."));
  console.log(
    pc.dim("Scope: generated compose services are for local development only."),
  );
  console.log();
  printServicePlan(plan);

  if (plan.services.length === 0) {
    console.log(
      pc.yellow(
        "No supported local service detected. No docker-compose.yml generated.",
      ),
    );
    if (options.dryRun) {
      console.log();
      console.log(pc.yellow(formatDryRunNotice()));
    }
    return 0;
  }

  if (options.dryRun) {
    console.log();
    printDryRunPreview(cwd, files, force);
    console.log();
    console.log(pc.dim(formatDryRunSeparator()));
    console.log(pc.yellow(formatDryRunNotice()));
    return 0;
  }

  const result = writeGeneratedFiles(cwd, files, { force });
  printResultLines(result.created, formatCreatedLines, pc.green);
  printResultLines(result.overwritten, formatOverwrittenLines, pc.magenta);
  printResultLines(result.skipped, formatSkippedLines, pc.yellow);

  if (
    result.created.length === 0 &&
    result.overwritten.length === 0 &&
    result.skipped.length === 0
  ) {
    console.log(pc.dim("No docker-compose.yml file written."));
  }

  return 0;
}

function printServicePlan(plan: ReturnType<typeof detectLocalServices>): void {
  if (plan.services.length > 0) {
    console.log("Detected local services:");
    for (const service of plan.services) {
      console.log(`- ${service.label}: ${service.image} on ${service.port}`);
    }
    console.log();
  }

  if (plan.notes.length > 0) {
    console.log("Notes:");
    for (const note of plan.notes) {
      console.log(`- ${note}`);
    }
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

function printResultLines(
  files: OutputFile[],
  formatter: (files: OutputFile[]) => string[],
  color: (text: string) => string,
): void {
  for (const line of formatter(files)) {
    console.log(color(line));
  }
}
