# Detection Rules

All detection rules are static. The CLI does not run package manager commands, builds, tests, or AI APIs to infer project facts.

Implementation lives in `src/detectors/` and `src/constants.ts`.

---

## 1. Package Manager

Detection priority:

```text
lockfile → package.json packageManager field → npm fallback
```

### Lockfile Order

| Order | File | Package Manager |
| --- | --- | --- |
| 1 | `pnpm-lock.yaml` | pnpm |
| 2 | `yarn.lock` | yarn |
| 3 | `bun.lockb` | bun |
| 4 | `bun.lock` | bun |
| 5 | `package-lock.json` | npm |

Only file presence is checked; lockfile contents are not parsed.

### `packageManager` Field

Values such as `"pnpm@10.12.4"` are parsed by taking the package manager name before the first `@`.

Supported names: `npm`, `pnpm`, `yarn`, `bun`.

If no evidence exists, the result is `npm` with source `fallback`.

---

## 2. Stack Detection

Stack detection merges `dependencies` and `devDependencies`, then evaluates ordered rule tables for each layer.

First matching rule wins.

### Frontend Rules

| Dependencies | Label |
| --- | --- |
| `next` | Next.js |
| `nuxt` | Nuxt |
| `vite`, `react` | React/Vite |
| `vite`, `vue` | Vue/Vite |
| `react-scripts` | React (CRA) |
| `react` | React |
| `vue` | Vue |
| `svelte` | Svelte |

### Backend Rules

| Dependencies | Label |
| --- | --- |
| `@nestjs/core` | NestJS |
| `express` | Express |
| `fastify` | Fastify |
| `koa` | Koa |
| `hono` | Hono |

### Database Rules

| Dependencies | Label |
| --- | --- |
| `mongoose` | MongoDB/Mongoose |
| `mongodb` | MongoDB |
| `@prisma/client` | Prisma |
| `prisma` | Prisma |
| `typeorm` | TypeORM |
| `pg` | PostgreSQL |
| `mysql2` | MySQL |
| `better-sqlite3` | SQLite |
| `ioredis` | Redis |
| `redis` | Redis |

---

## 3. Script Detection

Logical script keys:

```text
dev | build | test | lint | typecheck | format
```

Aliases are evaluated in order. Example:

| Key | Aliases |
| --- | --- |
| `dev` | `dev`, `start:dev`, `develop` |
| `test` | `test`, `test:unit`, `test:run` |
| `typecheck` | `typecheck`, `type-check`, `check:types` |

Related dev scripts are detected from:

1. script names starting with `dev:`;
2. script references inside the main `dev` command, such as `npm run dev:server`.

---

## 4. Important Folders

Root folder names checked:

```text
src, app, pages, components, lib, tests
```

The detector only checks the project root. It does not recursively scan the repository.

Ignored directory names:

```text
node_modules, .git, .ready-for-agents, dist, build, .next, coverage
```

---

## 5. README Detection

`hasReadme(cwd)` checks for `README.md` or `README.MD` at the project root.

---

## 6. Environment Detection For `runbook`

Implementation: `src/detectors/environment.ts`.

### Sources That May Be Read

| Source | Rule |
| --- | --- |
| `.env.example`, `.env.sample`, `.env.template`, `.env.default`, `.env.dist` | Parse variable names on the left side of `=`; ignore values |
| Source code in known roots | Extract static references such as `process.env.NAME`, `process.env["NAME"]`, `import.meta.env.NAME`, and `Deno.env.get("NAME")` |

### Sources That Must Not Be Read For Values

| Source | Rule |
| --- | --- |
| `.env`, `.env.local`, `.env.production`, `.env.development`, `.env.test` | Record filename only |
| Any `.env*` file that is not clearly a template | Record filename only |

### Safety Limits

- Ignored directories are skipped.
- Source file count and file size are bounded.
- Results contain variable names, sources, and sensitivity signals, never values.

---

## 7. Local Service Detection For `docker` / `revive`

Implementation: `src/detectors/services.ts`.

The local service detector is intentionally stricter than stack detection. It generates Docker Compose services only when the dependency or Prisma datasource provider is specific enough.

| Evidence | Generated Service |
| --- | --- |
| `mongoose`, `mongodb` | MongoDB |
| `pg` | PostgreSQL |
| `mysql2` | MySQL |
| `redis`, `ioredis` | Redis |
| Prisma `provider = "mongodb"` | MongoDB |
| Prisma `provider = "postgresql"` | PostgreSQL |
| Prisma `provider = "mysql"` | MySQL |
| Prisma `provider = "sqlite"` | No external service |
| `typeorm` without a specific driver | No service; emit a note |

Safety rules:

- Do not read `.env` values.
- Do not infer a database from vague framework dependencies alone.
- Do not generate a service for unsupported providers.
- Prefer no compose file over a confident-looking wrong compose file.

---

## 8. Updating Detection Rules

When adding or changing a rule:

1. update the detector module;
2. add or update focused tests;
3. update this document;
4. update generated file specs if output changes.
