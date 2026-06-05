export type PromptSource = "argument" | "stdin" | "file" | "interactive";
export type PromptTarget = "auto" | "en" | "vi";
export type PromptStyle = "standard" | "compact";

/** MVP intents; `compare`, `plan`, `implement` reserved for later. */
export type PromptIntent =
  | "explain"
  | "review"
  | "fix"
  | "verify"
  | "clarify"
  | "general";

export type PromptStats = {
  originalChars: number;
  outputChars: number;
  charReductionPercent: number;
  originalWords?: number;
  outputWords?: number;
  estimatedTokens?: number;
};

export type PromptContextReference = {
  file: string;
  heading: string;
  anchor: string;
  lineStart: number;
  lineEnd: number;
  summary: string;
  tokensEstimate: number;
  commands: string[];
  reasons: string[];
};

export type PromptBrief = {
  source: PromptSource;
  target: PromptTarget;
  style: PromptStyle;
  original: string;
  intent: PromptIntent;
  task: string;
  relevantContext: PromptContextReference[];
  contextSource?: "cache" | "live";
  contextTreePath?: string;
  context: string[];
  requirements: string[];
  constraints: string[];
  verify: string[];
  unclear: string[];
  response: string[];
  stats: PromptStats;
};

export type PromptOptions = {
  text?: string;
  stdin?: boolean;
  file?: string;
  cwd?: string;
  target?: PromptTarget | string;
  context?: boolean;
  compact?: boolean;
  style?: PromptStyle | string;
  contextLimit?: number | string;
  json?: boolean;
  stats?: boolean;
};

export type PromptJsonOutput = {
  target: PromptTarget;
  style: PromptStyle;
  intent: PromptIntent;
  task: string;
  relevantContext: PromptContextReference[];
  contextSource?: "cache" | "live";
  contextTreePath?: string;
  context: string[];
  requirements: string[];
  constraints: string[];
  verify: string[];
  unclear: string[];
  response: string[];
};

export type PromptRenderFormat = "markdown" | "json";
