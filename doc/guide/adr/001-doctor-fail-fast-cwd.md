# ADR-001: Doctor Fails Fast For Invalid `--cwd`

## Status

Accepted

## Context

Users may run:

```bash
rfa doctor --cwd /wrong/path
```

If `doctor` continued through every check, missing `package.json`, missing context files, and missing scripts would all be reported even though the real problem is simply that the directory does not exist or is not a project directory.

That output would be noisy and misleading.

## Decision

`runDoctorChecks` validates cwd before all other checks:

1. if the path does not exist, return one failing check labeled `Project directory found`;
2. if the path exists but is not a directory, return one failing check labeled `Project directory is a directory`.

No package manager detection, context-file checks, or script checks run after an invalid cwd.

## Consequences

### Positive

- The root cause is immediately visible.
- JSON output is easier for CI to interpret.
- False secondary warnings are avoided.

### Negative

- Users get less information in one run, but that information would not be meaningful until cwd is fixed.
