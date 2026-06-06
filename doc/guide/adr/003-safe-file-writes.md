# ADR-003: Safe File Writes By Default

## Status

Accepted

## Context

After running `init`, users often edit generated context files by hand. For example, teams may customize `AGENTS.md` with local rules.

If the CLI overwrote those files on every run, it would destroy user work and make the tool unsafe for real repositories.

## Decision

Default write behavior:

- if a target file does not exist, create it;
- if a target file exists and `--force` is not set, skip it;
- if `--dry-run` is set, never write;
- if `--force` is set, overwrite intentionally.

`update` and `doctor --fix` are stricter: they refresh only files with valid generated markers unless `--force` is explicit.

## Consequences

### Positive

- Safe for production repositories.
- Users can preview before writing.
- User-authored files are protected.

### Negative

- Users must explicitly choose refresh behavior.
- A stale context file may remain stale until `update`, `doctor --fix`, or `--force` is used.
