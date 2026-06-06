# Source Workflow

This document maps the `src/` tree to the product features. It is intentionally shorter than the code; use it as an orientation map before opening implementation files.

---

## 1. Source Tree

```text
src/
├── cli.ts
├── commands/
├── config/
├── constants.ts
├── detectors/
├── doctor/
├── fs/
├── generators/
├── indexer/
├── prompt/
├── query/
├── types.ts
└── index.ts
```

---

## 2. Entry Point

`src/cli.ts` owns the public command surface.

Responsibilities:

- create the Commander program;
- set canonical name `rfa`;
- register command aliases;
- map CLI flags into command option objects;
- call command functions and exit with their return code.

Command implementation should stay outside `cli.ts`.

---

## 3. Project Reading

`fs/read-project.ts` validates and reads Node project metadata.

Important functions:

| Function | Role |
| --- | --- |
| `resolveProjectCwd` | Resolve the effective project directory |
| `validateInitTarget` | Validate cwd and `package.json` before generation |
| `readProject` | Build `ProjectContext` |
| `hasReadme` | Detect README presence |

`readProject` does not run package manager commands.

---

## 4. Detection Modules

| File | Role |
| --- | --- |
| `detectors/package-manager.ts` | lockfile and `packageManager` detection |
| `detectors/stack.ts` | frontend/backend/database detection |
| `detectors/scripts.ts` | script aliases and related dev scripts |
| `detectors/folders.ts` | root folder detection |
| `detectors/environment.ts` | privacy-safe environment variable name detection |
| `detectors/labels.ts` | terminal/display labels |

Detection should remain conservative and static.

---

## 5. Generators

| File | Output |
| --- | --- |
| `generators/agents-md.ts` | `AGENTS.md` |
| `generators/project-context-md.ts` | `PROJECT_CONTEXT.md` |
| `generators/commands-md.ts` | `COMMANDS.md` |
| `generators/runbook-md.ts` | `RUNBOOK.md` |
| `generators/cursor-rules.ts` | Cursor rule |
| `generators/claude-md.ts` | `CLAUDE.md` |
| `generators/copilot-instructions-md.ts` | Copilot instructions |
| `generators/github-actions-workflow.ts` | GitHub Actions workflow |
| `generators/marker.ts` | generated marker and hash utilities |

Generators should return strings and avoid disk access.

---

## 6. Safe Writes

`fs/write-files.ts` centralizes write planning and safe write behavior.

| Function | Role |
| --- | --- |
| `planWriteActions` | classify would-create / would-overwrite / would-skip |
| `writeGeneratedFiles` | create/overwrite/skip selected output files |
| `getGeneratedFileNames` | filter selected files from `OUTPUT_FILES` |

`update` adds stricter marker validation before overwriting.

---

## 7. Command Modules

| File | Command |
| --- | --- |
| `commands/init.ts` | `rfa init` |
| `commands/update.ts` | `rfa update` |
| `commands/diff.ts` | `rfa diff` |
| `commands/ci.ts` | `rfa ci` |
| `commands/runbook.ts` | `rfa runbook` |
| `commands/doctor.ts` | `rfa doctor` |
| `commands/prompt.ts` | `rfa prompt` and `rfa p` |
| `commands/config.ts` | `rfa config init` |
| `commands/index.ts` | `rfa index` |
| `commands/query.ts` | `rfa query` |
| `commands/output.ts` | shared terminal formatting |

Command modules own validation, config resolution, output mode branching, and exit code decisions.

---

## 8. Doctor

`doctor/checks.ts` returns readiness checks. `doctor/score.ts` computes score and critical failure state.

The cwd checks are fail-fast. If cwd is invalid, doctor returns one failure instead of producing noisy secondary warnings.

---

## 9. Prompt Pipeline

| File | Role |
| --- | --- |
| `prompt/input.ts` | argument/stdin/file/TTY input |
| `prompt/normalize.ts` | whitespace and filler cleanup |
| `prompt/segment.ts` | segmentation and command extraction |
| `prompt/classify.ts` | intent classification |
| `prompt/extract.ts` | `PromptBrief` construction |
| `prompt/context.ts` | relevant context lookup |
| `prompt/render.ts` | Markdown/JSON output |
| `prompt/stats.ts` | size and token estimates |

The prompt feature is a deterministic compiler, not an AI model.

---

## 10. Context Tree And Query

`indexer/context-tree.ts` parses generated Markdown files into sections with headings, hashes, summaries, commands, keywords, and token estimates.

`query/load.ts` loads the cache or builds a live fallback.  
`query/select.ts` ranks sections for a query.

This supports targeted reading before an agent opens entire context files.

---

## 11. Public API

`src/index.ts` re-exports command functions, detectors, generators, config helpers, context tree helpers, prompt helpers, and public types.

Keep exports intentional. Anything exported becomes part of the package's programmatic surface.

---

## 12. Test Map

| Area | Tests |
| --- | --- |
| Package manager and detector rules | `package-manager.test.ts`, `detectors.test.ts` |
| Init safety and validation | `init-safety.test.ts`, `validation.test.ts` |
| Doctor | `doctor.test.ts` |
| Update | `update.test.ts` |
| Diff and CI | `ci-diff.test.ts` |
| Runbook | `runbook.test.ts` |
| Config, index, query | `config-index.test.ts`, `query.test.ts` |
| Prompt | `prompt*.test.ts` |
| CLI aliases | `cli.test.ts` |
| Markdown generators | `generators.test.ts` |
