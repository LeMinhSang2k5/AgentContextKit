# CLI Specification

Canonical binary: `rfa` (`dist/cli.js` after build).  
Compatibility binary: `ready-for-agents`.

Examples, docs, and help text should prefer `rfa`. The legacy binary remains published for users who installed earlier versions.

CLI framework: [commander](https://github.com/tj/commander.js) v13.

---

## 1. Global Behavior

| Property | Value |
| --- | --- |
| Command name | `rfa` |
| `--version`, `-V` | Reads the package version next to `dist/` |
| `--help`, `-h` | Commander-generated help |
| Global `--cwd` | Not supported; each project-scoped subcommand owns `--cwd` |

### Alias Map

| Full Command | Alias | Purpose |
| --- | --- | --- |
| `rfa init` | `rfa i` | Generate context files |
| `rfa update` | `rfa u` | Refresh generated files |
| `rfa doctor` | `rfa d` | Check readiness |
| `rfa diff` | none | Compare generated context with project state |
| `rfa ci` | none | Generate GitHub Actions workflow |
| `rfa runbook` | `rfa r` | Generate privacy-safe `RUNBOOK.md` |
| `rfa prompt` | `rfa p` | Short prompt command with context + compact defaults |
| `rfa config` | `rfa c` | Config command group |
| `rfa config init` | `rfa c i` | Create `.ready-for-agents.json` |
| `rfa index` | `rfa x` | Build context tree |
| `rfa query` | `rfa q` | Select relevant context sections |

---

## 2. `init`

Scans a project and generates core context Markdown files.

### Options

| Flag | Type | Default | Description |
| --- | --- | --- | --- |
| `--dry-run` | boolean | `false` | Preview generated output without writing |
| `--force` | boolean | `false` | Overwrite existing selected output files |
| `--cursor` | boolean | config | Include `.cursor/rules/ready-for-agents.mdc` |
| `--claude` | boolean | config | Include `CLAUDE.md` |
| `--copilot` | boolean | config | Include `.github/copilot-instructions.md` |
| `--all` | boolean | config | Include all optional agent files |
| `--index` | boolean | config | Generate `.ready-for-agents/context-tree.json` |
| `--cwd <path>` | string | `process.cwd()` | Project directory |

If `.ready-for-agents.json` exists, `init` uses `files.*` defaults. CLI flags take precedence over config.

### Exit Codes

| Code | Condition |
| --- | --- |
| `0` | Success, including skipped files |
| `1` | Invalid cwd or missing/invalid `package.json` |

### Examples

```bash
rfa init
rfa init --dry-run
rfa init --all
rfa init --index
rfa init --cwd /absolute/path/to/app --force
```

---

## 3. `update`

Refreshes generated context files. By default, it overwrites only files with a valid generated marker. User-authored files are skipped unless `--force` is passed.

### Options

| Flag | Type | Default | Description |
| --- | --- | --- | --- |
| `--dry-run` | boolean | `false` | Preview changes without writing |
| `--check` | boolean | `false` | Check freshness without writing |
| `--json` | boolean | `false` | Print machine-readable JSON |
| `--force` | boolean | `false` | Overwrite untracked existing files |
| `--cursor` | boolean | config | Include Cursor rule |
| `--claude` | boolean | config | Include `CLAUDE.md` |
| `--copilot` | boolean | config | Include Copilot instructions |
| `--all` | boolean | config | Include all optional agent files |
| `--index` | boolean | config | Regenerate context tree |
| `--cwd <path>` | string | `process.cwd()` | Project directory |

### Exit Codes

| Code | Condition |
| --- | --- |
| `0` | Success or all selected files are current |
| `1` | Validation error |
| `1` | `--check` finds missing, outdated, or untracked files |
| `1` | Write mode skips untracked files |

### JSON Contract

```ts
type UpdateCheckJsonOutput = {
  cwd: string;
  ok: boolean;
  upToDate: OutputFile[];
  outdated: OutputFile[];
  missing: OutputFile[];
  untracked: OutputFile[];
};
```

---

## 4. `diff`

Compares selected generated context files with the output that would be generated from the current project state. It does not write files.

### Options

| Flag | Type | Default | Description |
| --- | --- | --- | --- |
| `--cwd <path>` | string | `process.cwd()` | Project directory |
| `--json` | boolean | `false` | Print machine-readable JSON |
| `--cursor` | boolean | config | Include Cursor rule |
| `--claude` | boolean | config | Include `CLAUDE.md` |
| `--copilot` | boolean | config | Include Copilot instructions |
| `--all` | boolean | config | Include all optional agent files |

### JSON Contract

```ts
type DiffJsonOutput = UpdateCheckJsonOutput & {
  diffs: Array<{ file: OutputFile; diff: string }>;
};
```

Exit code is `0` when all selected files are current and `1` otherwise.

---

## 5. `ci`

Generates `.github/workflows/ready-for-agents.yml`.

The workflow runs:

```bash
npx --package ready-for-agents -- rfa doctor --json --cwd .
npx --package ready-for-agents -- rfa diff --json --cwd .
```

### Options

| Flag | Type | Default | Description |
| --- | --- | --- | --- |
| `--dry-run` | boolean | `false` | Preview workflow without writing |
| `--force` | boolean | `false` | Overwrite existing workflow |
| `--cwd <path>` | string | `process.cwd()` | Project directory |

---

## 6. `runbook`

Generates `RUNBOOK.md`, a privacy-safe guide for reviving an old project.

Privacy rules:

- Do not read values from `.env`, `.env.local`, `.env.production`, or other non-template `.env*` files.
- Parse only variable names from safe templates such as `.env.example`.
- Extract environment variable names from static source references such as `process.env.NAME`.
- Never emit secret values to stdout or `RUNBOOK.md`.

### Options

| Flag | Type | Default | Description |
| --- | --- | --- | --- |
| `--dry-run` | boolean | `false` | Preview `RUNBOOK.md` without writing |
| `--force` | boolean | `false` | Overwrite existing `RUNBOOK.md` |
| `--cwd <path>` | string | `process.cwd()` | Project directory |

### Examples

```bash
rfa runbook --dry-run
rfa runbook
rfa r --cwd /absolute/path/to/app
```

---

## 7. `doctor`

Checks whether a repository is ready for AI coding agents. It does not write files unless `--fix` is used.

### Options

| Flag | Type | Default | Description |
| --- | --- | --- | --- |
| `--cwd <path>` | string | `process.cwd()` | Project directory |
| `--json` | boolean | `false` | Print machine-readable JSON |
| `--fix` | boolean | `false` | Generate missing and refresh stale generated files safely |
| `--dry-run` | boolean | `false` | Preview `--fix` without writing |
| `--force` | boolean | `false` | With `--fix`, overwrite untracked files |
| `--cursor` | boolean | config | With `--fix`, include Cursor rule |
| `--claude` | boolean | config | With `--fix`, include `CLAUDE.md` |
| `--copilot` | boolean | config | With `--fix`, include Copilot instructions |
| `--all` | boolean | config | With `--fix`, include all optional files |
| `--index` | boolean | config | With `--fix`, generate context tree |

### JSON Contract

```ts
type DoctorJsonOutput = {
  cwd: string;
  ok: boolean;
  score: { passed: number; warned: number; failed: number; total: number };
  checks: Array<{ label: string; status: "pass" | "warn" | "fail"; detail?: string }>;
  fix?: {
    ran: boolean;
    ok: boolean;
    mode?: "write" | "dry-run";
    reason?: "critical-failure" | "config-error";
  };
};
```

Exit code is `1` when there is at least one critical failure or a fix operation skips untracked files.

---

## 8. `prompt` / `p`

Compiles rough user instructions into structured agent-ready prompts. It is rule-based and does not call an AI API.

`rfa p` is a short alias for `prompt` with context and compact defaults.

### Options

| Flag | Description |
| --- | --- |
| `--stdin` | Read instruction from stdin |
| `--file <path>` | Read instruction from a file |
| `--target <auto\|en\|vi>` | Response language guidance |
| `--cwd <path>` | Project directory for config/context lookup |
| `--context` / `--no-context` | Include or disable relevant context lookup |
| `--compact` / `--no-compact` | Choose compact or standard rendering |
| `--context-limit <number>` | Maximum relevant context sections |
| `--json` | Print JSON instead of Markdown |
| `--stats` | Print size stats to stderr |

---

## 9. `config init`

Creates `.ready-for-agents.json`.

### Options

| Flag | Description |
| --- | --- |
| `--dry-run` | Preview config without writing |
| `--force` | Overwrite existing config |
| `--cwd <path>` | Project directory |

---

## 10. `index`

Builds `.ready-for-agents/context-tree.json`, a compact map of generated context files and sections.

### Options

| Flag | Description |
| --- | --- |
| `--dry-run` | Print metadata without writing |
| `--json` | Print the tree as JSON without writing |
| `--output <path>` | Custom output path |
| `--cwd <path>` | Project directory |

---

## 11. `query`

Selects relevant generated context sections for a task.

### Options

| Flag | Description |
| --- | --- |
| `--cwd <path>` | Project directory |
| `--json` | Print machine-readable JSON |
| `--limit <number>` | Maximum number of matches |
| `--tree <path>` | Custom context tree path |

### JSON Contract

```ts
type QueryJsonOutput = {
  ok: boolean;
  cwd: string;
  query: string;
  source: "cache" | "live";
  treePath: string;
  summary: { matches: number; tokensEstimate: number };
  matches: QueryMatch[];
};
```
