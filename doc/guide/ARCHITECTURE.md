# Architecture

`ready-for-agents` is a static pipeline:

```text
disk artifacts → internal model → generated output or report
```

The architecture favors small modules, deterministic functions, and explicit command boundaries.

---

## 1. Layered View

```text
┌────────────────────────────────────────────────────┐
│ Presentation                                        │
│ cli.ts · commander · picocolors                     │
├────────────────────────────────────────────────────┤
│ Application                                         │
│ commands/init · update · doctor · runbook · prompt  │
│ commands/config · index · query · ci · diff         │
├────────────────────────────────────────────────────┤
│ Domain                                              │
│ detectors · generators · doctor · prompt · query    │
│ indexer                                            │
├────────────────────────────────────────────────────┤
│ Infrastructure                                      │
│ fs/read-project · fs/write-files · fs/validate      │
│ config/read                                        │
└────────────────────────────────────────────────────┘
```

Dependency direction should stay mostly top-down. Domain modules should not import CLI presentation concerns.

---

## 2. Command Pipelines

### `init`

```text
validateInitTarget
  → readReadyForAgentsConfig
  → readProject
  → generateAllFiles
  → writeGeneratedFiles or dry-run preview
  → optional buildContextTree
```

### `update`

```text
validateInitTarget
  → readReadyForAgentsConfig
  → readProject
  → generateAllFiles
  → checkGeneratedFiles
  → writeUpdateFiles or JSON/check/dry-run
  → optional buildContextTree
```

### `diff`

```text
validateInitTarget
  → readReadyForAgentsConfig
  → readProject
  → generateAllFiles
  → checkGeneratedFiles
  → createUnifiedDiff for outdated tracked files
```

### `ci`

```text
validateCwd
  → generateGithubActionsWorkflow
  → writeGeneratedFiles or dry-run preview
```

### `runbook`

```text
validateInitTarget
  → readProject
  → detectEnvironmentUsage
  → generateRunbookFile
  → writeGeneratedFiles or dry-run preview
```

### `doctor`

```text
runDoctorChecks
  → formatScore / JSON
  → optional doctor --fix through generated-file update path
```

### `prompt`

```text
readPromptInput
  → normalizePromptText
  → segmentPromptText
  → classifyPromptIntent
  → optional lookupPromptContext
  → extractPromptBrief
  → renderPromptBrief / JSON
```

### `index`

```text
validateInitTarget
  → readReadyForAgentsConfig
  → readProject
  → buildContextTree
  → writeContextTree / JSON / dry-run metadata
```

### `query`

```text
validate input
  → loadContextTree or live generated-file scan
  → selectContextSections
  → render text or JSON
```

---

## 3. Extension Points

| Change | Modules |
| --- | --- |
| New CLI command | `cli.ts`, `src/commands/*`, tests |
| New detector rule | `src/detectors/*`, detector tests, docs |
| New generated file | `types.OUTPUT_FILES`, generator, marker/update/diff/write/index paths |
| New config default | `config/types.ts`, `config/read.ts`, config tests |
| New prompt intent | `prompt/classify.ts`, `prompt/extract.ts`, prompt tests |
| New query signal | `indexer/context-tree.ts`, `query/select.ts`, query tests |

---

## 4. Distribution

| Artifact | Role |
| --- | --- |
| `dist/` | TypeScript build output and CLI binary target |
| `doc/guide/` | Source technical documentation included in npm tarball |
| `docs-site/` | Static site assets, not shipped as runtime CLI code |
| `site/` | Generated GitHub Pages artifact, ignored by git |
| `CHANGELOG.md` | Release history |
| `PUBLISH_CHECKLIST.md` | Manual publish procedure |

The npm package always includes `README.md`, `README.vi.md`, `LICENSE`, and `package.json` even when not listed in the `files` array.

---

## 5. Testing Architecture

- Unit tests cover detectors, scoring, prompt parsing, and query selection.
- Fixture-style tests create temporary projects with `mkdtempSync`.
- Command tests call command functions directly for deterministic stdout/disk behavior.
- CLI entrypoint tests verify command aliases and help output.
- Docs site build is verified with `pnpm docs:build` and local link checks.
