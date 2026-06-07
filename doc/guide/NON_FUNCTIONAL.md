# Non-Functional Requirements

---

## NFR-1: Performance

| ID | Requirement | Implementation Strategy |
| --- | --- | --- |
| NFR-1-1 | `doctor` completes quickly on normal repositories | Uses bounded synchronous filesystem checks |
| NFR-1-2 | `init` avoids recursive repository scans | Reads `package.json`, lockfiles, and known root folders |
| NFR-1-3 | Detection does not spawn child processes | Uses Node `fs`, path utilities, and JSON parsing |
| NFR-1-4 | `index` is deterministic and lightweight | Reads only known generated output files |
| NFR-1-5 | `runbook` source scanning is bounded | Limits source file count and file size; ignores generated/heavy directories |
| NFR-1-6 | `docker` service detection is bounded | Reads dependencies and optional Prisma schema only |

Large files can still be read if they are part of the explicit metadata path, such as a very large `package.json`.

---

## NFR-2: Compatibility

| ID | Requirement |
| --- | --- |
| NFR-2-1 | Node.js 18 or newer |
| NFR-2-2 | ESM package (`"type": "module"`) |
| NFR-2-3 | macOS, Linux, and Windows path handling through `node:path` |
| NFR-2-4 | Target project must be a Node.js project with a root `package.json` |

---

## NFR-3: Security And Safety

| ID | Requirement |
| --- | --- |
| NFR-3-1 | Do not execute scripts from `package.json` during detection |
| NFR-3-2 | Do not upload project source |
| NFR-3-3 | `--dry-run` never writes to disk |
| NFR-3-4 | Existing user-authored files are preserved unless `--force` is explicit |
| NFR-3-5 | Do not read secret values from `.env*` non-template files |
| NFR-3-6 | `runbook` and `revive` may emit environment variable names, never environment values |
| NFR-3-7 | Core CLI paths do not call AI APIs or network services |
| NFR-3-8 | `docker` and `revive` do not run Docker, installs, migrations, or package scripts |

---

## NFR-4: Reliability

| ID | Requirement |
| --- | --- |
| NFR-4-1 | Exit codes are consistent: `0` for success, `1` for validation/failure states |
| NFR-4-2 | cwd and `package.json` errors are clear |
| NFR-4-3 | `doctor` fails fast when cwd is invalid |
| NFR-4-4 | JSON output modes print one parseable JSON object and no decorative terminal UI |

---

## NFR-5: Maintainability

| ID | Requirement |
| --- | --- |
| NFR-5-1 | TypeScript remains strict and `pnpm typecheck` passes |
| NFR-5-2 | Detection rules live in `src/detectors/` |
| NFR-5-3 | Generators are deterministic functions over explicit inputs |
| NFR-5-4 | `doc/guide` stays in sync with behavior |
| NFR-5-5 | New behavior should be backed by focused tests |

---

## NFR-6: Current Limits

| Area | Current Limit |
| --- | --- |
| Languages | Node.js ecosystem only |
| Monorepos | No automatic workspace traversal |
| Config | Project-level `.ready-for-agents.json`; no global user config yet |
| Cache | Project-level `.ready-for-agents/context-tree.json`; no database |
| CLI i18n | User-facing CLI output is English |

---

## NFR-7: Runtime Dependencies

| Package | Role |
| --- | --- |
| `commander` | CLI parsing |
| `picocolors` | Terminal colors |

Development dependencies such as `typescript`, `tsx`, `vitest`, and `prettier` are not production dependencies for users of the published CLI.

---

## NFR-8: Observability And Debugging

- No telemetry.
- No structured logging yet.
- Debug locally with `pnpm dev`, breakpoints, and focused tests.
- User-facing errors go to stderr for validation errors or structured check lines for `doctor`.
