# System Overview

## 1. Definition

**ready-for-agents** is a Node.js CLI that makes repositories easier for AI coding agents to inspect, modify, and verify.

It does this by:

1. statically reading high-signal project metadata such as `package.json`, lockfiles, root folders, and generated context files;
2. generating or checking Markdown/YAML files that describe how an agent should work in the repository;
3. building a compact context tree so agents can select relevant sections before opening full documents.

The core CLI does not call AI APIs, does not upload source code, and does not execute project scripts for detection.

---

## 2. Problem Space

| Without a context layer | With `ready-for-agents` |
| --- | --- |
| Agents guess `npm` vs `pnpm` | Package manager is detected from lockfiles and `packageManager` |
| Agents invent build/test commands | Commands come from real `package.json` scripts |
| Agents edit unsafe files | `AGENTS.md` lists safety rules and files to avoid |
| Users repeat repository context every session | Context files live in the repository |
| Agents read every context file every turn | `index` and `query` provide targeted section lookup |
| Old projects are hard to restart | `runbook`, `docker`, and `revive` prepare a privacy-safe local revival path |

---

## 3. Current Scope

### In Scope

- Node.js projects with a root `package.json`.
- `init`: generate `AGENTS.md`, `PROJECT_CONTEXT.md`, and `COMMANDS.md`.
- Optional agent-native files for Cursor, Claude Code, and GitHub Copilot.
- `update`: refresh generated context safely.
- `diff`: compare generated context against current project state.
- `ci`: generate a GitHub Actions workflow for readiness and freshness checks.
- `runbook`: generate `RUNBOOK.md` without reading secret environment values.
- `docker`: generate local development services for detected databases/caches.
- `revive`: prepare `RUNBOOK.md`, local services, and context tree in one pass.
- `doctor`: check project readiness; `--fix` can repair generated context files.
- `prompt`: compile rough user instructions into structured agent-ready prompts without an AI API.
- `config init`: generate `.ready-for-agents.json`.
- `index`: generate `.ready-for-agents/context-tree.json`.
- `query`: select relevant generated context sections for a task.
- Conservative static detection for package manager, stack, scripts, folders, and environment variable names.

### Out Of Scope For The Current MVP

- Deep multi-language project analysis.
- Automatic monorepo workspace discovery.
- AI-generated summaries in the core path.
- Running Docker containers, migrations, package scripts, or test commands automatically.
- Reading secret values from `.env*` files.

---

## 4. Command Map

| Command | Writes Files? | Purpose |
| --- | --- | --- |
| `init` | Yes, unless `--dry-run` | Create initial generated context files |
| `update` | Yes, unless `--dry-run`, `--check`, or `--json` | Refresh tracked generated files |
| `diff` | No | Show stale, missing, or untracked generated files |
| `ci` | Yes, unless `--dry-run` | Create GitHub Actions readiness/freshness workflow |
| `runbook` | Yes, unless `--dry-run` | Create a project revival guide without leaking secrets |
| `docker` | Yes, unless `--dry-run` | Create local development services when supported |
| `revive` | Yes, unless `--dry-run` | Prepare runbook, local services, and context index together |
| `doctor` | No, unless `--fix` | Check project readiness and optionally fix generated context |
| `prompt` / `p` | No | Normalize rough instructions into agent-ready prompts |
| `config init` | Yes, unless `--dry-run` | Create project-level CLI defaults |
| `index` | Yes, unless `--dry-run` or `--json` | Build context tree cache |
| `query` | No | Select relevant generated context sections |

---

## 5. Users

| Role | Primary Docs |
| --- | --- |
| End user | [README.md](../../README.md), [README.vi.md](../../README.vi.md) |
| Maintainer | [ARCHITECTURE.md](./ARCHITECTURE.md), [SRC_WORKFLOW.md](./SRC_WORKFLOW.md) |
| QA / integrator | [CLI_SPEC.md](./CLI_SPEC.md), [REQUIREMENTS.md](./REQUIREMENTS.md), [TEST_STRATEGY.md](./TEST_STRATEGY.md) |
| Security reviewer | [SECURITY_MODEL.md](./SECURITY_MODEL.md), [NON_FUNCTIONAL.md](./NON_FUNCTIONAL.md) |
| Agent reading a target repo | Generated files such as `AGENTS.md`, not this guide |

---

## 6. Core Design Constraints

1. **Static-first:** infer from files already on disk.
2. **Safe by default:** do not overwrite user-authored files without explicit force.
3. **Deterministic output:** the same project state should produce the same generated context.
4. **Conservative detection:** prefer "not detected" over a confident but wrong label.
5. **Privacy-first env handling:** detect variable names, not secret values.
6. **Small composable commands:** keep `init`, `doctor`, `runbook`, `docker`, `revive`, `query`, and `prompt` independently useful.
7. **Human and machine readability:** generated Markdown should be readable by people; JSON outputs should support CI and automation.

---

## 7. Repository Structure

```text
ready-for-agents/
├── src/
│   ├── cli.ts              # CLI entry point
│   ├── commands/           # init, update, doctor, runbook, docker, revive, prompt, config, index, query
│   ├── config/             # config reader and defaults
│   ├── detectors/          # package manager, stack, scripts, folders, environment names, local services
│   ├── doctor/             # readiness checks and score formatting
│   ├── fs/                 # project reading, validation, safe writes
│   ├── generators/         # generated Markdown/YAML templates and markers
│   ├── indexer/            # context tree cache
│   ├── prompt/             # prompt compiler pipeline
│   └── query/              # context section selection
├── tests/
├── doc/guide/              # source documentation
├── docs-site/              # static docs site assets
└── scripts/                # docs build/preview scripts
```

---

## 8. Suggested Reading Order

1. [RESEARCH_NOTES.md](./RESEARCH_NOTES.md)
2. [ALGORITHMS.md](./ALGORITHMS.md)
3. [REQUIREMENTS.md](./REQUIREMENTS.md)
4. [CLI_SPEC.md](./CLI_SPEC.md)
5. [DATA_MODEL.md](./DATA_MODEL.md)
6. [ARCHITECTURE.md](./ARCHITECTURE.md)
7. [DETECTION_RULES.md](./DETECTION_RULES.md)
8. [GENERATED_FILES_SPEC.md](./GENERATED_FILES_SPEC.md)
9. [SECURITY_MODEL.md](./SECURITY_MODEL.md)
10. [SRC_WORKFLOW.md](./SRC_WORKFLOW.md)
