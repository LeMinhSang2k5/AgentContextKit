# Research Notes

`ready-for-agents` can be read as a small applied research project about making software repositories legible to AI coding agents.

The central question is:

> How much useful project context can be extracted deterministically, without executing user code, reading secrets, or calling an AI API?

The current implementation answers this with a static-analysis-first CLI. It does not try to understand every file. Instead, it builds a compact, conservative model of the repository from high-signal artifacts such as `package.json`, lockfiles, known folders, generated context files, and explicit environment variable references.

---

## Research Framing

### Problem Statement

AI coding agents often waste context budget on basic repository discovery:

- package manager selection
- build/test command discovery
- stack identification
- file safety boundaries
- stale project re-entry after weeks or months
- repeated explanation of the same repository facts

This is a context-orchestration problem rather than only a documentation problem. A good context system should reduce repeated explanation while preserving correctness and user control.

### Design Hypothesis

A deterministic repository context layer can improve agent performance if it satisfies four constraints:

1. It is cheap to generate.
2. It is safe by default.
3. It is explicit about uncertainty.
4. It is machine-readable enough for selective retrieval.

The project tests this hypothesis through commands such as `init`, `doctor`, `prompt`, `index`, `query`, `diff`, and `runbook`.

---

## System Lens

The system has three conceptual layers.

| Layer | Role | Example |
| --- | --- | --- |
| Detection | Convert project artifacts into facts | package manager, stack, scripts |
| Generation | Convert facts into agent-readable files | `AGENTS.md`, `COMMANDS.md`, `RUNBOOK.md` |
| Retrieval | Select only the relevant generated sections | context tree, `query`, prompt context |

The important design choice is that generation and retrieval are separated. Generated Markdown is readable by humans, while `context-tree.json` gives agents a compact map before they open full files.

---

## Research Questions

### RQ1: Can static detection be useful without overclaiming?

The tool uses conservative first-match rules. It prefers "Not detected" over speculative labels because false certainty is more harmful than partial information.

### RQ2: Can generated context reduce token waste?

`index` and `query` create a lightweight retrieval layer over generated files. The agent can inspect section summaries, commands, keywords, and token estimates before deciding what to read fully.

### RQ3: Can prompt normalization preserve intent without an AI API?

`prompt` uses segmentation, intent classification, and structured rendering. It improves instruction shape but avoids semantic rewriting that would require a model.

### RQ4: Can project revival be automated without leaking secrets?

`runbook` generates operational guidance while treating `.env*` values as out of scope. It detects names, not values.

---

## Evaluation Strategy

The project uses behavior-oriented tests instead of snapshot-heavy tests.

| Capability | Evaluation Signal |
| --- | --- |
| Detection | fixture package metadata maps to expected stack/scripts |
| Safety | existing files are skipped unless `--force` |
| Freshness | generated markers classify files as up-to-date/outdated/untracked |
| Prompt quality | bilingual example suite and quality assertions |
| Privacy | `.env` values are not read or emitted by `runbook` |

This is not a benchmark of AI agent productivity yet. It is a correctness and safety baseline for the context layer.

---

## Future Research Directions

1. Measure how often `query` reduces full-file reads in real agent sessions.
2. Compare static prompt normalization against AI-based rewriting with human evaluation.
3. Add language-specific detectors while preserving conservative uncertainty.
4. Extend `runbook` into Docker and seed generation with an explicit threat model.
5. Explore context graph ranking beyond keyword overlap, such as section centrality and command relevance.
