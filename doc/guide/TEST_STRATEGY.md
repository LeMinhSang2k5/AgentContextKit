# Test Strategy

Test runner: **Vitest** via `pnpm test`.

Current suite: **292 tests** across **17 files**.

---

## 1. Goals

| Goal | Test Mechanism |
| --- | --- |
| Lock functional behavior | Map tests to [REQUIREMENTS.md](./REQUIREMENTS.md) |
| Protect detection rules | detector and package manager tests |
| Protect safe writes | init, update, doctor fix, runbook, docker, and revive tests |
| Validate machine-readable output | doctor/update/diff/query/prompt JSON tests |
| Protect prompt quality | example suite and quality assertions |
| Keep CLI aliases stable | CLI entrypoint tests |
| Keep generated Markdown readable | generator formatting tests |

---

## 2. Test Layers

```text
Integration-ish command tests
  → command functions with temp projects and captured console

Component tests
  → generators, update classification, context tree, query, prompt pipeline

Unit tests
  → detectors, scoring, normalization, classification
```

---

## 3. Test Files

| File | Scope |
| --- | --- |
| `doctor.test.ts` | doctor checks, score, JSON output, fix behavior |
| `validation.test.ts` | init validation and dry-run behavior |
| `init-safety.test.ts` | skip/force/optional files/index |
| `update.test.ts` | markers, untracked files, check mode, JSON |
| `ci-diff.test.ts` | CI workflow generation and diff output |
| `runbook.test.ts` | runbook safe writes and env privacy |
| `revive.test.ts` | local service detection, docker compose, and composite revive behavior |
| `cli.test.ts` | canonical CLI name and aliases |
| `config-index.test.ts` | config init, legacy config, index, prompt config |
| `query.test.ts` | live/cache context section selection |
| `detectors.test.ts` | stack, scripts, related scripts, labels |
| `package-manager.test.ts` | lockfile priority, packageManager field, fallback |
| `generators.test.ts` | Markdown spacing, trailing newline, optional generators |
| `prompt.test.ts` | prompt pipeline, input modes, JSON, target, stats |
| `prompt-context.test.ts` | prompt context and compact defaults |
| `prompt-examples.test.ts` | multilingual prompt example suite |
| `prompt-quality.test.ts` | output quality signals |

---

## 4. Fixture Pattern

Tests create temporary projects with:

```ts
mkdtempSync(join(tmpdir(), "ready-for-agents-..."));
writeFileSync(join(dir, "package.json"), JSON.stringify(pkg));
rmSync(dir, { recursive: true, force: true });
```

Fixtures should be small, explicit, and cleaned up in `afterEach`.

---

## 5. Required Cases

### Init

- invalid cwd exits `1`;
- dry-run writes nothing;
- existing files are skipped;
- `--force` overwrites;
- optional Cursor/Claude/Copilot files work;
- config can enable optional files and index.

### Update

- tracked generated files refresh;
- user-authored files are skipped;
- hash mismatch becomes untracked;
- `--check` returns correct exit code;
- JSON output is parseable.

### Doctor

- invalid cwd is fail-fast;
- missing/invalid `package.json` is critical;
- warnings do not necessarily fail;
- `--json` prints one object;
- `--fix` creates missing generated files;
- `--fix` protects untracked files.

### Runbook

- dry-run previews `RUNBOOK.md`;
- existing `RUNBOOK.md` is preserved unless `--force`;
- `.env` values are never printed;
- safe templates contribute variable names only;
- source env references are detected.

### Docker

- supported services are detected from specific dependencies and Prisma providers;
- dry-run previews `docker-compose.yml`;
- existing `docker-compose.yml` is preserved unless `--force`;
- `.env` values are never printed.

### Revive

- dry-run previews runbook, compose, index output, and next steps;
- write mode creates `RUNBOOK.md`, compose when applicable, and context tree;
- `--no-docker` and `--no-index` skip those outputs;
- context tree classifies `RUNBOOK.md` as `runbook` and `docker-compose.yml` as `docker`.

### Prompt

- empty input fails;
- conflicting input sources fail;
- file/stdin/argument input works;
- target language guidance works;
- JSON output is parseable;
- quality suite checks task, requirements, verify, unclear, and constraints.

### Query

- live fallback works when no cache exists;
- cache mode reports `source: "cache"`;
- verification queries prioritize command/test sections.

---

## 6. Local Verification

```bash
pnpm typecheck
pnpm test
pnpm build
pnpm docs:build
```

Docs site link integrity can be checked after `pnpm docs:build` by scanning generated `site/*.html` links.

---

## 7. Gaps

- Add true subprocess E2E tests for `node dist/cli.js`.
- Add docs build/link check as a scripted command.
- Consider cross-platform CI matrix for Windows path behavior.
