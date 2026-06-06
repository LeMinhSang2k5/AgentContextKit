# Glossary

| Term | Definition |
| --- | --- |
| **ready-for-agents** | The CLI package that generates and checks context for AI coding agents. |
| **Context file** | A generated file that helps agents understand a project, such as `AGENTS.md`, `PROJECT_CONTEXT.md`, `COMMANDS.md`, or optional agent-native files. |
| **Config file** | `.ready-for-agents.json`, a project-level file for CLI defaults. |
| **Context tree** | `.ready-for-agents/context-tree.json`, a compact JSON map of generated file sections, hashes, summaries, commands, and token estimates. |
| **ProjectContext** | The central TypeScript object produced by `readProject(cwd)` and consumed by generators. |
| **Static detection** | Inferring project facts from files on disk without executing commands or calling external APIs. |
| **Package manager (PM)** | npm, pnpm, yarn, or bun. |
| **PM source** | How the package manager was detected: `lockfile`, `package.json`, or `fallback`. |
| **Fallback npm** | The package manager result when no lockfile or `packageManager` field provides stronger evidence. |
| **Stack layer** | A detected frontend, backend, or database layer with a label and dependency evidence. |
| **ScriptKey** | Logical script category: `dev`, `build`, `test`, `lint`, `typecheck`, or `format`. |
| **Script alias** | A concrete `package.json` script name mapped to a logical `ScriptKey`. |
| **Related dev scripts** | Scripts such as `dev:client` or `dev:server`, either named by convention or referenced by the main `dev` script. |
| **Important folders** | Root folders such as `src`, `app`, `pages`, `components`, `lib`, and `tests`. |
| **Ignored scan dirs** | Directory names that should not be scanned or modified, such as `node_modules`, `.git`, `dist`, `build`, `.next`, and `coverage`. |
| **Output file** | A file listed in `OUTPUT_FILES`, including core context, `RUNBOOK.md`, optional agent files, and CI workflow output. |
| **Generated marker** | A content hash marker appended to generated Markdown/YAML files. |
| **Tracked generated file** | A file with a valid generated marker whose hash matches the body. |
| **Untracked file** | An output-path file that exists but is not recognized as a valid generated file. |
| **Dry run** | A preview mode that does not write to disk. |
| **Force** | A flag that intentionally overwrites an existing output file. |
| **Doctor check** | A readiness check with `pass`, `warn`, or `fail` status. |
| **Critical failure** | A `doctor` failure that should produce exit code `1`, such as missing or invalid `package.json`. |
| **Freshness check** | A comparison between generated output and what is currently on disk. |
| **Runbook** | `RUNBOOK.md`, a privacy-safe operational guide for reviving and running a project. |
| **Safe env template** | A file such as `.env.example` or `.env.template` from which only variable names are extracted. |
| **Sensitive env file** | A file such as `.env`, `.env.local`, or `.env.production`; the tool may record its existence but must not read values. |
| **Prompt compiler** | The deterministic `rfa prompt` pipeline that normalizes and structures rough instructions without an AI API. |
| **ADR** | Architecture Decision Record, a short document explaining why a major design decision was made. |
