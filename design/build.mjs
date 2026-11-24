#!/usr/bin/env node
/* ─────────────────────────────────────────────────────────────────────────
   Golafly — Design System bundle generator (admin + fan).

   Reads authored body fragments from design/src/, inlines the token + canvas
   + per-project CSS, and writes fully self-contained HTML previews to
   design/dist/<project>/ for upload to claude.ai/design via DesignSync.

   TWO design systems share this bundle — see CSS_BY_PROJECT below. Each card
   declares `project: "admin" | "fan"` (defaulting to admin) and is emitted,
   reported and registered separately, because they upload to two different
   claude.ai/design projects.

   Why a generator rather than 39 hand-written standalone files:
     · Each preview must be self-contained (strict CSP — no CDN, no external
       fonts, no @import), so ~17KB of shared CSS is duplicated into every
       file. Hand-maintaining that means one token change is 39 edits and a
       guaranteed stale-value bug.
     · The `<!-- @dsCard -->` marker must be byte one of every file. The
       script owns it, so it cannot be forgotten.
     · Tokens are EXTRACTED from ../app/globals.css, never copied, so the
       design system cannot drift from the app.

   Usage:  node design/build.mjs
   ───────────────────────────────────────────────────────────────────────── */

import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { CARDS } from "./cards.mjs";
import { icon } from "./icons.mjs";
import { evalSteps, fanSidebar, fanTabBar, scoutSidebar, sidebar } from "./partials.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const GLOBALS = resolve(HERE, "..", "app", "globals.css");
const SRC = join(HERE, "src");
const DIST = join(HERE, "dist");
const MAX_BYTES = 250 * 1024; // DesignSync caps at 256 KiB

/* ── 1. Extract the token blocks from app/globals.css ────────────────────── */

/** Returns the declaration body of a top-level `selector { ... }` block. */
function extractBlock(css, selector) {
  const start = css.indexOf(selector);
  if (start === -1) throw new Error(`globals.css: no "${selector}" block found`);
  const open = css.indexOf("{", start);
  let depth = 0;
  for (let i = open; i < css.length; i++) {
    if (css[i] === "{") depth++;
    else if (css[i] === "}" && --depth === 0) {
      return css.slice(open + 1, i).trim();
    }
  }
  throw new Error(`globals.css: unbalanced braces in "${selector}"`);
}

/** Parses a declaration body into { "--name": "value" }.
    Splits on semicolons at paren-depth 0 — values like color-mix(...) and
    linear-gradient(a, b, c) contain commas and nested parens. */
function parseDecls(body) {
  const css = body.replace(/\/\*[\s\S]*?\*\//g, "");
  const decls = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < css.length; i++) {
    const c = css[i];
    if (c === "(") depth++;
    else if (c === ")") depth--;
    else if (c === ";" && depth === 0) {
      decls.push(css.slice(start, i));
      start = i + 1;
    }
  }
  decls.push(css.slice(start));

  const out = {};
  for (const decl of decls) {
    const i = decl.indexOf(":");
    if (i === -1) continue;
    const name = decl.slice(0, i).trim();
    if (!name.startsWith("--")) continue;
    out[name] = decl.slice(i + 1).trim().replace(/\s+/g, " ");
  }
  return out;
}

/** Resolves var(--x) chains within a single theme's token map. */
function resolveVar(map, value, depth = 0) {
  if (depth > 8) return value;
  const m = value.match(/^var\((--[\w-]+)\)$/);
  if (!m) return value;
  const next = map[m[1]];
  return next === undefined ? value : resolveVar(map, next, depth + 1);
}

/* oklch → linear sRGB, via Oklab and LMS (Björn Ottosson's matrices).
   Verified against known shadcn values: oklch(0.577 0.245 27.325) → #e7000b
   and oklch(0.985 0.002 106) → #fafaf9. */
function oklchToLinearRgb(L, C, hDeg) {
  const h = (hDeg * Math.PI) / 180;
  const a = C * Math.cos(h);
  const b = C * Math.sin(h);
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;
  const l = l_ ** 3;
  const m = m_ ** 3;
  const s = s_ ** 3;
  return [
    +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}

const inGamut = (rgb) => rgb.every((x) => x >= -0.0001 && x <= 1.0001);

/** True when the declared oklch value cannot be shown in sRGB as written. */
export function isOutOfGamut(str) {
  const p = parseOklch(str);
  return p ? !inGamut(oklchToLinearRgb(p.L, p.C, p.h)) : false;
}

function parseOklch(str) {
  const m = str.match(/^oklch\(\s*([\d.]+%?)\s+([\d.]+)\s+([\d.]+)\s*(?:\/\s*[\d.]+%?\s*)?\)$/);
  if (!m) return null;
  return {
    L: m[1].endsWith("%") ? parseFloat(m[1]) / 100 : parseFloat(m[1]),
    C: parseFloat(m[2]),
    h: parseFloat(m[3]),
  };
}

/* oklch() → hex, matching what the browser actually paints.

   Out-of-gamut colours are CLIPPED PER CHANNEL, not chroma-reduced. That is
   not the prettier algorithm, but it is what Chrome does — verified against
   live canvas readback:
     oklch(0.94 0.19 124)      → #d1ff61  (green channel clipped)
     oklch(0.577 0.245 27.325) → #e7000b
     oklch(0.704 0.191 22.216) → #ff6467
   Chroma reduction would print #d2ff6b / #e40016 — colours no browser shows.
   The printed hex has to match the swatch beside it, so clipping wins. */
function oklchToHex(str) {
  const p = parseOklch(str);
  if (!p) return null;
  const { L, C, h } = p;

  const gamma = (x) => {
    const c = x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(Math.max(x, 0), 1 / 2.4) - 0.055;
    return Math.round(Math.min(1, Math.max(0, c)) * 255);
  };
  return (
    "#" +
    oklchToLinearRgb(L, C, h)
      .map(gamma)
      .map((v) => v.toString(16).padStart(2, "0"))
      .join("")
  );
}

function buildTokensCss() {
  const css = readFileSync(GLOBALS, "utf8");
  const light = extractBlock(css, ":root {");
  const dark = extractBlock(css, ".dark {");

  /* :root carries the light values as a BASE so that tokens defined only in
     :root (--radius, --home-hero-scrim, ...) still resolve inside a dark
     panel — the panels are siblings, not nested, so a dark panel would
     otherwise inherit nothing from the light one. */
  return [
    "/* GENERATED by design/build.mjs from app/globals.css — do not edit. */",
    "",
    ":root {",
    light,
    "}",
    "",
    '[data-theme="light"] {',
    light,
    "}",
    "",
    '[data-theme="dark"] {',
    dark,
    "}",
    "",
  ].join("\n");
}

/* ── 2. Assemble ────────────────────────────────────────────────────────── */

const tokensGenerated = buildTokensCss();
writeFileSync(join(HERE, "css", "tokens.generated.css"), tokensGenerated, "utf8");

/* Per-theme token maps, used to resolve {{val:--x}} / {{hex:--x}} inside a
   panel. Dark inherits from light for anything .dark does not override —
   the same cascade the panels themselves get. */
const globalsCss = readFileSync(GLOBALS, "utf8");
const overridesCss = readFileSync(join(HERE, "css", "tokens.overrides.css"), "utf8");
const TOKENS = {
  light: {
    ...parseDecls(extractBlock(globalsCss, ":root {")),
    ...parseDecls(extractBlock(overridesCss, "[data-theme=\"light\"] {")),
  },
};
TOKENS.dark = {
  ...TOKENS.light,
  ...parseDecls(extractBlock(globalsCss, ".dark {")),
  ...parseDecls(extractBlock(overridesCss, "[data-theme=\"dark\"] {")),
};

/* ── Per-project CSS ──────────────────────────────────────────────────────
   Two design systems share this bundle: the admin dashboard and the fan
   dashboard. They are deliberately different visual languages — the admin is
   dense, 1px-edged and table-first; the fan side is soft, rounded and
   card-first — so they do NOT share a component layer. What they do share is
   everything above it: the tokens extracted from app/globals.css, the canvas
   the panels sit on, the icon set, and the whole self-check.

   Duplicating build.mjs per project would have meant maintaining the oklch
   conversion, the token extraction and the CSP check twice, and the second
   copy drifting the first time only one was edited. */
const read = (f) => readFileSync(join(HERE, "css", f), "utf8");

const CSS_BY_PROJECT = {
  admin: ["kit.css", "shell.css", "data.css", "components.css", "refinements.css"],
  fan: ["fan.css"],
  /* Scouting is the admin's visual language, not a third one: the same dense
     tables, 1px edges and sheets, used all day at a desk. So it takes the
     whole admin stack and adds only what evaluation needs — the 1–10 score
     scale, the RAG column, the step rail, the percentile bar. scout.css comes
     after refinements.css because it is the layer allowed to override. */
  scout: [
    "kit.css",
    "shell.css",
    "data.css",
    "components.css",
    "refinements.css",
    "scout.css",
  ],
};

const PROJECT_TITLE = {
  admin: "Golafly Admin",
  fan: "Golafly Fan",
  scout: "Golafly Scouting",
};

const sharedCss = (project) =>
  [
    tokensGenerated,
    read("tokens.overrides.css"),
    read("canvas.css"),
    /* refinements.css must stay last within admin — it overrides the rest. */
    ...CSS_BY_PROJECT[project].map(read),
  ].join("\n");

const SHARED_CSS = Object.fromEntries(
  Object.keys(CSS_BY_PROJECT).map((p) => [p, sharedCss(p)]),
);

/** {{icon:name}} or {{icon:name:20}} → inline lucide SVG. */
function expandIcons(html) {
  return html.replace(/\{\{icon:([a-z0-9-]+)(?::(\d+))?\}\}/g, (_m, name, size) =>
    icon(name, size ? Number(size) : 16),
  );
}

/** {{sidebar:offers}} → the admin sidebar with that item active.
    {{fannav:tickets}} → the fan sidebar, {{fantabs:tickets}} → its mobile tab
    bar. {{scoutnav:evaluations}} → the scout sidebar, {{evalsteps:tactical}} →
    the eight-step evaluation rail. Separate placeholders rather than one
    project-aware helper: the shells share no markup, and a single name would
    make it impossible to tell from a fragment which system it belongs to.

    Runs BEFORE expandIcons, because the partials themselves emit {{icon:…}}. */
function expandPartials(html) {
  return html
    .replace(/\{\{sidebar:([a-z-]+)\}\}/g, (_m, active) => sidebar(active))
    .replace(/\{\{fannav:([a-z-]+)\}\}/g, (_m, active) => fanSidebar(active))
    .replace(/\{\{fantabs:([a-z-]+)\}\}/g, (_m, active) => fanTabBar(active))
    .replace(/\{\{scoutnav:([a-z-]+)\}\}/g, (_m, active) => scoutSidebar(active))
    .replace(/\{\{evalsteps:([a-z-]+)\}\}/g, (_m, active) => evalSteps(active));
}

/** Splits an optional trailing <style data-local>…</style> off a fragment. */
function splitLocalStyle(fragment) {
  const m = fragment.match(/<style data-local>([\s\S]*?)<\/style>/);
  if (!m) return { body: fragment, local: "" };
  return { body: fragment.replace(m[0], "").trim(), local: m[1] };
}

/* Resolved per panel, so the SAME fragment prints this theme's values.
     {{val:--brand}} → oklch(0.94 0.19 124)
     {{hex:--brand}} → #dfff00                                              */
function expandVals(html, theme) {
  const map = TOKENS[theme];
  return html
    .replace(/\{\{val:(--[\w-]+)\}\}/g, (_m, name) => {
      const v = map[name];
      if (v === undefined) throw new Error(`unknown token ${name} in ${theme}`);
      return resolveVar(map, v);
    })
    .replace(/\{\{hex:(--[\w-]+)\}\}/g, (_m, name) => {
      const v = map[name];
      if (v === undefined) throw new Error(`unknown token ${name} in ${theme}`);
      return oklchToHex(resolveVar(map, v)) ?? "—";
    });
}

function panel(theme, body) {
  const label = theme === "dark" ? "Dark" : "Light";
  return (
    `<section class="ds-panel" data-theme="${theme}">` +
    `<p class="ds-panel-label">${label}</p>${expandVals(body, theme)}</section>`
  );
}

function render(card, fragment) {
  const project = card.project ?? "admin";
  const { body, local } = splitLocalStyle(expandIcons(expandPartials(fragment)));
  const dual = card.mode === "dual";
  const panels = dual
    ? panel("light", body) + panel("dark", body)
    : panel(card.mode === "dark" ? "dark" : "light", body);

  const attrs = [
    `group="${card.group}"`,
    `name="${card.name}"`,
    `subtitle="${card.subtitle}"`,
    `viewport="${card.viewport.width}x${card.viewport.height}"`,
  ].join(" ");

  return (
    `<!-- @dsCard ${attrs} -->\n` +
    `<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n` +
    `<meta name="viewport" content="width=${card.viewport.width}">\n` +
    `<title>${card.name} — ${PROJECT_TITLE[project]}</title>\n` +
    `<style>\n${SHARED_CSS[project]}\n${local}\n</style>\n</head>\n` +
    `<body class="ds-canvas" data-layout="${dual ? "dual" : "single"}">\n${panels}\n</body>\n</html>\n`
  );
}

if (existsSync(DIST)) rmSync(DIST, { recursive: true });
mkdirSync(DIST, { recursive: true });

const built = [];
for (const card of CARDS) {
  const fragment = readFileSync(join(SRC, card.src), "utf8");
  const html = render(card, fragment);
  const outPath = join(DIST, card.project ?? "admin", card.out);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, html, "utf8");
  built.push({ card, html, outPath });
}

/* ── 2b. Local review index ─────────────────────────────────────────────────
   Not uploaded — a contents page for `node design/serve.mjs` so the whole
   system can be clicked through locally during review. */
{
  /* Grouped by project first, so the two design systems read as two systems
     rather than one confusingly mixed list. */
  const groups = new Map();
  for (const card of CARDS) {
    const key = `${(card.project ?? "admin") === "fan" ? "FAN" : "ADMIN"} · ${card.group}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(card);
  }
  const sections = [...groups.entries()]
    .map(
      ([group, cards]) =>
        `<section><h2>${group}</h2><ul>` +
        cards
          .map(
            (c) =>
              `<li><a href="/${c.project ?? "admin"}/${c.out}"><span class="n">${c.name}</span>` +
              `<span class="s">${c.subtitle}</span>` +
              `<span class="m">${c.viewport.width}×${c.viewport.height} · ${
                c.mode === "dual" ? "light + dark" : c.mode
              }</span></a></li>`,
          )
          .join("") +
        `</ul></section>`,
    )
    .join("\n");

  writeFileSync(
    join(DIST, "index.html"),
    `<!doctype html><html lang="en"><head><meta charset="utf-8">
<title>Golafly Admin — design system</title>
<style>
${tokensGenerated}
${overridesCss}
*{box-sizing:border-box}
body{margin:0;padding:40px 32px;background:var(--background);color:var(--foreground);font-family:var(--font-sans)}
.wrap{max-width:980px;margin:0 auto}
h1{font-family:var(--font-heading);font-size:26px;letter-spacing:-.02em;margin:0 0 6px}
.lede{color:var(--muted-foreground);font-size:13px;margin:0 0 34px;max-width:64ch;line-height:1.6}
h2{font-family:var(--font-mono);font-size:10px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;
   color:var(--muted-foreground);margin:0 0 10px;padding-bottom:8px;border-bottom:1px solid var(--border)}
section{margin-bottom:30px}
ul{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:1fr 1fr;gap:8px}
a{display:block;padding:11px 13px;border:1px solid var(--border);border-radius:10px;
  background:var(--card);text-decoration:none;color:inherit}
a:hover{border-color:var(--brand-edge);box-shadow:0 0 12px var(--brand-glow)}
.n{display:block;font-weight:600;font-size:13px}
.s{display:block;font-size:11.5px;color:var(--muted-foreground);margin-top:2px;line-height:1.4}
.m{display:block;font-family:var(--font-mono);font-size:9.5px;color:var(--muted-foreground);
   margin-top:5px;letter-spacing:.08em}
</style></head><body><div class="wrap">
<h1>Golafly Admin</h1>
<p class="lede">${CARDS.length} cards. Every card except the screens renders light and dark side by side,
so you are always comparing the two themes of the same markup. Click anything to open it full size.</p>
${sections}
</div></body></html>
`,
    "utf8",
  );
}

/* ── 3. Self-check ──────────────────────────────────────────────────────── */

const failures = [];
for (const { card, html } of built) {
  const fail = (msg) => failures.push(`${card.project ?? "admin"}/${card.out}: ${msg}`);

  if (!html.startsWith('<!-- @dsCard group="')) fail("first line is not the @dsCard marker");

  // Strict CSP: nothing may reach the network.
  const external = html.match(/(https?:\/\/(?!www\.w3\.org)|@import|<link\b|<script\s+src)/g);
  if (external) fail(`external reference(s): ${[...new Set(external)].join(", ")}`);

  if (card.mode === "dual") {
    if (!html.includes('data-theme="light"') || !html.includes('data-theme="dark"'))
      fail("dual card is missing one of the theme panels");
  }

  // Guards against the "thin" count in the app's render check.
  const textLen = html
    .replace(/<style>[\s\S]*?<\/style>/g, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim().length;
  if (textLen < 400) fail(`too thin — only ${textLen} chars of visible text`);

  const bytes = Buffer.byteLength(html, "utf8");
  if (bytes > MAX_BYTES) fail(`${(bytes / 1024).toFixed(0)}KB exceeds the 250KB cap`);
}

/* ── 4. Report ──────────────────────────────────────────────────────────── */

const pad = (s, n) => String(s).padEnd(n);
const projectOf = (card) => card.project ?? "admin";

/* Reported per project, and the payload printed per project too: the two go to
   two different claude.ai/design projects, and one mixed list is how the wrong
   cards end up uploaded to the wrong place. */
for (const project of Object.keys(CSS_BY_PROJECT)) {
  const rows = built.filter(({ card }) => projectOf(card) === project);
  if (rows.length === 0) continue;

  console.log(`\n  ${project.toUpperCase()}  (${rows.length} cards → design/dist/${project})`);
  console.log(`  ${pad("path", 42)}${pad("group", 22)}${pad("viewport", 12)}size`);
  console.log(`  ${"─".repeat(84)}`);
  for (const { card, html } of rows) {
    console.log(
      `  ${pad(card.out, 42)}${pad(card.group, 22)}` +
        `${pad(`${card.viewport.width}x${card.viewport.height}`, 12)}` +
        `${(Buffer.byteLength(html, "utf8") / 1024).toFixed(1)}KB`,
    );
  }

  console.log(`\n  register_assets payload — ${project}:`);
  console.log(
    JSON.stringify(
      rows.map(({ card }) => ({
        name: card.name,
        path: card.out,
        subtitle: card.subtitle,
        group: card.group,
        viewport: card.viewport,
      })),
      null,
      2,
    )
      .split("\n")
      .map((l) => `  ${l}`)
      .join("\n"),
  );
}

if (failures.length) {
  console.error(`\n  ✗ ${failures.length} self-check failure(s):`);
  for (const f of failures) console.error(`    · ${f}`);
  process.exit(1);
}
console.log(`\n  ✓ ${built.length} card(s) built, self-check clean → design/dist\n`);
