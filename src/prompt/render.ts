import type {
  PromptBrief,
  PromptContextReference,
  PromptJsonOutput,
  PromptRenderFormat,
} from "./types.js";

const UNCLEAR_HEADING = "Unclear / Needs Clarification";

function renderMarkdownSection(
  title: string,
  lines: string[],
  bullet: boolean,
): string {
  if (lines.length === 0) return "";
  const body = bullet
    ? lines.map((l) => `- ${l}`).join("\n")
    : lines.join("\n");
  return `## ${title}\n\n${body}`;
}

export function renderPromptBrief(
  brief: PromptBrief,
  format: PromptRenderFormat,
): string {
  if (format === "json") {
    return JSON.stringify(toPromptJson(brief), null, 2);
  }

  if (brief.style === "compact") {
    return renderCompactPromptBrief(brief);
  }

  const sections: string[] = [`## Task\n\n${brief.task}`];

  const optional: Array<{ title: string; lines: string[] }> = [
    { title: "Context", lines: brief.context },
    {
      title: "Relevant Context",
      lines: brief.relevantContext.map(formatContextReference),
    },
    { title: "Requirements", lines: brief.requirements },
    { title: "Constraints", lines: brief.constraints },
    { title: "Verify", lines: brief.verify },
    { title: UNCLEAR_HEADING, lines: brief.unclear },
  ];

  for (const { title, lines } of optional) {
    const block = renderMarkdownSection(title, lines, true);
    if (block) sections.push(block);
  }

  if (brief.response.length > 0) {
    const responseBody =
      brief.response.length === 1
        ? brief.response[0]
        : brief.response.map((r) => `- ${r}`).join("\n");
    sections.push(`## Response\n\n${responseBody}`);
  }

  return sections.join("\n\n") + "\n";
}

export function toPromptJson(brief: PromptBrief): PromptJsonOutput {
  return {
    target: brief.target,
    style: brief.style,
    intent: brief.intent,
    task: brief.task,
    relevantContext: brief.relevantContext,
    contextSource: brief.contextSource,
    contextTreePath: brief.contextTreePath,
    context: brief.context,
    requirements: brief.requirements,
    constraints: brief.constraints,
    verify: brief.verify,
    unclear: brief.unclear,
    response: brief.response,
  };
}

function renderCompactPromptBrief(brief: PromptBrief): string {
  const sections: string[] = [`## Task\n\n${brief.task}`];

  const relevantContext = brief.relevantContext.map(formatContextReference);
  if (relevantContext.length > 0) {
    sections.push(
      renderMarkdownSection("Relevant Context", relevantContext, true),
    );
  }

  const context = compactLines(brief.context, 3);
  if (context.length > 0) {
    sections.push(renderMarkdownSection("Context", context, true));
  }

  const requirements = compactLines(brief.requirements, 4);
  if (requirements.length > 0) {
    sections.push(renderMarkdownSection("Requirements", requirements, true));
  }

  const constraints = compactConstraints(brief.constraints);
  if (constraints.length > 0) {
    sections.push(renderMarkdownSection("Constraints", constraints, true));
  }

  const verify = compactLines(brief.verify, 4);
  if (verify.length > 0) {
    sections.push(renderMarkdownSection("Verify", verify, true));
  }

  const unclear = compactLines(brief.unclear, 3);
  if (unclear.length > 0) {
    sections.push(renderMarkdownSection(UNCLEAR_HEADING, unclear, true));
  }

  const response = compactLines(brief.response, 2);
  if (response.length > 0) {
    sections.push(
      renderMarkdownSection("Response", response, response.length > 1),
    );
  }

  return sections.join("\n\n") + "\n";
}

function formatContextReference(ref: PromptContextReference): string {
  const commands =
    ref.commands.length > 0
      ? ` Commands: ${ref.commands.map((cmd) => `\`${cmd}\``).join(", ")}.`
      : "";
  return `${ref.file}${ref.anchor} lines ${ref.lineStart}-${ref.lineEnd} (~${ref.tokensEstimate} tokens): ${ref.summary}.${commands}`;
}

function compactLines(lines: string[], limit: number): string[] {
  return lines.slice(0, limit);
}

function compactConstraints(lines: string[]): string[] {
  const userSpecific = lines.filter(
    (line) =>
      !/do not invent|preserve the user's original intent|information is missing/i.test(
        line,
      ),
  );
  if (userSpecific.length > 0) {
    return compactLines(userSpecific, 3);
  }
  return lines.length > 0 ? ["Do not invent facts; ask when unclear."] : [];
}
