import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, posix, relative } from "node:path";
import { fileURLToPath } from "node:url";

type DocSpec = {
  source: string;
  title: string;
  group: string;
  summary: string;
};

type TocItem = {
  level: number;
  id: string;
  text: string;
};

type RenderedDoc = {
  spec: DocSpec;
  url: string;
  html: string;
  text: string;
  toc: TocItem[];
};

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const GUIDE_DIR = join(ROOT, "doc", "guide");
const OUT_DIR = join(ROOT, "site");
const ASSETS_DIR = join(ROOT, "docs-site", "assets");
const REPO_URL = "https://github.com/LeMinhSang2k5/ready-for-agents";

const DOCS: DocSpec[] = [
  {
    source: "README.md",
    title: "Guide Home",
    group: "Start Here",
    summary: "Reading paths, command map, and documentation index.",
  },
  {
    source: "OVERVIEW.md",
    title: "System Overview",
    group: "Start Here",
    summary: "Scope, user roles, command map, and core design constraints.",
  },
  {
    source: "RESEARCH_NOTES.md",
    title: "Research Notes",
    group: "Research",
    summary: "Research framing, hypotheses, evaluation strategy, and future questions.",
  },
  {
    source: "ALGORITHMS.md",
    title: "Algorithms And Techniques",
    group: "Research",
    summary: "Detection rules, marker freshness, context tree, query ranking, and prompt pipeline.",
  },
  {
    source: "SECURITY_MODEL.md",
    title: "Security And Privacy Model",
    group: "Research",
    summary: "Trust boundaries, secret handling, and safety requirements for future features.",
  },
  {
    source: "REQUIREMENTS.md",
    title: "Functional Requirements",
    group: "Specification",
    summary: "Feature requirements, acceptance criteria, and traceability.",
  },
  {
    source: "NON_FUNCTIONAL.md",
    title: "Non-Functional Requirements",
    group: "Specification",
    summary: "Performance, compatibility, security, reliability, and maintainability constraints.",
  },
  {
    source: "CLI_SPEC.md",
    title: "CLI Specification",
    group: "Specification",
    summary: "Commands, flags, exit codes, JSON contracts, and examples.",
  },
  {
    source: "PROMPT_SPEC.md",
    title: "Prompt Specification",
    group: "Specification",
    summary: "Prompt compiler pipeline, output sections, JSON model, and roadmap.",
  },
  {
    source: "DATA_MODEL.md",
    title: "Data Model",
    group: "System Model",
    summary: "ProjectContext, generated files, config, environment scan, and context tree types.",
  },
  {
    source: "DETECTION_RULES.md",
    title: "Detection Rules",
    group: "System Model",
    summary: "Package manager, stack, scripts, folders, README, and environment detection.",
  },
  {
    source: "GENERATED_FILES_SPEC.md",
    title: "Generated Files",
    group: "System Model",
    summary: "Generated Markdown/YAML files, markers, RUNBOOK.md, and context tree cache.",
  },
  {
    source: "ARCHITECTURE.md",
    title: "Architecture",
    group: "Engineering",
    summary: "Layering, command pipelines, extension points, and distribution model.",
  },
  {
    source: "SRC_WORKFLOW.md",
    title: "Source Workflow",
    group: "Engineering",
    summary: "Implementation walkthrough mapped to files and functions.",
  },
  {
    source: "TEST_STRATEGY.md",
    title: "Test Strategy",
    group: "Engineering",
    summary: "Vitest layers, fixture strategy, behavior cases, and quality gaps.",
  },
  {
    source: "ROADMAP.md",
    title: "Roadmap",
    group: "Engineering",
    summary: "Shipped features, planned work, and versioning policy.",
  },
  {
    source: "GLOSSARY.md",
    title: "Glossary",
    group: "Reference",
    summary: "Terms used across the project and documentation.",
  },
  {
    source: "PROMPT_EXAMPLES.md",
    title: "Prompt Example Suite",
    group: "Reference",
    summary: "Bilingual examples used to improve prompt classification quality.",
  },
  {
    source: "adr/README.md",
    title: "ADR Index",
    group: "Architecture Decisions",
    summary: "Architecture Decision Record index.",
  },
  {
    source: "adr/001-doctor-fail-fast-cwd.md",
    title: "ADR 001: Doctor Fail-Fast CWD",
    group: "Architecture Decisions",
    summary: "Why doctor stops early for invalid cwd.",
  },
  {
    source: "adr/002-static-detection-only.md",
    title: "ADR 002: Static Detection Only",
    group: "Architecture Decisions",
    summary: "Why the MVP avoids execution, network calls, and AI APIs.",
  },
  {
    source: "adr/003-safe-file-writes.md",
    title: "ADR 003: Safe File Writes",
    group: "Architecture Decisions",
    summary: "Why generated files are preserved unless force is explicit.",
  },
];

const existingDocs = DOCS.filter((doc) => existsSync(join(GUIDE_DIR, doc.source)));
const urlBySource = new Map(
  existingDocs.map((doc) => [normalizeDocPath(doc.source), outputName(doc.source)]),
);

build();

function build(): void {
  rmSync(OUT_DIR, { recursive: true, force: true });
  mkdirSync(join(OUT_DIR, "assets"), { recursive: true });
  copyFileSync(join(ASSETS_DIR, "styles.css"), join(OUT_DIR, "assets", "styles.css"));
  copyFileSync(join(ASSETS_DIR, "site.js"), join(OUT_DIR, "assets", "site.js"));
  writeFileSync(join(OUT_DIR, ".nojekyll"), "", "utf-8");

  const rendered = existingDocs.map(renderDoc);
  const nav = renderNav(rendered);

  writeFileSync(
    join(OUT_DIR, "index.html"),
    renderLayout({
      title: "ready-for-agents Documentation",
      activeUrl: "index.html",
      nav,
      toc: [],
      body: renderHome(rendered),
    }),
    "utf-8",
  );

  for (let index = 0; index < rendered.length; index += 1) {
    const doc = rendered[index]!;
    const previous = rendered[index - 1];
    const next = rendered[index + 1];
    const body = [
      `<article class="article">${doc.html}${renderDocMeta(doc)}${renderPageLinks(previous, next)}</article>`,
    ].join("\n");

    writeFileSync(
      join(OUT_DIR, doc.url),
      renderLayout({
        title: `${doc.spec.title} · ready-for-agents`,
        activeUrl: doc.url,
        nav,
        toc: doc.toc,
        body,
      }),
      "utf-8",
    );
  }

  writeFileSync(
    join(OUT_DIR, "search-index.json"),
    `${JSON.stringify(
      rendered.map((doc) => ({
        title: doc.spec.title,
        group: doc.spec.group,
        summary: doc.spec.summary,
        url: doc.url,
        text: doc.text,
      })),
      null,
      2,
    )}\n`,
    "utf-8",
  );

  console.log(`Built docs site: ${relative(ROOT, OUT_DIR)}/ (${rendered.length} pages)`);
}

function renderDoc(spec: DocSpec): RenderedDoc {
  const markdown = readFileSync(join(GUIDE_DIR, spec.source), "utf-8");
  const rendered = renderMarkdown(markdown, spec.source);
  return {
    spec,
    url: outputName(spec.source),
    html: rendered.html,
    text: rendered.text,
    toc: rendered.toc,
  };
}

function renderLayout(options: {
  title: string;
  activeUrl: string;
  nav: string;
  toc: TocItem[];
  body: string;
}): string {
  const toc = renderToc(options.toc);
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(options.title)}</title>
  <meta name="description" content="Research-style documentation for ready-for-agents.">
  <link rel="stylesheet" href="assets/styles.css">
</head>
<body data-active="${escapeAttr(options.activeUrl)}">
  <div class="layout">
    <aside class="sidebar">
      <div class="brand">
        <a class="brand-title" href="index.html">ready-for-agents</a>
        <span class="brand-subtitle">Research-style technical documentation</span>
      </div>
      <div class="search">
        <input data-search-input type="search" placeholder="Search docs..." aria-label="Search docs">
        <div class="search-results" data-search-results></div>
      </div>
      ${options.nav}
    </aside>
    <main class="content">
      ${options.body}
      <footer class="site-footer">Generated from <code>doc/guide</code>. Edit Markdown source, then run <code>pnpm docs:build</code>.</footer>
    </main>
    ${toc}
  </div>
  <script src="assets/site.js"></script>
</body>
</html>
`;
}

function renderHome(docs: RenderedDoc[]): string {
  const cards = [
    card("Research Notes", "Frame the CLI as deterministic repository-context research.", "research_notes.html"),
    card("Algorithms", "Study static detection, marker freshness, context tree, and prompt ranking.", "algorithms.html"),
    card("Security Model", "Understand secret handling, trust boundaries, and safe writes.", "security_model.html"),
    card("CLI Specification", "Use the command contract as the source of truth for behavior.", "cli_spec.html"),
  ].join("\n");

  const specs = docs
    .filter((doc) => ["Specification", "System Model", "Engineering"].includes(doc.spec.group))
    .slice(0, 8)
    .map((doc) => `<li><a href="${doc.url}">${escapeHtml(doc.spec.title)}</a> — ${escapeHtml(doc.spec.summary)}</li>`)
    .join("\n");

  return `<section class="home">
  <p class="eyebrow">Deterministic context systems for AI coding agents</p>
  <h1>Documentation as a research surface</h1>
  <p class="lede">This site turns the Markdown specifications in <code>doc/guide</code> into a navigable research-style handbook for <strong>ready-for-agents</strong>: requirements, algorithms, safety model, and source workflows.</p>

  <div class="hero-grid">
    <div class="metric"><strong>Static-first</strong><span>No AI API or network required for the core context path.</span></div>
    <div class="metric"><strong>Privacy-first</strong><span>Runbook detects env names, not secret values.</span></div>
    <div class="metric"><strong>Retrieval-aware</strong><span>Context tree and query reduce full-file reads.</span></div>
    <div class="metric"><strong>Tested contract</strong><span>Behavior-oriented tests preserve CLI and generator semantics.</span></div>
  </div>

  <h2>Research Reading Path</h2>
  <div class="card-grid">${cards}</div>

  <h2>Specification Reading Path</h2>
  <ol>${specs}</ol>
</section>`;
}

function card(title: string, text: string, url: string): string {
  return `<a class="card" href="${url}"><h3>${escapeHtml(title)}</h3><p>${escapeHtml(text)}</p></a>`;
}

function renderNav(docs: RenderedDoc[]): string {
  const groups = new Map<string, RenderedDoc[]>();
  for (const doc of docs) {
    const list = groups.get(doc.spec.group) ?? [];
    list.push(doc);
    groups.set(doc.spec.group, list);
  }

  return [...groups.entries()]
    .map(([group, items]) => {
      const links = items
        .map(
          (doc) =>
            `<a class="nav-link" href="${doc.url}" data-nav-url="${doc.url}">${escapeHtml(doc.spec.title)}</a>`,
        )
        .join("\n");
      return `<nav class="nav-group" aria-label="${escapeAttr(group)}"><p class="nav-heading">${escapeHtml(group)}</p>${links}</nav>`;
    })
    .join("\n");
}

function renderToc(toc: TocItem[]): string {
  if (toc.length === 0) {
    return `<aside class="toc"><div class="toc-title">On This Page</div><a href="index.html">Documentation Home</a></aside>`;
  }

  const links = toc
    .filter((item) => item.level <= 3)
    .map(
      (item) =>
        `<a class="level-${item.level}" href="#${item.id}">${escapeHtml(item.text)}</a>`,
    )
    .join("\n");
  return `<aside class="toc"><div class="toc-title">On This Page</div>${links}</aside>`;
}

function renderDocMeta(doc: RenderedDoc): string {
  return `<div class="doc-meta">Source: <a href="${REPO_URL}/blob/main/doc/guide/${encodeURI(doc.spec.source)}">${escapeHtml(doc.spec.source)}</a> · Group: ${escapeHtml(doc.spec.group)}</div>`;
}

function renderPageLinks(previous: RenderedDoc | undefined, next: RenderedDoc | undefined): string {
  if (!previous && !next) return "";
  return `<div class="page-links">
    ${previous ? `<a href="${previous.url}">← ${escapeHtml(previous.spec.title)}</a>` : "<span></span>"}
    ${next ? `<a href="${next.url}">${escapeHtml(next.spec.title)} →</a>` : "<span></span>"}
  </div>`;
}

function renderMarkdown(markdown: string, currentSource: string): {
  html: string;
  toc: TocItem[];
  text: string;
} {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const html: string[] = [];
  const toc: TocItem[] = [];
  const usedSlugs = new Map<string, number>();
  let paragraph: string[] = [];
  let listType: "ul" | "ol" | null = null;
  let codeLang: string | null = null;
  let codeBuffer: string[] = [];

  const flushParagraph = () => {
    if (paragraph.length === 0) return;
    html.push(`<p>${renderInline(paragraph.join(" "), currentSource)}</p>`);
    paragraph = [];
  };

  const closeList = () => {
    if (listType) {
      html.push(`</${listType}>`);
      listType = null;
    }
  };

  const closeBlocks = () => {
    flushParagraph();
    closeList();
  };

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]!;

    if (codeLang !== null) {
      if (/^```/.test(line)) {
        const code = codeBuffer.join("\n");
        if (codeLang === "mermaid") {
          html.push(`<pre><code class="language-mermaid">${escapeHtml(code)}</code></pre>`);
        } else {
          html.push(`<pre><code class="language-${escapeAttr(codeLang)}">${escapeHtml(code)}</code></pre>`);
        }
        codeLang = null;
        codeBuffer = [];
      } else {
        codeBuffer.push(line);
      }
      continue;
    }

    const fence = /^```([A-Za-z0-9_-]*)\s*$/.exec(line);
    if (fence) {
      closeBlocks();
      codeLang = fence[1] || "text";
      codeBuffer = [];
      continue;
    }

    if (line.trim() === "") {
      closeBlocks();
      continue;
    }

    const heading = /^(#{1,6})\s+(.+?)\s*$/.exec(line);
    if (heading) {
      closeBlocks();
      const level = heading[1]!.length;
      const text = stripMarkdown(heading[2]!);
      const id = uniqueSlug(text, usedSlugs);
      if (level <= 3) toc.push({ level, id, text });
      html.push(`<h${level} id="${id}"><a class="anchor" href="#${id}">${renderInline(text, currentSource)}</a></h${level}>`);
      continue;
    }

    if (/^\s*---+\s*$/.test(line)) {
      closeBlocks();
      html.push("<hr>");
      continue;
    }

    if (isTableStart(lines, index)) {
      closeBlocks();
      const tableLines: string[] = [];
      while (index < lines.length && lines[index]!.includes("|") && lines[index]!.trim() !== "") {
        tableLines.push(lines[index]!);
        index += 1;
      }
      index -= 1;
      html.push(renderTable(tableLines, currentSource));
      continue;
    }

    const quote = /^\s*>\s?(.*)$/.exec(line);
    if (quote) {
      closeBlocks();
      const parts = [quote[1] ?? ""];
      while (index + 1 < lines.length) {
        const next = /^\s*>\s?(.*)$/.exec(lines[index + 1]!);
        if (!next) break;
        parts.push(next[1] ?? "");
        index += 1;
      }
      html.push(`<blockquote><p>${renderInline(parts.join(" "), currentSource)}</p></blockquote>`);
      continue;
    }

    const bullet = /^\s*[-*]\s+(.+)$/.exec(line);
    const ordered = /^\s*\d+\.\s+(.+)$/.exec(line);
    if (bullet || ordered) {
      flushParagraph();
      const desired = bullet ? "ul" : "ol";
      if (listType && listType !== desired) closeList();
      if (!listType) {
        listType = desired;
        html.push(`<${listType}>`);
      }
      html.push(`<li>${renderInline((bullet?.[1] ?? ordered?.[1] ?? "").trim(), currentSource)}</li>`);
      continue;
    }

    closeList();
    paragraph.push(line.trim());
  }

  closeBlocks();

  return {
    html: html.join("\n"),
    toc,
    text: stripMarkdown(markdown).replace(/\s+/g, " ").slice(0, 8000),
  };
}

function isTableStart(lines: string[], index: number): boolean {
  const current = lines[index];
  const next = lines[index + 1];
  if (!current || !next) return false;
  return current.includes("|") && /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(next);
}

function renderTable(lines: string[], currentSource: string): string {
  const [head, , ...body] = lines;
  const headers = splitTableRow(head ?? "");
  const rows = body.map(splitTableRow);
  return `<table>
  <thead><tr>${headers.map((cell) => `<th>${renderInline(cell, currentSource)}</th>`).join("")}</tr></thead>
  <tbody>
    ${rows.map((row) => `<tr>${row.map((cell) => `<td>${renderInline(cell, currentSource)}</td>`).join("")}</tr>`).join("\n")}
  </tbody>
</table>`;
}

function splitTableRow(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

function renderInline(raw: string, currentSource: string): string {
  const linkPattern = /(!?)\[([^\]]+)\]\(([^)]+)\)/g;
  let output = "";
  let last = 0;
  for (const match of raw.matchAll(linkPattern)) {
    output += renderInlineNoLinks(raw.slice(last, match.index));
    const isImage = match[1] === "!";
    const label = match[2] ?? "";
    const href = match[3] ?? "";
    const resolved = resolveHref(currentSource, href);
    if (isImage) {
      output += `<img src="${escapeAttr(resolved)}" alt="${escapeAttr(label)}">`;
    } else {
      output += `<a href="${escapeAttr(resolved)}">${renderInlineNoLinks(label)}</a>`;
    }
    last = (match.index ?? 0) + match[0].length;
  }
  output += renderInlineNoLinks(raw.slice(last));
  return output;
}

function renderInlineNoLinks(raw: string): string {
  const codes: string[] = [];
  const protectedText = raw.replace(/`([^`]+)`/g, (_, code: string) => {
    const token = `@@CODE${codes.length}@@`;
    codes.push(`<code>${escapeHtml(code)}</code>`);
    return token;
  });

  let escaped = escapeHtml(protectedText);
  escaped = escaped.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  escaped = escaped.replace(/(^|[\s(])_([^_\n]+)_($|[\s).,])/g, "$1<em>$2</em>$3");
  escaped = escaped.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  codes.forEach((code, index) => {
    escaped = escaped.replace(`@@CODE${index}@@`, code);
  });
  return escaped;
}

function resolveHref(currentSource: string, href: string): string {
  if (/^(https?:|mailto:)/.test(href) || href.startsWith("#")) return href;

  const [pathPart = "", hashPart] = href.split("#");
  const normalizedHash = hashPart ? slug(decodeURIComponent(hashPart)) : "";
  if (pathPart === "") return normalizedHash ? `#${normalizedHash}` : href;

  const resolved = normalizeDocPath(posix.join(posix.dirname(currentSource), pathPart));
  const siteUrl = urlBySource.get(resolved);
  if (siteUrl) return `${siteUrl}${normalizedHash ? `#${normalizedHash}` : ""}`;

  if (pathPart.endsWith(".md")) {
    const repoPath = normalizeDocPath(posix.join("doc/guide", posix.dirname(currentSource), pathPart));
    return `${REPO_URL}/blob/main/${repoPath}${hashPart ? `#${hashPart}` : ""}`;
  }

  return href;
}

function outputName(source: string): string {
  if (source === "README.md") return "guide.html";
  return `${source
    .replace(/\.md$/i, "")
    .replace(/\//g, "-")
    .toLowerCase()}.html`;
}

function normalizeDocPath(path: string): string {
  return posix.normalize(path).replace(/^\.\//, "");
}

function uniqueSlug(text: string, used: Map<string, number>): string {
  const base = slug(text);
  const count = used.get(base) ?? 0;
  used.set(base, count + 1);
  return count === 0 ? base : `${base}-${count + 1}`;
}

function slug(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "section";
}

function stripMarkdown(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*]\([^)]+\)/g, " ")
    .replace(/\[([^\]]+)]\([^)]+\)/g, "$1")
    .replace(/[`*_>#|:-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttr(text: string): string {
  return escapeHtml(text).replace(/'/g, "&#39;");
}
