import type {
  ContextTree,
  ContextTreeFile,
  ContextTreeSection,
} from "../indexer/context-tree.js";

export type QueryMatch = {
  file: ContextTreeFile["path"];
  sectionId: string;
  heading: string;
  anchor: string;
  lineStart: number;
  lineEnd: number;
  score: number;
  tokensEstimate: number;
  importance: ContextTreeSection["importance"];
  summary: string;
  commands: string[];
  reasons: string[];
};

export type SelectContextOptions = {
  limit?: number;
};

type QueryIntent = {
  rules: boolean;
  stack: boolean;
  commands: boolean;
  verify: boolean;
  tree: boolean;
  prompt: boolean;
  publish: boolean;
};

const DEFAULT_LIMIT = 6;
const MIN_SCORE = 4;

const STOPWORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "be",
  "can",
  "cho",
  "co",
  "cua",
  "de",
  "do",
  "duoc",
  "gi",
  "hay",
  "help",
  "how",
  "i",
  "is",
  "la",
  "lam",
  "me",
  "mot",
  "my",
  "nen",
  "of",
  "on",
  "or",
  "the",
  "thi",
  "this",
  "to",
  "toi",
  "trong",
  "va",
  "voi",
  "what",
  "why",
]);

const SYNONYMS: Record<string, string[]> = {
  agent: ["agents", "workflow", "rules", "context"],
  build: ["verify", "verification"],
  cache: ["index", "tree", "context"],
  cau: ["structure", "task", "prompt"],
  chay: ["run", "command", "script"],
  check: ["verify", "test", "doctor"],
  chinh: ["correct", "verify"],
  command: ["commands", "script", "run"],
  context: ["tree", "index", "sections"],
  doctor: ["readiness", "check", "verify", "fix"],
  dung: ["correct", "verify"],
  file: ["files", "markdown", "generated"],
  fix: ["update", "repair", "doctor"],
  framework: ["stack", "frontend", "backend"],
  generate: ["init", "generated", "files"],
  github: ["repository", "homepage", "bugs", "publish"],
  graph: ["tree", "index", "context"],
  huong: ["guide", "workflow", "commands"],
  index: ["tree", "cache", "context"],
  init: ["generate", "generated", "files"],
  kiem: ["check", "verify", "test", "doctor"],
  lenh: ["command", "commands", "script", "prompt"],
  loi: ["bug", "error", "fix"],
  markdown: ["md", "files", "generated"],
  md: ["markdown", "files", "generated"],
  npm: ["package", "publish", "repository", "homepage"],
  package: ["npm", "publish", "repository"],
  prompt: ["instruction", "task", "requirements", "response"],
  promt: ["prompt", "instruction", "task"],
  publish: ["npm", "package", "repository", "homepage"],
  query: ["select", "context", "sections"],
  readme: ["docs", "repository", "homepage"],
  rule: ["rules", "agents", "workflow"],
  script: ["scripts", "command", "commands"],
  sua: ["fix", "update", "refresh"],
  tao: ["generate", "init", "files"],
  test: ["verify", "verification", "vitest"],
  tests: ["verify", "verification", "vitest"],
  tree: ["index", "cache", "context", "sections"],
  toi: ["optimize", "improve"],
  token: ["tokens", "context", "compact"],
  tra: ["check", "verify", "test"],
  update: ["refresh", "generated", "files"],
  verify: ["test", "build", "check"],
  xac: ["correct", "verify"],
};

export function selectContextSections(
  tree: ContextTree,
  query: string,
  options: SelectContextOptions = {},
): QueryMatch[] {
  const limit = clampLimit(options.limit);
  const queryTokens = tokenize(query);
  const expandedTokens = expandTokens(queryTokens);
  const intent = inferIntent(new Set([...queryTokens, ...expandedTokens]));

  const matches = flattenSections(tree)
    .map(({ file, section }) =>
      scoreSection(file, section, expandedTokens, intent),
    )
    .filter((match) => match.score >= MIN_SCORE)
    .sort(compareMatches);

  const selected =
    matches.length > 0 ? matches : fallbackMatches(tree).sort(compareMatches);

  return selected.slice(0, limit);
}

function scoreSection(
  file: ContextTreeFile,
  section: ContextTreeSection,
  tokens: string[],
  intent: QueryIntent,
): QueryMatch {
  let score = importanceScore(section.importance);
  const reasons = new Set<string>();
  const fileTokens = new Set(tokenize(file.path));
  const headingTokens = new Set(tokenize(section.heading));
  const summaryTokens = new Set(tokenize(section.summary));
  const keywordTokens = new Set(section.keywords);
  const commandTokens = new Set(
    section.commands.flatMap((cmd) => tokenize(cmd)),
  );

  for (const token of tokens) {
    if (headingTokens.has(token)) {
      score += 9;
      reasons.add("heading match");
    }
    if (keywordTokens.has(token)) {
      score += 7;
      reasons.add("keyword match");
    }
    if (commandTokens.has(token)) {
      score += 6;
      reasons.add("command match");
    }
    if (summaryTokens.has(token)) {
      score += 4;
      reasons.add("summary match");
    }
    if (fileTokens.has(token)) {
      score += 3;
      reasons.add("file match");
    }
  }

  score += intentBoost(file, section, intent, reasons);

  return {
    file: file.path,
    sectionId: section.id,
    heading: section.heading,
    anchor: section.anchor,
    lineStart: section.lineStart,
    lineEnd: section.lineEnd,
    score,
    tokensEstimate: section.tokensEstimate,
    importance: section.importance,
    summary: section.summary,
    commands: section.commands,
    reasons: [...reasons],
  };
}

function intentBoost(
  file: ContextTreeFile,
  section: ContextTreeSection,
  intent: QueryIntent,
  reasons: Set<string>,
): number {
  let score = 0;
  const heading = section.heading.toLowerCase();

  if (intent.rules && file.path === "AGENTS.md") {
    score += 8;
    reasons.add("agent rules context");
  }
  if (intent.stack && file.path === "PROJECT_CONTEXT.md") {
    score += 8;
    reasons.add("stack context");
  }
  if (intent.commands && file.path === "COMMANDS.md") {
    score += 8;
    reasons.add("command context");
  }
  if (
    intent.verify &&
    (heading.includes("test") ||
      heading.includes("build") ||
      heading.includes("typecheck") ||
      heading.includes("testing"))
  ) {
    score += 10;
    reasons.add("verification context");
  }
  if (
    intent.tree &&
    (heading.includes("agent context") || heading.includes("context index"))
  ) {
    score += 10;
    reasons.add("context-tree workflow");
  }
  if (
    intent.prompt &&
    (heading.includes("agent context") || heading.includes("how to work"))
  ) {
    score += 6;
    reasons.add("prompt workflow");
  }
  if (intent.publish && file.path === "PROJECT_CONTEXT.md") {
    score += 4;
    reasons.add("project metadata context");
  }

  return score;
}

function fallbackMatches(tree: ContextTree): QueryMatch[] {
  const preferred = new Set([
    "Project Goal",
    "How To Work In This Repo",
    "Agent Context Workflow",
    "Stack",
    "Package Manager",
    "Development",
    "Build",
    "Test",
    "Testing Expectations",
  ]);

  return flattenSections(tree)
    .filter(
      ({ section }) =>
        section.importance === "high" || preferred.has(section.heading),
    )
    .map(({ file, section }) => ({
      file: file.path,
      sectionId: section.id,
      heading: section.heading,
      anchor: section.anchor,
      lineStart: section.lineStart,
      lineEnd: section.lineEnd,
      score: importanceScore(section.importance),
      tokensEstimate: section.tokensEstimate,
      importance: section.importance,
      summary: section.summary,
      commands: section.commands,
      reasons: ["fallback high-value context"],
    }));
}

function flattenSections(
  tree: ContextTree,
): Array<{ file: ContextTreeFile; section: ContextTreeSection }> {
  return tree.files.flatMap((file) =>
    file.exists
      ? file.sections.map((section) => ({
          file,
          section,
        }))
      : [],
  );
}

function compareMatches(a: QueryMatch, b: QueryMatch): number {
  return (
    b.score - a.score ||
    importanceScore(b.importance) - importanceScore(a.importance) ||
    a.tokensEstimate - b.tokensEstimate ||
    a.file.localeCompare(b.file) ||
    a.lineStart - b.lineStart
  );
}

function importanceScore(importance: ContextTreeSection["importance"]): number {
  switch (importance) {
    case "high":
      return 6;
    case "medium":
      return 3;
    case "low":
    default:
      return 1;
  }
}

function expandTokens(tokens: string[]): string[] {
  const expanded = new Set<string>();
  for (const token of tokens) {
    expanded.add(token);
    for (const synonym of SYNONYMS[token] ?? []) {
      expanded.add(synonym);
    }
  }
  return [...expanded];
}

function inferIntent(tokens: Set<string>): QueryIntent {
  return {
    rules: hasAny(tokens, ["agent", "agents", "rule", "rules", "workflow"]),
    stack: hasAny(tokens, [
      "stack",
      "framework",
      "database",
      "dependencies",
      "frontend",
      "backend",
    ]),
    commands: hasAny(tokens, [
      "command",
      "commands",
      "script",
      "scripts",
      "run",
      "chay",
      "lenh",
    ]),
    verify: hasAny(tokens, [
      "verify",
      "verification",
      "check",
      "test",
      "tests",
      "build",
      "typecheck",
      "doctor",
      "kiem",
      "tra",
    ]),
    tree: hasAny(tokens, ["tree", "index", "cache", "context", "token"]),
    prompt: hasAny(tokens, ["prompt", "promt", "instruction", "task"]),
    publish: hasAny(tokens, [
      "npm",
      "publish",
      "package",
      "github",
      "repository",
      "homepage",
    ]),
  };
}

function hasAny(tokens: Set<string>, candidates: string[]): boolean {
  return candidates.some((candidate) => tokens.has(candidate));
}

function tokenize(text: string): string[] {
  return normalizeSearchText(text)
    .split(/\s+/u)
    .filter((token) => token.length >= 2 && !STOPWORDS.has(token));
}

function normalizeSearchText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/gu, "")
    .replace(/[^a-z0-9]+/gu, " ")
    .trim();
}

function clampLimit(value: number | undefined): number {
  if (value === undefined || Number.isNaN(value)) return DEFAULT_LIMIT;
  return Math.min(20, Math.max(1, Math.floor(value)));
}
