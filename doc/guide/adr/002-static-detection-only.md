# ADR-002: Static Detection Only In The Core Path

## Status

Accepted

## Context

The product goal is to make a repository useful to AI agents in under 30 seconds.

The core path should be:

- fast;
- offline-friendly;
- deterministic;
- testable;
- usable without API keys or credentials.

Running package manager commands, build scripts, or AI summarization during basic context generation would make the CLI slower, more expensive, and less predictable.

## Decision

Core detection reads only static project artifacts:

- `package.json`;
- lockfile presence;
- dependency keys;
- known root folder names;
- generated context files;
- safe environment variable names for `runbook`.

Generators use deterministic TypeScript logic and template strings.

Optional AI features may be added later, but they must be explicit opt-in paths and not part of the default core behavior.

## Consequences

### Positive

- Fast and reproducible behavior.
- Offline operation.
- Easy fixture-based tests.
- No API cost or credential requirement.

### Negative

- The tool cannot infer architecture that is not visible in static metadata.
- Users may need to edit generated files or improve README/project structure for richer context.
