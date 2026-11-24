/* Regenerates design/icons.mjs from the real lucide-react ESM icon nodes, so
   the previews use exact lucide geometry rather than hand-drawn shapes.

   Run only when the icon list below changes:  node design/gen-icons.mjs
   Requires lucide-react to be installed — `npm install` at the repo root is
   enough, since it is already a dependency. Override with LUCIDE_ICONS_DIR
   to point at some other checkout's copy. */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const PKG = resolve(HERE, "..", "node_modules", "lucide-react");
const BASE = process.env.LUCIDE_ICONS_DIR ?? join(PKG, "dist", "esm", "icons");
const OUT = join(HERE, "icons.mjs");

/* Stamped into the generated header so the file records which lucide it came
   from. Read, never hardcoded — the previous hardcoded "v1.14.0" outlived the
   version it named.

   Follows BASE rather than PKG, so an LUCIDE_ICONS_DIR override stamps the
   version of the copy actually read. Walking up from the icons dir finds the
   package root wherever it lives; PKG remains the fallback for the ordinary
   case where BASE is a bare directory of .mjs files with no package around it. */
const VERSION = (() => {
  const roots = [resolve(BASE, "..", "..", ".."), PKG];
  for (const root of roots) {
    try {
      const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
      if (pkg.name === "lucide-react" && pkg.version) return pkg.version;
    } catch {
      /* try the next candidate */
    }
  }
  return "unknown";
})();

const NAMES = [
  "layout-dashboard", "briefcase", "layers", "graduation-cap", "users",
  "credit-card", "file-text", "settings", "search", "bell", "sun", "moon",
  "log-out", "user", "chevron-down", "chevron-right", "chevron-left", "plus",
  "x", "check", "trash-2", "eye", "download", "upload", "pencil", "filter",
  "ellipsis", "arrow-up", "arrow-down", "chevrons-up-down", "inbox",
  "refresh-cw", "calendar", "star", "command", "corner-down-left",
  "external-link", "image", "triangle-alert", "info", "circle-check",
  "circle-alert", "loader-circle", "panel-left-close", "panel-left-open",
  "list-filter", "file-x", "search-x", "funnel-x",
  /* Added for the three-stream overview: one icon per revenue stream and per
     travel sub-product, plus the fixture-deadline and venue glyphs. */
  "ticket", "plane", "hotel", "smartphone", "shopping-bag", "trending-up",
  "clock", "map-pin",
  /* Added for the fan dashboard: its nav, the ticket/voucher affordances, and
     the auth screens. */
  "house", "qr-code", "arrow-right", "bed-double", "wifi", "shield-check",
  "mail", "lock", "user-round",
  /* Added for the scouting dashboard. Two families: the nav destinations the
     admin sidebar has no equivalent for, and the evaluation glyphs — one per
     attribute group, so a score row is scannable without reading its label. */
  "clipboard-list", "clipboard-check", "file-check", "message-square",
  "layout-template", "history", "chart-column", "send", "save", "arrow-left",
  "ellipsis-vertical", "circle-help", "pen-line", "shield",
  "zap", "brain", "activity", "gauge", "trophy", "target", "dumbbell", "flag",
];

/* Parse the `const __iconNode = [...]` array literal out of the source rather
   than importing the module — importing pulls in createLucideIcon -> React,
   which won't resolve from outside the travels package root. */
function readIconNode(name, depthGuard = 0) {
  const src = readFileSync(`${BASE}/${name}.mjs`, "utf8");
  // Deprecated names are alias modules: `export { default } from './funnel.mjs'`
  const alias = src.match(/export \{ default \} from '\.\/([\w-]+)\.mjs'/);
  if (alias) {
    if (depthGuard > 3) throw new Error(`alias loop at ${name}.mjs`);
    return readIconNode(alias[1], depthGuard + 1);
  }
  const start = src.indexOf("const __iconNode = ");
  if (start === -1) throw new Error(`no __iconNode in ${name}.mjs`);
  const open = src.indexOf("[", start);
  let depth = 0;
  let end = -1;
  for (let i = open; i < src.length; i++) {
    if (src[i] === "[") depth++;
    else if (src[i] === "]" && --depth === 0) {
      end = i + 1;
      break;
    }
  }
  if (end === -1) throw new Error(`unbalanced __iconNode in ${name}.mjs`);
  return new Function(`return ${src.slice(open, end)}`)();
}

const out = {};
for (const name of NAMES) {
  // __iconNode is [[tag, attrs], ...]; drop lucide's internal `key`.
  out[name] = readIconNode(name)
    .map(([tag, attrs]) => {
      const a = Object.entries(attrs)
        .filter(([k]) => k !== "key")
        .map(([k, v]) => `${k}="${v}"`)
        .join(" ");
      return `<${tag} ${a}/>`;
    })
    .join("");
}

const body = Object.entries(out)
  .map(([k, v]) => `  ${JSON.stringify(k)}: ${JSON.stringify(v)},`)
  .join("\n");

writeFileSync(
  OUT,
  `/* GENERATED from lucide-react v${VERSION} (ISC) — do not hand-edit.
   Regenerate with \`node design/gen-icons.mjs\` if the icon set changes.
   Inner SVG markup only; icon() supplies the <svg> wrapper. */

export const ICON_NODES = {
${body}
};

/* Renders a lucide icon at \`size\` px. Stroke-based, currentColor, so it
   inherits text colour the same way lucide-react does in the app. */
export function icon(name, size = 16, cls = "") {
  const node = ICON_NODES[name];
  if (!node) throw new Error(\`icons.mjs: unknown icon "\${name}"\`);
  return (
    \`<svg xmlns="http://www.w3.org/2000/svg" width="\${size}" height="\${size}" \` +
    \`viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" \` +
    \`stroke-linecap="round" stroke-linejoin="round"\${cls ? \` class="\${cls}"\` : ""} \` +
    \`aria-hidden="true">\${node}</svg>\`
  );
}
`,
  "utf8",
);

console.log(`wrote ${Object.keys(out).length} icons -> ${OUT}`);
