#!/usr/bin/env node
/* Contrast audit for the resolved brand tokens.
   Run: node design/verify-contrast.mjs
   Exits non-zero if any required pair fails, so it can gate a design change. */

function oklchToRgb(L, C, hDeg) {
  const h = (hDeg * Math.PI) / 180;
  const a = C * Math.cos(h);
  const b = C * Math.sin(h);
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;
  const [l, m, s] = [l_ ** 3, m_ ** 3, s_ ** 3];
  const lin = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
  const g = (x) => {
    const c = x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(Math.max(x, 0), 1 / 2.4) - 0.055;
    return Math.round(Math.min(1, Math.max(0, c)) * 255);
  };
  return lin.map(g);
}
const hex = (rgb) => "#" + rgb.map((v) => v.toString(16).padStart(2, "0")).join("");
const lumRgb = (rgb) => {
  const [r, g, b] = rgb.map((v) => v / 255).map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const toRgb = (v) =>
  typeof v === "string"
    ? [1, 3, 5].map((i) => parseInt(v.slice(i, i + 2), 16))
    : oklchToRgb(...v);
const cr = (a, b) => {
  const [x, y] = [lumRgb(toRgb(a)), lumRgb(toRgb(b))].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};

/* ── The resolved tokens ────────────────────────────────────────────────── */
const T = {
  brand: [0.917, 0.226, 129], // #b4ff39 — ONE value, both themes
  brandForeground: [0.16, 0, 0], // near-black ink on lime
  brandTextLight: [0.54, 0.15, 129], // lime as TYPE on light surfaces
  brandEdgeLight: [0.64, 0.19, 129], // 1px pill edge on light surfaces
  lightPage: "#fafaf9",
  lightCard: "#ffffff",
  darkPage: "#0a0a0a",
  darkCard: "#0d0d0d",
};

const checks = [
  ["ink on lime fill — light", T.brandForeground, T.brand, 4.5],
  ["ink on lime fill — dark", T.brandForeground, T.brand, 4.5],
  ["lime fill vs dark page", T.brand, T.darkPage, 3],
  ["lime fill vs dark card", T.brand, T.darkCard, 3],
  ["pill edge vs light page", T.brandEdgeLight, T.lightPage, 3],
  ["pill edge vs light card", T.brandEdgeLight, T.lightCard, 3],
  ["brand text vs light page", T.brandTextLight, T.lightPage, 4.5],
  ["brand text vs light card", T.brandTextLight, T.lightCard, 4.5],
  ["brand text (=lime) vs dark page", T.brand, T.darkPage, 4.5],
  ["brand text (=lime) vs dark card", T.brand, T.darkCard, 4.5],
];

console.log("\n  Resolved brand tokens");
console.log(`    --brand            oklch(0.917 0.226 129)  ${hex(oklchToRgb(...T.brand))}   (both themes)`);
console.log(`    --brand-foreground oklch(0.16 0 0)         ${hex(oklchToRgb(...T.brandForeground))}`);
console.log(`    --brand-text light oklch(0.54 0.15 129)    ${hex(oklchToRgb(...T.brandTextLight))}`);
console.log(`    --brand-edge light oklch(0.64 0.19 129)    ${hex(oklchToRgb(...T.brandEdgeLight))}\n`);

let failed = 0;
console.log("  check                              ratio   need   result");
console.log("  " + "-".repeat(58));
for (const [label, a, b, need] of checks) {
  const r = cr(a, b);
  const ok = r >= need;
  if (!ok) failed++;
  console.log(`  ${label.padEnd(34)}${r.toFixed(2).padStart(5)}  ${String(need).padStart(5)}   ${ok ? "PASS" : "FAIL"}`);
}

/* The one thing that is knowingly not fixable by colour choice. */
console.log(
  `\n  note: lime fill vs light page is ${cr(T.brand, T.lightPage).toFixed(2)}:1 — inherent to any bright` +
    `\n  lime, which is why light mode carries the 1px --brand-edge instead.\n`,
);

if (failed) {
  console.error(`  ✗ ${failed} contrast check(s) failed\n`);
  process.exit(1);
}
console.log("  ✓ all contrast checks pass\n");
