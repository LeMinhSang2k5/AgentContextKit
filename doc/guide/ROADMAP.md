# Product Roadmap

This roadmap summarizes shipped work and planned directions. Detailed functional requirements live in [REQUIREMENTS.md](./REQUIREMENTS.md).

---

## Shipped In v0.2.x

| Feature | Summary |
| --- | --- |
| `init` | Generate `AGENTS.md`, `PROJECT_CONTEXT.md`, and `COMMANDS.md` |
| `init --dry-run` | Preview generated files without writing |
| `init --force` | Overwrite selected generated outputs intentionally |
| Static detection | Package manager, stack, scripts, folders |
| `doctor` | Readiness checks, score output, and fail-fast cwd validation |
| `doctor --json` | Machine-readable readiness output for CI |
| `doctor --fix` | Generate/refresh missing or stale generated context safely |
| `update` | Refresh tracked generated context files |
| `update --check --json` | Machine-readable freshness checks |
| Generated marker/hash | Distinguish generated files from user-authored files |
| `.cursor/rules` | Cursor project rule generator |
| `CLAUDE.md` | Claude Code guidance generator |
| `.github/copilot-instructions.md` | GitHub Copilot instructions generator |
| `diff` | Compare generated context with current project state |
| `ci` | Generate GitHub Actions workflow for readiness/freshness checks |
| `prompt` | Rule-based prompt compiler with no AI API |
| `prompt --json` | Machine-readable prompt output |
| `prompt --file` and stdin | Multiple prompt input sources |
| `prompt --target` | Response language instruction: `auto`, `en`, or `vi` |
| `rfa p` | Short prompt alias with context + compact defaults |
| `.ready-for-agents.json` | Project-level defaults for optional files, prompt, and index |
| `index` | Context tree cache |
| `query` | Select relevant generated context sections |
| `runbook` | Privacy-safe project revival guide |
| GitHub Pages docs site | Static research-style documentation generated from `doc/guide` |

---

## Planned: Prompt

| Priority | Item | Why |
| --- | --- | --- |
| P1 | `--style codex\|cursor\|claude` | Tailor prompt output for specific agent environments |
| P1 | More detailed token budget reporting | Help users understand prompt length tradeoffs |
| P2 | `compare`, `plan`, `implement` intents | Improve task-specific prompt structure |
| P3 | `--ai` rewrite opt-in | Optional semantic rewrite after deterministic baseline is trusted |

---

## Planned: Project Revival

| Priority | Item | Why |
| --- | --- | --- |
| P1 | `rfa docker --dry-run` | Generate Dockerfile / compose guidance from detected stack |
| P1 | Docker privacy model | Ensure env placeholders never leak real secrets |
| P2 | `rfa seed --dry-run` | Generate sample data templates for local development |
| P3 | `rfa revive --dry-run` | Compose runbook, docker, seed, doctor, and index workflows |

---

## Planned: Detection

| Priority | Item | Why |
| --- | --- | --- |
| P1 | Config schema publishing | Editor autocomplete for `.ready-for-agents.json` |
| P2 | Workspace/monorepo awareness | Support larger repositories safely |
| P2 | Python / FastAPI / Django detection | Expand beyond Node.js projects |
| P3 | Optional AI summaries | Richer project summaries with explicit opt-in and API key policy |

---

## Prioritization Principles

1. **Static-first:** core paths should work offline and without credentials.
2. **Safe by default:** no overwrite, no secret reads, no execution without explicit user action.
3. **Spec before code:** update requirements and CLI contracts with behavior changes.
4. **Tests by contract:** every shipped feature should have focused acceptance tests.

---

## Versioning Guidance

| Bump | Use When |
| --- | --- |
| PATCH | Bug fix, detection wording, doc polish |
| MINOR | Backward-compatible command or output addition |
| MAJOR | Breaking generated file format, removed flags, changed exit semantics |

Release history lives in [CHANGELOG.md](../../CHANGELOG.md).
