import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { ProjectContext } from "../types.js";

export type LocalServiceId = "mongodb" | "postgresql" | "mysql" | "redis";

export type LocalService = {
  id: LocalServiceId;
  label: string;
  image: string;
  port: number;
  volumeSuffix: string;
  envHints: string[];
};

export type LocalServicePlan = {
  services: LocalService[];
  notes: string[];
};

const SERVICE_ORDER: LocalServiceId[] = [
  "postgresql",
  "mysql",
  "mongodb",
  "redis",
];

export function detectLocalServices(ctx: ProjectContext): LocalServicePlan {
  const allDeps = { ...ctx.dependencies, ...ctx.devDependencies };
  const ids = new Set<LocalServiceId>();
  const notes: string[] = [];

  if (hasAny(allDeps, ["mongoose", "mongodb"])) ids.add("mongodb");
  if (hasAny(allDeps, ["pg"])) ids.add("postgresql");
  if (hasAny(allDeps, ["mysql2"])) ids.add("mysql");
  if (hasAny(allDeps, ["redis", "ioredis"])) ids.add("redis");

  if (hasAny(allDeps, ["@prisma/client", "prisma"])) {
    const provider = readPrismaProvider(ctx.cwd);
    switch (provider) {
      case "mongodb":
        ids.add("mongodb");
        break;
      case "postgresql":
      case "postgres":
        ids.add("postgresql");
        break;
      case "mysql":
        ids.add("mysql");
        break;
      case "sqlite":
        notes.push("Prisma uses SQLite; no database service is required.");
        break;
      case undefined:
        notes.push(
          "Prisma was detected, but no datasource provider was found in prisma/schema.prisma.",
        );
        break;
      default:
        notes.push(
          `Prisma provider \`${provider}\` is not supported by the Docker generator yet.`,
        );
        break;
    }
  }

  if (hasAny(allDeps, ["typeorm"]) && ids.size === 0) {
    notes.push(
      "TypeORM was detected, but the database driver was not specific enough to generate a safe compose service.",
    );
  }

  if (ctx.stack.database?.label === "SQLite") {
    notes.push(
      "SQLite was detected; no external database service is required.",
    );
  }

  return {
    services: SERVICE_ORDER.filter((id) => ids.has(id)).map(serviceFromId),
    notes,
  };
}

function hasAny(deps: Record<string, string>, names: string[]): boolean {
  return names.some((name) => deps[name] !== undefined);
}

function readPrismaProvider(cwd: string): string | undefined {
  const schemaPath = join(cwd, "prisma", "schema.prisma");
  if (!existsSync(schemaPath)) return undefined;

  try {
    const content = readFileSync(schemaPath, "utf-8");
    const match = /\bprovider\s*=\s*"([^"]+)"/u.exec(content);
    return match?.[1]?.trim().toLowerCase();
  } catch {
    return undefined;
  }
}

function serviceFromId(id: LocalServiceId): LocalService {
  switch (id) {
    case "mongodb":
      return {
        id,
        label: "MongoDB",
        image: "mongo:7",
        port: 27017,
        volumeSuffix: "mongodb_data",
        envHints: ["MONGODB_URI=mongodb://localhost:27017/<database>"],
      };
    case "postgresql":
      return {
        id,
        label: "PostgreSQL",
        image: "postgres:16-alpine",
        port: 5432,
        volumeSuffix: "postgres_data",
        envHints: [
          "DATABASE_URL=postgresql://app:local_dev_password@localhost:5432/<database>",
        ],
      };
    case "mysql":
      return {
        id,
        label: "MySQL",
        image: "mysql:8",
        port: 3306,
        volumeSuffix: "mysql_data",
        envHints: [
          "DATABASE_URL=mysql://app:local_dev_password@localhost:3306/<database>",
        ],
      };
    case "redis":
      return {
        id,
        label: "Redis",
        image: "redis:7-alpine",
        port: 6379,
        volumeSuffix: "redis_data",
        envHints: ["REDIS_URL=redis://localhost:6379"],
      };
  }
}
