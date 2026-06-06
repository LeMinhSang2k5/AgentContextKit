import { createServer } from "node:http";
import { createReadStream, existsSync, statSync } from "node:fs";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SITE_DIR = join(ROOT, "site");
const PORT = Number(process.env.PORT ?? 4173);

const mimeTypes: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
};

if (!existsSync(join(SITE_DIR, "index.html"))) {
  console.error("site/index.html not found. Run `pnpm docs:build` first.");
  process.exit(1);
}

const server = createServer((req, res) => {
  const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);
  const rawPath = decodeURIComponent(url.pathname);
  const relativePath = rawPath === "/" ? "index.html" : rawPath.slice(1);
  const safePath = normalize(relativePath).replace(/^(\.\.(\/|\\|$))+/, "");
  const fullPath = join(SITE_DIR, safePath);

  if (!existsSync(fullPath) || !statSync(fullPath).isFile()) {
    res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    res.end("Not found");
    return;
  }

  res.writeHead(200, {
    "content-type": mimeTypes[extname(fullPath)] ?? "application/octet-stream",
  });
  createReadStream(fullPath).pipe(res);
});

server.listen(PORT, () => {
  console.log(`Docs preview: http://localhost:${PORT}`);
});
