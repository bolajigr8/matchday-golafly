#!/usr/bin/env node
/* Tiny static server for previewing design/dist locally before upload.
   Dev-only convenience — nothing in the bundle depends on it.
   Usage: node design/serve.mjs [port]   (default 4180) */

import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { join, dirname, extname, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "dist");
const PORT = Number(process.argv[2]) || 4180;
const TYPES = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript" };

createServer(async (req, res) => {
  const rel = normalize(decodeURIComponent(req.url.split("?")[0])).replace(/^[/\\]+/, "");
  try {
    const body = await readFile(join(ROOT, rel));
    res.writeHead(200, { "Content-Type": TYPES[extname(rel)] ?? "application/octet-stream" });
    res.end(body);
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end(`not found: ${rel}`);
  }
}).listen(PORT, () => console.log(`design/dist → http://localhost:${PORT}/`));
