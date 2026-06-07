# Algorithms And Techniques

This document explains the main algorithms and deterministic techniques used by `ready-for-agents`.

The implementation intentionally favors simple, inspectable algorithms over opaque inference. This makes the CLI easier to test, debug, and trust.

---

## 1. Static Project Detection

### Package Manager Detection

Package manager detection is an ordered evidence problem.

```text
lockfile evidence → package.json packageManager field → npm fallback
```

The order matters because lockfiles are strong local evidence. A fallback is labeled as fallback so generated files do not overstate certainty.

### Stack Detection

Stack detection uses rule tables over `dependencies + devDependencies`.

```text
for each layer in frontend/backend/database:
  for each rule in orderedRules:
    if all rule dependencies exist:
      return rule label
  return undefined
```

This is a first-match algorithm. It is intentionally conservative:

- it does not run package manager commands
- it does not inspect installed transitive dependencies
- it does not infer a framework from filenames alone

Complexity is `O(R * D)` where `R` is the number of rules and `D` is the number of dependencies in a rule. In practice, rule size is tiny.

---

## 2. Script Alias Resolution

Script extraction maps many package script names into a stable logical vocabulary.

| Logical key | Examples |
| --- | --- |
| `dev` | `dev`, `start:dev`, `develop` |
| `test` | `test`, `test:unit`, `test:run` |
| `typecheck` | `typecheck`, `type-check`, `check:types` |

The algorithm chooses the first matching alias for each logical key. Related development scripts are discovered from:

1. script names with a `dev:` prefix
2. script references inside the main `dev` command, such as `npm run dev:server`

This keeps `COMMANDS.md` and `RUNBOOK.md` close to the real project workflow.

---

## 3. Generated Marker And Freshness

Generated Markdown and YAML files include a small marker with a content hash.

```text
ready-for-agents:generated file="<output-file>" hash="<sha256-prefix>"
```

The freshness algorithm is:

```text
expected = generate current output
current = read file from disk

if file missing:
  missing
else if current === expected:
  upToDate
else if marker exists and hash matches stripped current body:
  outdated
else:
  untracked
```

The key property is that user-authored files are protected. If a user edits a generated file manually, the stored hash no longer matches the body, so the file becomes `untracked` and is skipped unless the user explicitly passes `--force`.

---

## 4. Context Tree Construction

`rfa index` reads known generated files and turns Markdown structure into a compact JSON tree.

For each output file:

1. Read the file if it exists.
2. Parse Markdown headings.
3. Convert each heading block into a section.
4. Extract commands from fenced code blocks and inline command snippets.
5. Extract keywords with stopword filtering.
6. Estimate tokens from word count.
7. Hash each section body.

The resulting tree lets agents inspect section metadata before reading entire documents.

### Section Importance

Importance is rule-based. Sections about project goals, stack, commands, verification, and safety are marked higher than secondary notes.

This is not semantic ranking. It is deterministic prioritization designed for predictable behavior.

---

## 5. Query Selection

`rfa query` ranks context tree sections for a user task.

Conceptually:

```text
queryTokens = tokenize(user query)
for each section:
  score = keyword overlap + command relevance + heading relevance
return top sections by score
```

The goal is not perfect search. The goal is to choose a small reading set that is better than opening every generated file.

Good matches usually include:

- command sections for verification tasks
- stack sections for architecture questions
- safety sections for file editing tasks
- prompt sections for prompt-related questions

---

## 6. Prompt Normalization Pipeline

`rfa prompt` is a deterministic prompt compiler.

```text
input → normalize → segment → classify → extract → render
```

### Normalize

Normalizes whitespace and removes light filler without changing technical intent.

### Segment

Splits instruction text into manageable clauses while preserving technical tokens such as `package.json` and command names.

### Classify

Classifies intent into:

```text
explain | review | fix | verify | clarify | general
```

### Extract

Builds a `PromptBrief` with task, requirements, constraints, verification, unclear items, and response guidance.

### Render

Outputs Markdown or JSON. Empty sections are omitted to keep the prompt compact.

---

## 7. Privacy-Safe Environment Detection

`rfa runbook` needs environment variable names but must not leak values.

The detector follows a strict rule:

```text
safe templates: parse variable names only
sensitive .env files: record filename only
source code: extract static env references only
```

Examples of source patterns:

```ts
process.env.MONGODB_URI
process.env["JWT_SECRET"]
import.meta.env.VITE_API_URL
```

No environment values are stored in the detection result.

---

## 8. Complexity Summary

## 8. Local Service Detection

`rfa docker` and `rfa revive` use a deterministic evidence map:

```text
specific dependency or Prisma provider → supported local service
ambiguous dependency → note, no compose service
```

This is intentionally stricter than stack detection. For example, `typeorm` alone does not identify PostgreSQL vs MySQL vs SQLite, so the Docker generator skips service generation and emits a note.

The generated compose file uses local placeholders and fixed local development credentials. It does not interpolate values from `.env`, so running the generator cannot expose secrets.

---

## 9. Complexity Summary

| Component | Main input | Approximate complexity |
| --- | --- | --- |
| Package manager detection | fixed lockfile list | `O(1)` |
| Stack detection | dependency rules | `O(R)` for small rule tables |
| Script detection | package scripts | `O(S)` |
| Local service detection | dependencies + optional Prisma schema | `O(D)` plus one bounded schema read |
| Marker validation | selected generated files | `O(F * fileSize)` |
| Context tree | generated Markdown files | `O(total generated text)` |
| Query | tree sections | `O(Q * N)` token overlap |
| Runbook env scan | bounded source files | `O(min(files, limit) * fileSize)` |

The design keeps expensive work bounded and explicit.
