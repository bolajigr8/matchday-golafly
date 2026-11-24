/* Emits design/src/charts/07-chart-forms.html with exact SVG geometry.
   Hand-writing 10 bar paths + donut dash offsets is where arithmetic bugs
   live; generating them once keeps the spec card honest. */
import { writeFileSync } from "node:fs";

const OUT = "C:/Users/Administrator/Desktop/matchday/design/src/charts/07-chart-forms.html";

/* ── Grouped bar: rounded data-end, square baseline end ─────────────────── */
const BASE = 140, TOP = 24, MAXV = 80, R = 4;
const scale = (v) => BASE - (v / MAXV) * (BASE - TOP);
const bar = (x, w, v) => {
  const y = scale(v);
  const r = Math.min(R, (BASE - y) / 2, w / 2);
  return `M${x} ${BASE} L${x} ${y + r} Q${x} ${y} ${x + r} ${y} L${x + w - r} ${y} Q${x + w} ${y} ${x + w} ${y + r} L${x + w} ${BASE} Z`;
};

const months = ["Mar", "Apr", "May", "Jun", "Jul"];
const seriesA = [42, 58, 51, 73, 66]; // Applications
const seriesB = [28, 34, 39, 45, 52]; // Approved
const GX = 44, GW = 68, BW = 13, GAP = 3;

let bars = "";
let xLabels = "";
months.forEach((m, i) => {
  const cx = GX + GW * i + GW / 2;
  const xA = cx - BW - GAP / 2;
  const xB = cx + GAP / 2;
  bars += `      <path d="${bar(xA, BW, seriesA[i])}" fill="var(--chart-1)"/>\n`;
  bars += `      <path d="${bar(xB, BW, seriesB[i])}" fill="var(--chart-2)"/>\n`;
  xLabels += `      <text x="${cx}" y="${BASE + 14}" class="ax">${m}</text>\n`;
});

/* Gridlines: recessive, behind the marks, no vertical grid. */
let grid = "";
for (const v of [0, 20, 40, 60, 80]) {
  const y = scale(v);
  grid += `      <line x1="${GX}" x2="${GX + GW * 5}" y1="${y}" y2="${y}" class="grid"/>\n`;
  grid += `      <text x="${GX - 8}" y="${y + 3.5}" class="ax" text-anchor="end">${v}</text>\n`;
}

/* ── Donut: 2px surface gap between segments ────────────────────────────── */
const RAD = 52, SW = 16;
const C = 2 * Math.PI * RAD;
const GAP_PX = 3;
const segs = [
  { label: "Football Tourism", pct: 0.42, tok: "--chart-1" },
  { label: "Player Management", pct: 0.28, tok: "--chart-2" },
  { label: "Sports Marketing", pct: 0.18, tok: "--chart-3" },
  { label: "Academy", pct: 0.12, tok: "--chart-4" },
];
let donut = "";
let acc = 0;
for (const s of segs) {
  const len = s.pct * C;
  donut +=
    `      <circle cx="80" cy="80" r="${RAD}" fill="none" stroke="var(${s.tok})" ` +
    `stroke-width="${SW}" stroke-dasharray="${(len - GAP_PX).toFixed(2)} ${(C - len + GAP_PX).toFixed(2)}" ` +
    `stroke-dashoffset="${(-acc * C).toFixed(2)}" transform="rotate(-90 80 80)"/>\n`;
  acc += s.pct;
}
const legend = segs
  .map(
    (s) =>
      `    <div class="lg-row"><span class="lg-dot" style="background: var(${s.tok})"></span>` +
      `<span class="lg-lab">${s.label}</span>` +
      `<span class="lg-val">${Math.round(s.pct * 100)}%</span></div>`,
  )
  .join("\n");

/* ── Funnel: horizontal, direct-labelled, drop-off called out ───────────── */
const stages = [
  { label: "Applied", v: 348 },
  { label: "Reviewed", v: 286 },
  { label: "Interviewed", v: 174 },
  { label: "Approved", v: 112 },
];
const FMAX = stages[0].v;
const funnel = stages
  .map((s, i) => {
    const pct = (s.v / FMAX) * 100;
    const drop = i === 0 ? "" : `−${Math.round((1 - s.v / stages[i - 1].v) * 100)}%`;
    return (
      `    <div class="fn-row">\n` +
      `      <span class="fn-lab">${s.label}</span>\n` +
      `      <span class="fn-track"><span class="fn-bar" style="width: ${pct.toFixed(1)}%; background: var(--chart-${i + 1})"></span></span>\n` +
      `      <span class="fn-val">${s.v}</span>\n` +
      `      <span class="fn-drop">${drop}</span>\n` +
      `    </div>`
    );
  })
  .join("\n");

/* ── Sparkline: 2px line, end dot, no axes ──────────────────────────────── */
const spark = [12, 18, 15, 24, 21, 29, 27, 34, 41, 38, 46, 52];
const SW_W = 128, SW_H = 34;
const sMax = Math.max(...spark), sMin = Math.min(...spark);
const pts = spark
  .map((v, i) => {
    const x = (i / (spark.length - 1)) * SW_W;
    const y = SW_H - ((v - sMin) / (sMax - sMin)) * (SW_H - 4) - 2;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  })
  .join(" ");
const lastPt = pts.split(" ").pop().split(",");

const html = `<div class="ds-section">
  <p class="ds-eyebrow">Four forms</p>
  <h2 class="ds-h">The only charts this dashboard needs</h2>
  <p class="ds-sub">
    The Overview screen is the single place charts appear. Every one of them is a magnitude or a
    composition — no time-series forecasting, no scatter. Keeping the vocabulary this small is what
    stops an admin dashboard turning into a BI tool nobody maintains.
  </p>
</div>

<div class="ds-section">
  <p class="ds-eyebrow">Composition · Program distribution</p>
  <div class="ds-chart-row">
    <svg viewBox="0 0 160 160" width="160" height="160" role="img" aria-label="Program distribution donut">
${donut}      <text x="80" y="76" class="ct-big">348</text>
      <text x="80" y="92" class="ct-sm">applications</text>
    </svg>
    <div class="lg">
${legend}
    </div>
  </div>
  <p class="ds-note">
    A <strong>3px surface gap</strong> separates segments so adjacent colours never touch — that gap is
    the secondary encoding that makes the palette safe for colour-blind readers. Centre carries the
    total, so the donut answers “how many” and “what mix” at once. Four slices is the ceiling; a fifth
    category becomes “Other”.
  </p>
</div>

<div class="ds-section">
  <p class="ds-eyebrow">Magnitude · Application journey</p>
  <div class="fn">
${funnel}
  </div>
  <p class="ds-note">
    A funnel is just a sorted bar chart — do not draw a tapering trapezoid, which distorts area against
    value. Every stage is directly labelled with its count, and the drop-off between stages is the
    number people actually want, so it is stated rather than left to be worked out.
  </p>
</div>

<div class="ds-section">
  <p class="ds-eyebrow">Comparison · Applications vs approvals</p>
  <svg viewBox="0 0 400 165" width="100%" role="img" aria-label="Applications versus approvals by month">
${grid}${bars}${xLabels}  </svg>
  <div class="lg lg-inline">
    <div class="lg-row"><span class="lg-dot" style="background: var(--chart-1)"></span><span class="lg-lab">Applications</span></div>
    <div class="lg-row"><span class="lg-dot" style="background: var(--chart-2)"></span><span class="lg-lab">Approved</span></div>
  </div>
  <p class="ds-note">
    Bars are thin with a 4px rounded top and a square baseline — the rounding marks the data end, the
    flat end sits on zero. Gridlines are recessive and horizontal only. The y-axis starts at zero, always:
    a truncated axis on a count is a lie.
    <br /><br />
    <strong>Never a second y-axis.</strong> Applications and approvals share a scale here because they
    are the same unit. Revenue against application count would be two charts, not two axes.
  </p>
</div>

<div class="ds-section">
  <p class="ds-eyebrow">Trend · Stat card sparkline</p>
  <div class="ds-spark-card">
    <div>
      <div class="sc-lab">Signed players</div>
      <div class="sc-val">156</div>
      <div class="sc-delta">{{icon:arrow-up:11}} 12.4% vs last month</div>
    </div>
    <svg viewBox="0 0 ${SW_W} ${SW_H}" width="${SW_W}" height="${SW_H}" role="img" aria-label="Signed players trend, rising">
      <polyline points="${pts}" fill="none" stroke="var(--chart-1)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="${lastPt[0]}" cy="${lastPt[1]}" r="3" fill="var(--chart-1)"/>
    </svg>
  </div>
  <p class="ds-note">
    One series, so no legend — the label names it. No axes, no grid, no tooltip: a sparkline is a shape,
    not a chart you read values off. The end dot marks “now”. The delta beneath states the number, and
    carries an arrow so the direction is not colour-only.
  </p>
</div>

<style data-local>
  .grid { stroke: var(--border); stroke-width: 1; }
  .ax { fill: var(--muted-foreground); font-family: var(--font-mono); font-size: 8px; text-anchor: middle; }
  .ct-big { fill: var(--foreground); font-family: var(--font-heading); font-size: 22px; font-weight: 700; text-anchor: middle; }
  .ct-sm { fill: var(--muted-foreground); font-family: var(--font-mono); font-size: 7.5px; text-anchor: middle; letter-spacing: 0.1em; text-transform: uppercase; }
  .ds-chart-row { display: flex; gap: 28px; align-items: center; }
  .lg { display: flex; flex-direction: column; gap: 7px; flex: 1; }
  .lg-inline { flex-direction: row; gap: 16px; margin-top: 6px; }
  .lg-row { display: flex; align-items: center; gap: 8px; font-size: 11.5px; }
  .lg-dot { width: 9px; height: 9px; border-radius: 2px; flex: none; }
  .lg-lab { color: var(--foreground); }
  .lg-val { margin-left: auto; font-family: var(--font-mono); font-size: 11px; color: var(--muted-foreground); font-variant-numeric: tabular-nums; }
  .fn { display: flex; flex-direction: column; gap: 7px; }
  .fn-row { display: grid; grid-template-columns: 92px 1fr 44px 44px; gap: 10px; align-items: center; }
  .fn-lab { font-size: 11.5px; color: var(--foreground); }
  .fn-track { height: 16px; background: var(--muted); border-radius: 3px; overflow: hidden; }
  .fn-bar { display: block; height: 100%; border-radius: 3px; }
  .fn-val { font-family: var(--font-mono); font-size: 11.5px; text-align: right; font-variant-numeric: tabular-nums; }
  .fn-drop { font-family: var(--font-mono); font-size: 10px; color: var(--muted-foreground); text-align: right; font-variant-numeric: tabular-nums; }
  .ds-spark-card { display: flex; align-items: center; justify-content: space-between; gap: 20px; background: var(--card); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 14px 16px; }
  .sc-lab { font-family: var(--font-mono); font-size: 9.5px; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; color: var(--muted-foreground); }
  .sc-val { font-family: var(--font-heading); font-size: 26px; font-weight: 700; letter-spacing: -0.03em; font-variant-numeric: tabular-nums; margin-top: 3px; }
  .sc-delta { display: flex; align-items: center; gap: 4px; font-size: 11px; color: var(--status-good); margin-top: 3px; }
</style>
`;

writeFileSync(OUT, html, "utf8");
console.log(`wrote ${OUT}`);
