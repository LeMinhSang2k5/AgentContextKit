# Functional Requirements

Documentation version: **v0.2.x**.

Status values:

- **Done:** implemented and covered by tests.
- **Planned:** roadmap item.

---

## FR-0: Global

| ID | Requirement | Acceptance | Status |
| --- | --- | --- | --- |
| FR-0-1 | Run on Node.js 18+ | `engines.node >= 18` | Done |
| FR-0-2 | Support `--cwd <path>` for project-scoped commands | Paths resolve absolute; invalid paths fail clearly | Done |
| FR-0-3 | Avoid network and AI APIs in core paths | No LLM SDK dependency; tests run offline | Done |

---

## FR-init

| ID | Requirement | Acceptance | Status |
| --- | --- | --- | --- |
| FR-init-1 | Read project metadata | `readProject(cwd)` returns `ProjectContext` for valid Node projects | Done |
| FR-init-2 | Generate core files | `AGENTS.md`, `PROJECT_CONTEXT.md`, `COMMANDS.md` | Done |
| FR-init-3 | Validate target before generation | invalid cwd/package JSON exits `1` with clear error | Done |
| FR-init-4 | Support dry-run | no files written | Done |
| FR-init-5 | Preserve existing files | skipped unless `--force` | Done |
| FR-init-6 | Support optional agent files | Cursor, Claude, Copilot, all presets | Done |
| FR-init-7 | Support context tree | generated when config/flag enables index | Done |
| FR-init-8 | Use project config | `.ready-for-agents.json` defaults; CLI flags override | Done |

---

## FR-update

| ID | Requirement | Acceptance | Status |
| --- | --- | --- | --- |
| FR-update-1 | Refresh generated context | overwrites tracked generated files | Done |
| FR-update-2 | Preserve untracked files | skips files without valid marker unless `--force` | Done |
| FR-update-3 | Create missing selected files | missing core/optional files can be created | Done |
| FR-update-4 | Support dry-run | prints planned changes without writing | Done |
| FR-update-5 | Support freshness checks | `--check` exits `0` only when all selected files are current | Done |
| FR-update-6 | Support JSON output | parseable `UpdateCheckJsonOutput` | Done |
| FR-update-7 | Refresh context tree | index regenerated when enabled | Done |

---

## FR-diff

| ID | Requirement | Acceptance | Status |
| --- | --- | --- | --- |
| FR-diff-1 | Compare generated context | classifies up-to-date, outdated, missing, and untracked files | Done |
| FR-diff-2 | Print text diff | outdated tracked files include unified-style diff | Done |
| FR-diff-3 | Support JSON output | parseable object with `diffs` array | Done |
| FR-diff-4 | Include optional files | `--cursor`, `--claude`, `--copilot`, `--all` select additional outputs | Done |

---

## FR-ci

| ID | Requirement | Acceptance | Status |
| --- | --- | --- | --- |
| FR-ci-1 | Generate workflow | creates `.github/workflows/ready-for-agents.yml` | Done |
| FR-ci-2 | Support dry-run | previews workflow without writing | Done |
| FR-ci-3 | Safe write | preserves existing workflow unless `--force` | Done |
| FR-ci-4 | Run readiness/freshness checks | workflow runs `rfa doctor --json` and `rfa diff --json` | Done |

---

## FR-runbook

| ID | Requirement | Acceptance | Status |
| --- | --- | --- | --- |
| FR-runbook-1 | Generate `RUNBOOK.md` | includes setup, env names, scripts, runtime notes, and revival checklist | Done |
| FR-runbook-2 | Support dry-run | previews runbook without writing | Done |
| FR-runbook-3 | Safe write | preserves existing `RUNBOOK.md` unless `--force` | Done |
| FR-runbook-4 | Protect env values | does not read or print values from `.env*` non-template files | Done |
| FR-runbook-5 | Extract env names safely | reads names from safe templates and static source references | Done |
| FR-runbook-6 | Support alias | `rfa r` maps to `rfa runbook` | Done |

---

## FR-doctor

| ID | Requirement | Acceptance | Status |
| --- | --- | --- | --- |
| FR-doctor-1 | Check-only by default | no writes without `--fix` | Done |
| FR-doctor-2 | Fail fast for invalid cwd | one failure check, no misleading context warnings | Done |
| FR-doctor-3 | Validate `package.json` | missing/invalid file is a critical failure | Done |
| FR-doctor-4 | Check package manager | lockfile/field passes; fallback warns | Done |
| FR-doctor-5 | Check core context files | missing core files warn | Done |
| FR-doctor-6 | Check dev/build/test scripts | missing scripts warn | Done |
| FR-doctor-7 | Check README | missing README warns | Done |
| FR-doctor-8 | Support JSON output | one parseable object on stdout | Done |
| FR-doctor-9 | Support `--fix` | creates missing and refreshes stale generated files | Done |
| FR-doctor-10 | Protect untracked files during fix | skipped untracked files cause exit `1` | Done |
| FR-doctor-11 | Support fix JSON output | includes structured `fix` object | Done |
| FR-doctor-12 | Respect config | fix defaults read from `.ready-for-agents.json` | Done |

### Doctor JSON Output

`doctor --json` must produce one parseable JSON object and no terminal decoration.

Required fields:

- `cwd`
- `ok`
- `score`
- `checks`
- optional `fix`

---

## FR-prompt

| ID | Requirement | Acceptance | Status |
| --- | --- | --- | --- |
| FR-prompt-1 | Rule-based prompt compiler | no AI API call | Done |
| FR-prompt-2 | Argument input | `rfa prompt "text"` | Done |
| FR-prompt-3 | stdin input | `--stdin` | Done |
| FR-prompt-4 | file input | `--file task.txt` | Done |
| FR-prompt-5 | interactive input | reads from TTY when no input source is provided | Done |
| FR-prompt-6 | Conservative normalization | removes light filler while preserving technical intent | Done |
| FR-prompt-7 | Structured output | task/context/requirements/constraints/verify/unclear/response | Done |
| FR-prompt-8 | JSON output | parseable prompt JSON | Done |
| FR-prompt-9 | Target language guidance | `auto`, `en`, `vi` | Done |
| FR-prompt-10 | Context lookup | `--context` uses context tree/cache or live fallback | Done |
| FR-prompt-11 | Compact rendering | `--compact` and `rfa p` | Done |
| FR-prompt-12 | Config defaults | prompt target/context/style/limit read from config | Done |

---

## FR-config

| ID | Requirement | Acceptance | Status |
| --- | --- | --- | --- |
| FR-config-1 | Create config | `config init` writes `.ready-for-agents.json` | Done |
| FR-config-2 | Support dry-run | previews config without writing | Done |
| FR-config-3 | Preserve existing config | skipped unless `--force` | Done |
| FR-config-4 | Legacy compatibility | reads `.agent-context-kit.json` if primary config is absent | Done |

---

## FR-index

| ID | Requirement | Acceptance | Status |
| --- | --- | --- | --- |
| FR-index-1 | Build context tree | includes files, sections, hashes, summaries, commands, keywords, token estimates | Done |
| FR-index-2 | Default output | `.ready-for-agents/context-tree.json` | Done |
| FR-index-3 | Support dry-run | prints metadata without writing | Done |
| FR-index-4 | Support JSON output | prints `{ ok, output, tree }` without writing | Done |
| FR-index-5 | Custom output path | `--output` or config `index.output` | Done |

---

## FR-query

| ID | Requirement | Acceptance | Status |
| --- | --- | --- | --- |
| FR-query-1 | Select relevant sections | returns section refs, summaries, reasons, and token estimates | Done |
| FR-query-2 | Use context tree cache | reports source `cache` when tree exists | Done |
| FR-query-3 | Live fallback | scans generated files when cache is missing | Done |
| FR-query-4 | Support JSON output | parseable `{ ok, cwd, query, source, treePath, summary, matches }` | Done |
| FR-query-5 | Limit results | clamps `--limit` to safe bounds | Done |

---

## FR-detect

| ID | Requirement | Acceptance | Status |
| --- | --- | --- | --- |
| FR-detect-1 | Package manager from lockfile | follows lockfile priority | Done |
| FR-detect-2 | Package manager from package field | parses `name@version` | Done |
| FR-detect-3 | npm fallback | marks source as `fallback` | Done |
| FR-detect-4 | Multi-layer stack | detects frontend/backend/database independently | Done |
| FR-detect-5 | Script aliases | maps aliases into logical script keys | Done |
| FR-detect-6 | Related dev scripts | parses `dev:*` and script references | Done |
| FR-detect-7 | Important folders | checks known root folder names | Done |
| FR-detect-8 | Env names for runbook | detects names from safe templates and static source references | Done |

---

## Planned

| ID | Requirement | Status |
| --- | --- | --- |
| FR-docker-1 | Generate Dockerfile and docker-compose guidance | Planned |
| FR-seed-1 | Generate sample data templates | Planned |
| FR-revive-1 | Compose runbook/docker/seed/doctor/index workflows | Planned |
| FR-lang-1 | Detect Python/FastAPI/Django projects | Planned |
| FR-ai-1 | Optional AI summaries with explicit opt-in | Planned |

---

## Traceability

| Area | Test Files |
| --- | --- |
| Init and validation | `validation.test.ts`, `init-safety.test.ts` |
| Update | `update.test.ts` |
| Diff and CI | `ci-diff.test.ts` |
| Runbook | `runbook.test.ts` |
| Doctor | `doctor.test.ts` |
| Config, index, query | `config-index.test.ts`, `query.test.ts` |
| Detection | `detectors.test.ts`, `package-manager.test.ts` |
| Generated output | `generators.test.ts` |
| Prompt | `prompt.test.ts`, `prompt-context.test.ts`, `prompt-examples.test.ts`, `prompt-quality.test.ts` |
