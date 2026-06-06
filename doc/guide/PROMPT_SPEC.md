# Prompt Command Specification

`rfa prompt` turns rough instructions into compact, structured, agent-ready prompts.

The command is deterministic and does not call an AI API.

---

## 1. Output Sections

| Section | Meaning |
| --- | --- |
| Task | The main action the agent should perform |
| Context | Facts explicitly stated by the user |
| Requirements | Requested details or deliverables |
| Constraints | Limits, rules, or things to avoid |
| Verify | Commands or checks the agent should run |
| Unclear / Needs Clarification | Missing or ambiguous details |
| Response | How the agent should answer |

Empty sections are omitted.

---

## 2. Principles

1. Do not invent capabilities.
2. Preserve the user's intent.
3. Put uncertain details in `Unclear`.
4. Treat questions as tasks for explanation, not as answers to fabricate.
5. Add verification guidance when the task implies code changes.
6. Keep the result compact enough to paste into an agent.

---

## 3. CLI

| Command | Description |
| --- | --- |
| `rfa prompt "<text>"` | Read instruction from an argument |
| `rfa prompt --stdin` | Read instruction from stdin |
| `rfa prompt --file <path>` | Read instruction from a file |
| `rfa prompt --cwd <path>` | Read project config and optional context |
| `rfa p "<text>"` | Short alias with context + compact defaults |

| Flag | Description |
| --- | --- |
| `--target <auto\|en\|vi>` | Response language instruction |
| `--json` | Print JSON instead of Markdown |
| `--stats` | Print size stats to stderr |
| `--context` | Include relevant context sections |
| `--compact` | Render shorter output |
| `--context-limit <number>` | Limit relevant context sections |

Exit code is `0` on success and `1` for empty input, invalid target, invalid file input, or conflicting input sources.

---

## 4. Target Language

`--target` is rule-based. It does not translate the full prompt.

| Value | Behavior |
| --- | --- |
| `auto` | Detect Vietnamese signals and choose response guidance accordingly |
| `en` | Ask the downstream agent to answer in English |
| `vi` | Ask the downstream agent to answer in Vietnamese |

If omitted, config `prompt.target` is used, then `auto`.

---

## 5. Pipeline

```text
readPromptInput
  → normalizePromptText
  → segmentPromptText
  → classifyPromptIntent
  → extractPromptBrief
  → renderPromptBrief
```

| Module | Role |
| --- | --- |
| `input.ts` | argument, stdin, file, interactive input |
| `normalize.ts` | whitespace and safe filler cleanup |
| `segment.ts` | sentence/segment splitting and command extraction |
| `classify.ts` | intent classification |
| `extract.ts` | `PromptBrief` construction |
| `context.ts` | relevant context lookup |
| `render.ts` | Markdown and JSON rendering |
| `stats.ts` | size and token estimates |

---

## 6. Data Model

```ts
type PromptIntent =
  | "explain"
  | "review"
  | "fix"
  | "verify"
  | "clarify"
  | "general";

type PromptBrief = {
  source: PromptSource;
  target: "auto" | "en" | "vi";
  original: string;
  intent: PromptIntent;
  task: string;
  context: string[];
  requirements: string[];
  constraints: string[];
  verify: string[];
  unclear: string[];
  response: string[];
  stats: PromptStats;
};
```

---

## 7. Examples

### Explain

Input:

```text
Explain why `rfa prompt` is useful and how it is structured.
```

Expected signals:

- Task asks for explanation.
- Requirements include purpose, usage, structure, and limitations.
- Response should be concrete and project-aware.

### Fix

Input:

```text
fix doctor --json output and run pnpm test
```

Expected signals:

- Task asks for a code change.
- Verify includes `pnpm test`.
- Response should summarize changes and verification.

### Clarify

Input:

```text
make this better
```

Expected signals:

- Task is vague.
- `Unclear` asks what "this" refers to and what "better" means.

---

## 8. Roadmap

| Version | Item |
| --- | --- |
| v0.2.x | Context + compact defaults |
| v0.3.x | Style profiles, token budget polish |
| Later | Optional AI rewrite, additional intents |
