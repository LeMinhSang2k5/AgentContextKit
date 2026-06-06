const input = document.querySelector("[data-search-input]");
const results = document.querySelector("[data-search-results]");
const active = document.body.dataset.active;

if (active) {
  document
    .querySelectorAll(`[data-nav-url="${CSS.escape(active)}"]`)
    .forEach((link) => link.classList.add("active"));
}

async function loadSearchIndex() {
  try {
    const response = await fetch("search-index.json");
    if (!response.ok) return [];
    return await response.json();
  } catch {
    return [];
  }
}

function scorePage(page, query) {
  const q = query.toLowerCase();
  const title = page.title.toLowerCase();
  const group = page.group.toLowerCase();
  const text = page.text.toLowerCase();
  let score = 0;
  if (title.includes(q)) score += 20;
  if (group.includes(q)) score += 8;
  if (text.includes(q)) score += 4;
  for (const token of q.split(/\s+/).filter(Boolean)) {
    if (title.includes(token)) score += 6;
    if (text.includes(token)) score += 1;
  }
  return score;
}

function renderResults(pages, query) {
  if (!results) return;
  const trimmed = query.trim();
  if (trimmed.length < 2) {
    results.innerHTML = "";
    return;
  }

  const matches = pages
    .map((page) => ({ page, score: scorePage(page, trimmed) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.page.title.localeCompare(b.page.title))
    .slice(0, 6);

  results.innerHTML = matches
    .map(
      ({ page }) =>
        `<a href="${page.url}"><strong>${page.title}</strong><br><span>${page.group}</span></a>`,
    )
    .join("");
}

if (input && results) {
  loadSearchIndex().then((pages) => {
    input.addEventListener("input", () => renderResults(pages, input.value));
  });
}
