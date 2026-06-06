# Security And Privacy Model

`ready-for-agents` is designed around a simple safety principle:

> The tool may describe how to work with a project, but it should not expose private project data or mutate user-authored files without consent.

This document describes the current security model and the boundaries future features should preserve.

---

## 1. Trust Boundaries

| Boundary | Policy |
| --- | --- |
| User repository | Read only the files required for static detection and generation |
| Existing user files | Preserve by default; overwrite only with `--force` |
| Environment files | Do not read secret values from `.env*` non-template files |
| Network | Core CLI paths do not call network or AI APIs |
| Generated output | Add markers so refresh commands can distinguish generated files from user files |

---

## 2. File Write Safety

Generated files use safe write semantics:

```text
file missing → create
file exists + no --force → skip
file exists + --force → overwrite
```

`update` and `doctor --fix` are stricter. They refresh files only when a valid generated marker proves the file belongs to `ready-for-agents`.

This protects files that users write or edit manually.

---

## 3. Secret Handling

### Deny By Default

These files are treated as sensitive:

- `.env`
- `.env.local`
- `.env.production`
- `.env.development`
- `.env.test`
- any `.env*` file that is not clearly a template

For these files, `runbook` records only that the file exists. It does not read or print values.

### Safe Templates

Template files such as `.env.example`, `.env.sample`, `.env.template`, `.env.default`, and `.env.dist` are considered safe enough for variable-name extraction.

Only the key on the left side of `=` is used. Values are ignored.

---

## 4. Prompt And Context Safety

`prompt --context` and `query` use generated context files and context tree metadata. They should not include raw `.env` values because `.env*` non-template files are not part of generated context.

Future features must preserve this rule:

```text
context files may mention required variable names
context files must not contain secret values
```

---

## 5. Threat Scenarios

| Scenario | Mitigation |
| --- | --- |
| User has production `.env` in repo root | File is detected as sensitive but not read |
| User edited `AGENTS.md` manually | Marker hash no longer matches; `update` skips it |
| AI agent asks for full context | `query` can select sections before full reads |
| CI runs freshness check | `diff --json` reports stale files without writing |
| Future Docker/seed feature needs env | Use placeholders and generated TODOs, never real env values |

---

## 6. Future Security Requirements

Planned features such as Docker and seed generation must follow these rules:

1. Do not read secret values by default.
2. Do not infer credentials.
3. Do not run containers or migrations automatically.
4. Generate placeholders instead of secrets.
5. Keep `--dry-run` as the recommended first step.
6. Require `--force` before overwriting existing operational files.

---

## 7. Non-Goals

The current CLI is not:

- a secret scanner
- a dependency vulnerability scanner
- a sandbox for running untrusted project code
- an AI model or AI API proxy

Its safety goal is narrower: deterministic context generation without unnecessary mutation or secret exposure.
