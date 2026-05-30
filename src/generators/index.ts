import type { GeneratedFiles, ProjectContext } from "../types.js";
import { generateAgentsMd } from "./agents-md.js";
import { generateCommandsMd } from "./commands-md.js";
import { generateProjectContextMd } from "./project-context-md.js";

export function generateAllFiles(ctx: ProjectContext): GeneratedFiles {
  return {
    "AGENTS.md": generateAgentsMd(ctx),
    "PROJECT_CONTEXT.md": generateProjectContextMd(ctx),
    "COMMANDS.md": generateCommandsMd(ctx),
  };
}

export { generateAgentsMd, generateCommandsMd, generateProjectContextMd };
