# ready-for-agents Technical Guide

This guide explains the product, architecture, algorithms, CLI contracts, generated files, and test strategy behind **ready-for-agents**.

The documentation source is intentionally written in English so the GitHub Pages site, npm package, and contributor materials all present one consistent technical voice.

**User-facing docs:** [README.md](../../README.md) · [README.vi.md](../../README.vi.md)  
**Release docs:** [CHANGELOG.md](../../CHANGELOG.md) · [PUBLISH_CHECKLIST.md](../../PUBLISH_CHECKLIST.md)  
**Docs site:** `pnpm docs:build` generates `site/`; `pnpm docs:preview` serves it locally.

---

## Quick Map

| Question | Read |
| --- | --- |
| What problem does the tool solve? | [OVERVIEW.md](./OVERVIEW.md) |
| What are the CLI commands and exit codes? | [CLI_SPEC.md](./CLI_SPEC.md) |
| What data flows through the system? | [DATA_MODEL.md](./DATA_MODEL.md) |
| Why is the project designed this way? | [RESEARCH_NOTES.md](./RESEARCH_NOTES.md) |
| Which algorithms are used? | [ALGORITHMS.md](./ALGORITHMS.md) |
| How are secrets protected? | [SECURITY_MODEL.md](./SECURITY_MODEL.md) |
| What files are generated? | [GENERATED_FILES_SPEC.md](./GENERATED_FILES_SPEC.md) |
| Where should code changes go? | [SRC_WORKFLOW.md](./SRC_WORKFLOW.md) |
| How should behavior be tested? | [TEST_STRATEGY.md](./TEST_STRATEGY.md) |

---

## Command Map

| Command | Role | Primary Specs |
| --- | --- | --- |
| `init` | Generate initial context files | [CLI_SPEC](./CLI_SPEC.md#2-init), [Generated Files](./GENERATED_FILES_SPEC.md) |
| `update` | Refresh tracked generated context | [CLI_SPEC](./CLI_SPEC.md#3-update), [Data Model](./DATA_MODEL.md#6-update-check-model) |
| `diff` | Compare generated context with current project state | [CLI_SPEC](./CLI_SPEC.md#4-diff), [Requirements](./REQUIREMENTS.md#fr-diff) |
| `ci` | Generate GitHub Actions workflow | [CLI_SPEC](./CLI_SPEC.md#5-ci), [Requirements](./REQUIREMENTS.md#fr-ci) |
| `runbook` | Generate a privacy-safe project revival guide | [CLI_SPEC](./CLI_SPEC.md#6-runbook), [Security Model](./SECURITY_MODEL.md) |
| `docker` | Generate local development services | [CLI_SPEC](./CLI_SPEC.md#12-docker), [Requirements](./REQUIREMENTS.md#fr-docker) |
| `revive` | Prepare runbook, local services, and context index | [CLI_SPEC](./CLI_SPEC.md#13-revive), [Requirements](./REQUIREMENTS.md#fr-revive) |
| `doctor` | Check readiness; optionally fix generated context | [CLI_SPEC](./CLI_SPEC.md#7-doctor), [Requirements](./REQUIREMENTS.md#fr-doctor) |
| `prompt` / `p` | Compile rough instructions into agent-ready prompts | [CLI_SPEC](./CLI_SPEC.md#8-prompt--p), [PROMPT_SPEC](./PROMPT_SPEC.md) |
| `config init` | Create `.ready-for-agents.json` | [CLI_SPEC](./CLI_SPEC.md#9-config-init), [Data Model](./DATA_MODEL.md#9-configuration-model) |
| `index` | Build context tree cache | [CLI_SPEC](./CLI_SPEC.md#10-index), [Data Model](./DATA_MODEL.md#10-context-tree-model) |
| `query` | Select relevant generated context sections | [CLI_SPEC](./CLI_SPEC.md#11-query), [Algorithms](./ALGORITHMS.md#5-query-selection) |

---

## Reading Paths

| Reader | Start With |
| --- | --- |
| New contributor | [OVERVIEW.md](./OVERVIEW.md), then [ARCHITECTURE.md](./ARCHITECTURE.md) |
| Product / QA | [REQUIREMENTS.md](./REQUIREMENTS.md), [CLI_SPEC.md](./CLI_SPEC.md), [TEST_STRATEGY.md](./TEST_STRATEGY.md) |
| Detection or generator work | [DETECTION_RULES.md](./DETECTION_RULES.md), [GENERATED_FILES_SPEC.md](./GENERATED_FILES_SPEC.md) |
| Prompt work | [PROMPT_SPEC.md](./PROMPT_SPEC.md), [PROMPT_EXAMPLES.md](./PROMPT_EXAMPLES.md) |
| Security review | [SECURITY_MODEL.md](./SECURITY_MODEL.md), [NON_FUNCTIONAL.md](./NON_FUNCTIONAL.md) |
| Research/algorithm review | [RESEARCH_NOTES.md](./RESEARCH_NOTES.md), [ALGORITHMS.md](./ALGORITHMS.md) |

---

## Full Index

### Product And Requirements

| File | Contents |
| --- | --- |
| [OVERVIEW.md](./OVERVIEW.md) | System definition, scope, command map, and design constraints |
| [REQUIREMENTS.md](./REQUIREMENTS.md) | Functional requirements and acceptance criteria |
| [NON_FUNCTIONAL.md](./NON_FUNCTIONAL.md) | Performance, security, reliability, compatibility, and maintainability |
| [ROADMAP.md](./ROADMAP.md) | Shipped features, planned features, and versioning policy |

### Research And Algorithms

| File | Contents |
| --- | --- |
| [RESEARCH_NOTES.md](./RESEARCH_NOTES.md) | Research framing, hypotheses, and evaluation strategy |
| [ALGORITHMS.md](./ALGORITHMS.md) | Detection, marker validation, context tree, query, and prompt algorithms |
| [SECURITY_MODEL.md](./SECURITY_MODEL.md) | Trust boundaries, secret handling, and future safety requirements |

### Interface And Data

| File | Contents |
| --- | --- |
| [CLI_SPEC.md](./CLI_SPEC.md) | Subcommands, flags, output, JSON contracts, and exit codes |
| [DATA_MODEL.md](./DATA_MODEL.md) | ProjectContext, generated files, config, env scan, context tree, and prompt data |
| [PROMPT_SPEC.md](./PROMPT_SPEC.md) | Prompt compiler pipeline and output contract |

### Domain And Output

| File | Contents |
| --- | --- |
| [DETECTION_RULES.md](./DETECTION_RULES.md) | Package manager, stack, script, folder, and environment detection |
| [GENERATED_FILES_SPEC.md](./GENERATED_FILES_SPEC.md) | Generated Markdown/YAML files and generated markers |

### Engineering

| File | Contents |
| --- | --- |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Layers, dependency direction, command pipelines, and extension points |
| [SRC_WORKFLOW.md](./SRC_WORKFLOW.md) | Source tree walkthrough and file-to-feature map |
| [TEST_STRATEGY.md](./TEST_STRATEGY.md) | Test layers, fixtures, required cases, and quality gates |
| [adr/](./adr/) | Architecture Decision Records |

### Reference

| File | Contents |
| --- | --- |
| [GLOSSARY.md](./GLOSSARY.md) | Shared terminology |
| [PROMPT_EXAMPLES.md](./PROMPT_EXAMPLES.md) | Multilingual prompt examples used as deterministic rule-tuning cases |

---

## Recommended Reading Order

1. [OVERVIEW.md](./OVERVIEW.md)
2. [RESEARCH_NOTES.md](./RESEARCH_NOTES.md)
3. [ALGORITHMS.md](./ALGORITHMS.md)
4. [REQUIREMENTS.md](./REQUIREMENTS.md)
5. [CLI_SPEC.md](./CLI_SPEC.md)
6. [DATA_MODEL.md](./DATA_MODEL.md)
7. [ARCHITECTURE.md](./ARCHITECTURE.md)
8. [DETECTION_RULES.md](./DETECTION_RULES.md)
9. [GENERATED_FILES_SPEC.md](./GENERATED_FILES_SPEC.md)
10. [SECURITY_MODEL.md](./SECURITY_MODEL.md)
11. [SRC_WORKFLOW.md](./SRC_WORKFLOW.md)

---

## Documentation Status

| Code version | Documentation coverage |
| --- | --- |
| v0.2.x | `init`, `update`, `diff`, `ci`, `runbook`, `docker`, `revive`, `doctor`, `prompt`, `config`, `index`, `query`, generated files, algorithms, and security model |

When behavior changes, update the relevant requirements, CLI spec, data model, detection rules, generated file spec, and tests in the same change set.
