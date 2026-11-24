/* Emits design/src/screens/22-screen-overview.html and the day-one state card.

   Same reasoning as gen-chart-card.mjs: a 3-series stacked bar with surface
   gaps plus three mini sparklines is ~60 hand-computed coordinates, and that
   is exactly where arithmetic bugs hide. Edit THIS file, never the fragments
   — build.mjs will happily rebuild a hand-edited fragment and the next run of
   this script will silently discard the edit.

   APPROVED 2026-08-18. Two alternative layouts were explored and rejected:
   "Classic" (six dense stat cards, funnel bars, donut, fixture tiles) and
   "Command" (hero total, one 100% split bar, ring fixtures). Neither is in
   the manifest. If you are tempted to revive one, the shape of both is in
   this file's history — but the live card is the signed-off design, so
   changing what this script emits changes a design someone approved. Do not
   do it incidentally.                                                       */
import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(HERE, "src", "screens", "22-screen-overview.html");
/* The degraded state gets its own card rather than a footnote on the main
   one: it needs the ticket card AND the two-band chart to make its point,
   and bolting both onto the Overview pushed it past 1600px, where the
   thumbnail stops being readable. Same split as data/13-table-states.html. */
const OUT_STATES = resolve(HERE, "src", "screens", "22b-overview-day-one.html");

/* ── The three streams ────────────────────────────────────────────────────
   Slots are assigned in NAV ORDER (Matchday → Camps → Travel), never by
   revenue rank. Rank changes week to week; if colour followed it, a good
   month for travel would repaint the whole dashboard. Nav order is stable,
   and it is the order the reader already learned from the sidebar.

   Slots 1-3 are the three that clear even the strict all-pairs CVD
   separation check in css/tokens.overrides.css, so a 3-series stack is safe
   with no secondary encoding needed. */
const STREAMS = [
  { key: "tickets", label: "Match tickets", tok: "--chart-1" },
  { key: "camps", label: "Camps & programs", tok: "--chart-2" },
  { key: "travel", label: "Travel products", tok: "--chart-3" },
];

/* Weekly gross, € thousands, week beginning. Today is 17 Aug 2026, so the
   window is the eight complete weeks ending 11 Aug. */
const WEEKS = ["23 Jun", "30 Jun", "7 Jul", "14 Jul", "21 Jul", "28 Jul", "4 Aug", "11 Aug"];
const SERIES = {
  tickets: [18, 22, 31, 27, 44, 39, 52, 61],
  camps: [26, 24, 29, 33, 28, 31, 27, 30],
  travel: [12, 15, 14, 19, 22, 18, 25, 28],
};

/* ── Stacked bar ──────────────────────────────────────────────────────────
   y starts at zero, always. Gridlines are recessive and sit behind the
   marks; there is no vertical grid.                                       */
const VW = 620;
/* Tall on purpose. At the 175px this started as, eight stacked bars over a
   0-120 range were cramped enough that the middle band was hard to read, and
   the left column ended in 200px of dead space against the right. Giving the
   chart the height fixes both at once. */
const BASE = 268;
const TOP = 22;
const CH = 300;
const MAXV = 120;
const GAP = 2; // the surface gap between stacked segments
const R = 4; // rounded data-end, top segment only
const GX = 42; // room for the y labels
const PLOT = VW - GX - 10;
const GW = PLOT / WEEKS.length;
const BW = 26;

const scale = (v) => BASE - (v / MAXV) * (BASE - TOP);

/** One stacked segment. `roundTop` only on the topmost, because the rounding
    marks where the DATA ends — a rounded join mid-stack would read as two
    separate bars. Square baseline end, so zero is unambiguous. */
function seg(x, w, yBottom, yTop, roundTop) {
  const h = yBottom - yTop;
  if (h <= 0.4) return ""; // a sub-pixel sliver is noise, not data
  if (!roundTop) {
    return `M${x} ${yBottom} L${x} ${yTop} L${x + w} ${yTop} L${x + w} ${yBottom} Z`;
  }
  const r = Math.min(R, h / 2, w / 2);
  return (
    `M${x} ${yBottom} L${x} ${yTop + r} Q${x} ${yTop} ${x + r} ${yTop} ` +
    `L${x + w - r} ${yTop} Q${x + w} ${yTop} ${x + w} ${yTop + r} L${x + w} ${yBottom} Z`
  );
}

const n = (v) => Number(v.toFixed(2));

/** The whole stacked chart, for a given subset of streams. Taking the subset
    as an argument is what lets the day-one card render the SAME chart with
    the ticket band absent — rather than a second hand-drawn approximation of
    it that would drift the moment the numbers change. */
function stackedChart(keys, label) {
  const parts = STREAMS.filter((s) => keys.includes(s.key));

  let grid = "";
  for (const v of [0, 30, 60, 90, 120]) {
    const y = n(scale(v));
    grid += `            <line x1="${GX}" x2="${n(GX + PLOT)}" y1="${y}" y2="${y}" class="gr"/>\n`;
    grid += `            <text x="${GX - 8}" y="${n(y + 3.5)}" class="ax2" text-anchor="end">${v}</text>\n`;
  }

  let bars = "";
  let xLabels = "";
  let topLabel = "";
  WEEKS.forEach((wk, i) => {
    const cx = GX + GW * i + GW / 2;
    const x = n(cx - BW / 2);
    let cum = 0;
    const stack = parts.map((s) => {
      const v = SERIES[s.key][i];
      const from = cum;
      cum += v;
      return { tok: s.tok, from, to: cum };
    });

    stack.forEach((part, si) => {
      const isTop = si === stack.length - 1;
      const yBottom = scale(part.from);
      /* The gap is borrowed from the segment BELOW, by pulling its top edge
         down. Every segment except the topmost gives up 2px, so the stack
         total stays anchored to the real value at the data end. */
      const yTop = scale(part.to) + (isTop ? 0 : GAP);
      const d = seg(x, BW, n(yBottom), n(yTop), isTop);
      if (d) bars += `            <path d="${d}" fill="var(${part.tok})"/>\n`;
    });

    xLabels += `            <text x="${n(cx)}" y="${BASE + 15}" class="ax2">${wk}</text>\n`;

    /* Selective direct label — the most recent week only. A number on every
       bar is the classic stacked-chart mistake; one number on the bar the eye
       lands on first is the whole point of the chart. */
    if (i === WEEKS.length - 1) {
      topLabel =
        `            <text x="${n(cx)}" y="${n(scale(cum) - 7)}" class="ax-em">` +
        `€${cum}k</text>\n`;
    }
  });

  const svg =
    `<svg viewBox="0 0 ${VW} ${CH}" width="100%" height="${CH}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${label}">\n` +
    `${grid}${bars}${topLabel}${xLabels}            </svg>`;

  /* A legend is present for >= 2 series, always, so identity is never
     colour-alone. Three or fewer, so they are direct-labelled too. */
  const legend = parts
    .map(
      (s) =>
        `              <span class="lg-row"><span class="lg-dot" style="background: var(${s.tok})"></span><span class="lg-lab">${s.label.replace("&", "&amp;")}</span></span>`,
    )
    .join("\n");

  return { svg, legend };
}

const full = stackedChart(
  ["tickets", "camps", "travel"],
  "Weekly gross revenue by stream, eight weeks to 11 August, stacked",
);
const dayOne = stackedChart(
  ["camps", "travel"],
  "Weekly gross revenue, camps and travel only, eight weeks to 11 August, stacked",
);

/* ── Mini bar sparklines, one per stream card ─────────────────────────────
   Bars, not a line: the page's primary chart is bars, and at 34px tall a
   line and an area are indistinguishable. Same form = one less thing to
   decode. */
function sparkline(key, tok) {
  const vals = SERIES[key];
  const SW = 104;
  const SH = 34;
  const SBASE = SH - 2;
  const STOP = 3;
  const SBW = 9;
  const SGAP = (SW - vals.length * SBW) / (vals.length - 1);
  const max = Math.max(...vals);
  const sc = (v) => SBASE - (v / max) * (SBASE - STOP);

  let out = "";
  vals.forEach((v, i) => {
    const x = n(i * (SBW + SGAP));
    const y = n(sc(v));
    const h = SBASE - y;
    const r = Math.min(1.5, h / 2, SBW / 2);
    /* The final bar is the current week — full strength; the eight-week run
       up to it is stepped back so the card reads "where we are now, and how
       we got here" rather than eight equal claims. */
    const fill =
      i === vals.length - 1 ? `var(${tok})` : `color-mix(in oklch, var(${tok}) 42%, transparent)`;
    out +=
      `<path d="M${x} ${SBASE} L${x} ${n(y + r)} Q${x} ${y} ${n(x + r)} ${y} ` +
      `L${n(x + SBW - r)} ${y} Q${n(x + SBW)} ${y} ${n(x + SBW)} ${n(y + r)} ` +
      `L${n(x + SBW)} ${SBASE} Z" fill="${fill}"/>`;
  });

  return (
    `<svg viewBox="0 0 ${SW} ${SH}" width="${SW}" height="${SH}" role="img" ` +
    `aria-label="Weekly gross, last eight weeks">${out}</svg>`
  );
}

/* ── Stream card content ──────────────────────────────────────────────────
   Sub-rows within a card step the SAME hue down instead of taking new
   slots. Hue therefore always means "which business", and lightness means
   "which product inside it" — so a reader who learns the three colours once
   can read every panel on the page. */
const STEPS = ["100%", "62%", "38%"];
const subRow = (tok, step, label, money, count) =>
  `              <div class="ov-sub">` +
  `<i style="background: ${step === "100%" ? `var(${tok})` : `color-mix(in oklch, var(${tok}) ${step}, transparent)`}"></i>` +
  `<span class="ov-sub-l">${label}</span>` +
  `<span class="ov-sub-c">${count}</span>` +
  `<span class="ov-sub-m">${money}</span></div>\n`;

const CARDS = [
  {
    stream: STREAMS[0],
    icon: "ticket",
    money: "€196,400",
    delta: "18.2%",
    dir: "up",
    orders: "612",
    pending: true,
    subs: [
      ["Match tickets", "€154,900", "487"],
      ["Stadium tours", "€28,700", "98"],
      ["Hospitality", "€12,800", "27"],
    ],
    href: "View ticket orders",
  },
  {
    stream: STREAMS[1],
    icon: "graduation-cap",
    money: "€115,600",
    delta: "4.1%",
    dir: "up",
    orders: "148",
    subs: [
      ["Programs", "€71,200", "86"],
      ["Academies", "€38,400", "49"],
      ["Offers", "€6,000", "13"],
    ],
    href: "View in Transactions",
  },
  {
    stream: STREAMS[2],
    icon: "plane",
    money: "€92,820",
    delta: "9.7%",
    dir: "up",
    orders: "331",
    subs: [
      ["Flights", "€58,400", "112"],
      ["Stays", "€29,900", "74"],
      ["eSIMs", "€4,520", "145"],
    ],
    href: "View travel orders",
  },
];

const streamCards = CARDS.map((c) => {
  const subs = c.subs.map((s, i) => subRow(c.stream.tok, STEPS[i], s[0], s[1], s[2])).join("");
  return `            <div class="ds-card ov-stream">
              <div class="ov-stream-h">
                <span class="ov-ic" style="background: color-mix(in oklch, var(${c.stream.tok}) 14%, transparent); color: var(${c.stream.tok})">{{icon:${c.icon}:14}}</span>
                <span class="ov-stream-n">${c.stream.label.replace("&", "&amp;")}</span>
                ${c.pending ? '<span class="ds-pill" data-tone="warn">No endpoint</span>' : ""}
              </div>
              <div class="ov-money-row">
                <span class="ov-money">${c.money}</span>
                ${sparkline(c.stream.key, c.stream.tok)}
              </div>
              <div class="ov-meta">
                <span class="ov-d" data-dir="${c.dir}">{{icon:arrow-${c.dir}:11}} ${c.delta}</span>
                <span class="ov-orders">${c.orders} orders</span>
              </div>
${subs}              <div class="ov-foot">${c.href} {{icon:chevron-right:12}}</div>
            </div>`;
}).join("\n");

/* ── Attention queue ──────────────────────────────────────────────────────
   Sorted by cost of inaction, not by count. The stays cancellations move
   real supplier money and sit at the top even though they are the smallest
   number on the list. */
const ATTENTION = [
  ["danger", "3", "Stays cancellations awaiting supplier confirm", "Operations"],
  ["danger", "5", "Payments failed in the last 24h", "Orders"],
  ["warn", "4", "Ticket allocations unconfirmed, kickoff in &lt; 7 days", "Tickets"],
  ["warn", "2", "Partner applications pending &gt; 5 days", "Partner Apps"],
];
const attentionRows = ATTENTION.map(
  ([tone, count, text, target]) =>
    `              <div class="ov-att">
                <span class="ov-att-n" data-tone="${tone}">${count}</span>
                <span class="ov-att-t">${text}</span>
                <span class="ov-att-g">${target} {{icon:chevron-right:11}}</span>
              </div>`,
).join("\n");

/* Each activity row carries its stream's dot, so the feed is filterable by
   eye without a filter control. */
const ACTIVITY = [
  ["--chart-1", "credit-card", "4 × Cat 2 for <b>Barcelona v Atlético</b> issued.", "8 min ago"],
  ["--chart-3", "hotel", "Stays cancellation <b>#4412</b> confirmed with the supplier.", "41 min ago"],
  ["--chart-2", "graduation-cap", "<b>Accra Youth Camp</b> reached capacity.", "2 hrs ago"],
  ["--chart-1", "ticket", "Allocation for <b>Juventus v Inter</b> raised to 200.", "Yesterday"],
];
const activityRows = ACTIVITY.map(
  ([tok, ic, text, time]) =>
    `              <div class="ds-act-row">
                <span class="ds-act-ic" style="color: var(${tok})">{{icon:${ic}:12}}</span>
                <span><span class="ds-act-t">${text}</span><span class="ds-act-time">${time}</span></span>
              </div>`,
).join("\n");

/* ── Next fixtures ────────────────────────────────────────────────────────
   The one ticket-specific block on the Overview, and the only thing on the
   page with a DEADLINE. Ordered by kickoff, which is the order the work has
   to be done in. Sell-through is a meter because the question is "how full",
   a proportion, not a magnitude.

   `status` is a reserved status tone with a text label — never colour alone.
   Fulfilment stays plain text so there is one pill per row, not two.      */
const FIXTURES = [
  ["Barcelona v Atlético Madrid", "LA LIGA", "22 Aug, 20:00", "in 5d", 284, 320, "€54,000", "good", "On track", "Issued"],
  ["Arsenal v Liverpool", "PL", "29 Aug, 17:30", "in 12d", 196, 300, "€62,700", "good", "On track", "42 pending"],
  ["Bayern Munich v PSG", "UCL", "2 Sep, 21:00", "in 16d", 118, 250, "€73,200", "warn", "Slow", "Issued"],
  ["Juventus v Inter", "SERIE A", "12 Sep, 20:45", "in 26d", 64, 200, "€19,800", "neutral", "Early", "Not issued"],
  ["Chelsea v Tottenham", "PL", "19 Sep, 15:00", "in 33d", 41, 180, "€8,600", "neutral", "Early", "Not issued"],
];
const fixtureRows = FIXTURES.map(
  ([fixture, comp, kick, rel, sold, alloc, revenue, tone, status, fulfil]) => {
    const pct = Math.round((sold / alloc) * 100);
    return `                <tr>
                  <td><span class="ov-fx"><b>${fixture}</b><span class="ov-fx-c">${comp}</span></span></td>
                  <td><span class="ov-kick">${kick}<span class="ov-kick-r">${rel}</span></span></td>
                  <td>
                    <span class="ov-meter-row">
                      <span class="ov-meter"><span style="width: ${pct}%; background: var(--chart-1)"></span></span>
                      <span class="ov-meter-v">${pct}%</span>
                    </span>
                  </td>
                  <td class="ds-num">${sold} / ${alloc}</td>
                  <td class="ds-num">${revenue}</td>
                  <td><span class="ds-pill"${tone === "neutral" ? "" : ` data-tone="${tone}"`}>${status}</span></td>
                  <td class="ov-fulfil">${fulfil}</td>
                </tr>`;
  },
).join("\n");

const html = `<div class="ds-screen">
  <div class="ds-shell">
{{sidebar:dashboard}}
    <div class="ds-pane">
      <div class="ds-hdr">
        <div class="ds-hdr-r1">
          <span class="ds-crumb"><b>Overview</b></span>
          <span class="ov-hdr-actions">
            <!-- The period control is new. Travel's /v1/overview already
                 serves exactly these four buckets, so the control is free
                 for one stream and DEFINES the contract for the other two. -->
            <span class="ds-seg ov-period">
              <span class="ds-seg-btn">Today</span>
              <span class="ds-seg-btn">7d</span>
              <span class="ds-seg-btn" data-on="1">30d</span>
              <span class="ds-seg-btn">All</span>
            </span>
            <button class="ds-btn" data-variant="outline" data-size="sm">{{icon:refresh-cw:13}} Refresh</button>
          </span>
        </div>
        <div class="ds-hdr-r2">
          <span class="ds-hdr-title">Overview</span>
          <span class="ds-hdr-stats"><span class="ds-hdr-stat"><i style="background: var(--status-good)"></i>Live</span><span class="ds-hdr-stat">Last 30 days · updated 2 min ago</span></span>
        </div>
        <div style="height: 14px"></div>
      </div>

      <div class="ds-pane-body">
        <!-- Band 1 — the group total. Four numbers for the whole company,
             before it is split by business. -->
        <div class="ov-stat-grid">
          <div class="ds-stat">
            <div class="ds-stat-lab">{{icon:credit-card:13}} Gross revenue</div>
            <div class="ds-stat-val">€404,820</div>
            <div class="ds-stat-d" data-dir="up">{{icon:arrow-up:11}} 11.6%</div>
          </div>
          <div class="ds-stat">
            <div class="ds-stat-lab">{{icon:shopping-bag:13}} Orders</div>
            <div class="ds-stat-val">1,091</div>
            <div class="ds-stat-d" data-dir="up">{{icon:arrow-up:11}} 7.4%</div>
          </div>
          <div class="ds-stat">
            <div class="ds-stat-lab">{{icon:trending-up:13}} Avg order value</div>
            <div class="ds-stat-val">€371</div>
            <div class="ds-stat-d" data-dir="up">{{icon:arrow-up:11}} 3.9%</div>
          </div>
          <div class="ds-stat">
            <div class="ds-stat-lab">{{icon:circle-alert:13}} Needs attention</div>
            <div class="ds-stat-val">14</div>
            <div class="ds-stat-d">across all three streams</div>
          </div>
        </div>

        <!-- Band 2 — one card per business. This band IS the redesign: the
             old page had no way to say "which business is this money from". -->
        <div class="ov-streams">
${streamCards}
        </div>

        <div class="ov-grid2">
          <div class="ds-card">
            <div class="ds-card-h">Revenue by stream</div>
            <p class="ov-card-sub">Eight weeks to 11 Aug, € thousands. Stacked, because the question is the company total AND its split — two charts would make you add them up yourself.</p>
            ${full.svg}
            <div class="ov-legend">
${full.legend}
              <span class="ov-legend-note">Table view available — every chart on this page has one.</span>
            </div>
          </div>

          <div class="ov-side">
            <div class="ds-card">
              <div class="ds-card-h">Needs attention</div>
              <p class="ov-card-sub">Ordered by cost of inaction, not by count.</p>
${attentionRows}
            </div>
            <div class="ds-card">
              <div class="ds-card-h">Recent activity</div>
${activityRows}
            </div>
          </div>
        </div>

        <!-- Band 4 — the only block on this page with a deadline. A
             match-ticket business is driven by kickoff dates, so the
             Overview earns exactly one fixture-shaped panel. Everything
             deeper lives on Matchday. -->
        <div class="ds-card ov-fixtures">
          <div class="ov-fx-h">
            <div>
              <div class="ds-card-h" style="margin-bottom: 3px">Next fixtures</div>
              <p class="ov-card-sub" style="margin-bottom: 0">Sell-through against the allocation we hold, ordered by kickoff.</p>
            </div>
            <button class="ds-btn" data-variant="outline" data-size="sm">All fixtures {{icon:chevron-right:12}}</button>
          </div>
          <div class="ds-tw">
            <table class="ds-t">
              <thead>
                <tr>
                  <th>Fixture</th>
                  <th>Kickoff</th>
                  <th style="width: 168px">Sell-through</th>
                  <th class="ds-num">Sold / allocation</th>
                  <th class="ds-num">Revenue</th>
                  <th>Status</th>
                  <th>Fulfilment</th>
                </tr>
              </thead>
              <tbody>
${fixtureRows}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
`;

/* Shared by both cards, so the day-one state can never drift from the live
   state stylistically — the only difference between them is the data. */
const LOCAL_CSS = `<style data-local>
  .ds-shell { min-height: 640px; position: relative; }

  .ov-hdr-actions { display: flex; align-items: center; gap: 10px; }
  /* The period control is text, not icons, so it needs its own widths —
     .ds-seg-btn is sized for a 13px glyph. */
  .ov-period { margin-left: 0; }
  .ov-period .ds-seg-btn {
    width: auto; padding: 0 10px; height: 24px;
    font-family: var(--font-mono); font-size: 9.5px; font-weight: 700;
    letter-spacing: 0.08em; text-transform: uppercase;
  }

  .ov-stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }

  /* ── Band 2 ── */
  .ov-streams { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 12px; }
  .ov-stream { display: flex; flex-direction: column; }
  .ov-stream-h { display: flex; align-items: center; gap: 8px; }
  .ov-ic {
    display: inline-flex; align-items: center; justify-content: center;
    width: 24px; height: 24px; border-radius: var(--radius-sm); flex: none;
  }
  /* nowrap: the pill next to it was pushing "Match tickets" onto two lines,
     which made one of three otherwise identical cards taller than the rest. */
  .ov-stream-n { font-family: var(--font-heading); font-size: 13px; font-weight: 600; white-space: nowrap; }
  .ov-stream-h .ds-pill { margin-left: auto; }
  .ov-money-row { display: flex; align-items: flex-end; justify-content: space-between; gap: 12px; margin-top: 12px; }
  .ov-money {
    font-family: var(--font-heading); font-size: 26px; font-weight: 600;
    letter-spacing: -0.04em; line-height: 1; font-variant-numeric: tabular-nums;
  }
  .ov-meta { display: flex; align-items: center; gap: 10px; margin-top: 8px; padding-bottom: 10px; border-bottom: 1px solid var(--edge); }
  /* Direction is an arrow AND a colour, never colour alone. */
  .ov-d { display: inline-flex; align-items: center; gap: 3px; font-size: 11px; }
  .ov-d[data-dir="up"] { color: var(--status-good); }
  .ov-d[data-dir="down"] { color: var(--status-danger); }
  .ov-orders { font-family: var(--font-mono); font-size: 10px; color: var(--muted-foreground); font-variant-numeric: tabular-nums; }

  /* Sub-rows: the same hue stepped down. Money is the value being compared,
     so it is the one that gets the right-aligned mono column. */
  .ov-sub { display: grid; grid-template-columns: 8px 1fr auto auto; align-items: center; gap: 8px; padding: 5px 0; font-size: 11.5px; }
  .ov-sub i { width: 8px; height: 8px; border-radius: 2px; }
  .ov-sub-l { color: var(--foreground); }
  .ov-sub-c { font-family: var(--font-mono); font-size: 9.5px; color: var(--muted-foreground); font-variant-numeric: tabular-nums; }
  .ov-sub-m { font-family: var(--font-mono); font-size: 11px; font-variant-numeric: tabular-nums; min-width: 62px; text-align: right; }
  .ov-foot {
    display: flex; align-items: center; gap: 4px; margin-top: auto; padding-top: 10px;
    font-family: var(--font-mono); font-size: 9.5px; font-weight: 700;
    letter-spacing: 0.09em; text-transform: uppercase; color: var(--brand-text);
  }

  /* ── Band 3 ── */
  /* Near-even columns, not 1.32:1. The narrower right column wrapped every
     attention row onto two lines, which made that column ~200px taller than
     the chart beside it — the chart then sat above a block of dead space.
     Even columns keep the rows on one line and the two columns level. */
  .ov-grid2 { display: grid; grid-template-columns: 1.1fr 1fr; gap: 12px; align-items: start; margin-top: 12px; }
  .ov-side { display: flex; flex-direction: column; gap: 12px; }
  .ds-card { background: var(--card); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 14px; }
  .ds-card-h { font-family: var(--font-heading); font-size: 13px; font-weight: 600; margin-bottom: 10px; }
  .ov-card-sub { font-size: 11px; line-height: 1.5; color: var(--muted-foreground); margin: -4px 0 10px; max-width: 62ch; }

  .gr { stroke: var(--edge); stroke-width: 1; }
  .ax2 { fill: var(--muted-foreground); font-family: var(--font-mono); font-size: 8.5px; text-anchor: middle; }
  /* The one direct label. Text wears an ink token, never the series colour. */
  .ax-em { fill: var(--foreground); font-family: var(--font-mono); font-size: 10px; font-weight: 700; text-anchor: middle; }
  .ov-legend { display: flex; align-items: center; gap: 14px; margin-top: 8px; flex-wrap: wrap; }
  .lg-row { display: flex; align-items: center; gap: 7px; font-size: 11px; }
  .lg-dot { width: 8px; height: 8px; border-radius: 2px; flex: none; }
  .ov-legend-note { margin-left: auto; font-size: 10.5px; color: var(--muted-foreground); }

  .ov-att { display: grid; grid-template-columns: 26px 1fr auto; align-items: center; gap: 9px; padding: 7px 0; border-bottom: 1px solid var(--edge); font-size: 11.5px; }
  .ov-att:last-child { border-bottom: none; padding-bottom: 0; }
  .ov-att-n {
    display: inline-flex; align-items: center; justify-content: center;
    height: 20px; border-radius: var(--radius-sm);
    font-family: var(--font-mono); font-size: 10.5px; font-weight: 700; font-variant-numeric: tabular-nums;
  }
  .ov-att-n[data-tone="danger"] { background: var(--status-danger-bg); color: var(--status-danger); }
  .ov-att-n[data-tone="warn"] { background: var(--status-warn-bg); color: var(--status-warn); }
  .ov-att-t { line-height: 1.35; }
  .ov-att-g { display: inline-flex; align-items: center; gap: 2px; font-family: var(--font-mono); font-size: 9px; letter-spacing: 0.06em; text-transform: uppercase; color: var(--muted-foreground); white-space: nowrap; }

  /* ── Band 4 ── */
  .ov-fixtures { margin-top: 12px; }
  .ov-fx-h { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; margin-bottom: 10px; }
  .ov-fx { display: flex; flex-direction: column; }
  .ov-fx b { font-weight: 600; }
  .ov-fx-c { font-family: var(--font-mono); font-size: 9px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--muted-foreground); margin-top: 1px; }
  .ov-kick { display: flex; flex-direction: column; font-size: 12px; }
  .ov-kick-r { font-family: var(--font-mono); font-size: 9.5px; color: var(--muted-foreground); margin-top: 1px; }
  .ov-meter-row { display: flex; align-items: center; gap: 8px; }
  .ov-meter { flex: 1; height: 6px; border-radius: 999px; background: var(--muted); overflow: hidden; }
  .ov-meter span { display: block; height: 100%; border-radius: 999px; }
  .ov-meter-v { font-family: var(--font-mono); font-size: 10.5px; font-variant-numeric: tabular-nums; min-width: 30px; text-align: right; }
  .ov-fulfil { font-size: 11.5px; color: var(--muted-foreground); }

  /* ── Day-one state ── */
  .ov-empty { display: flex; flex-direction: column; align-items: center; gap: 3px; padding: 18px 8px 8px; text-align: center; }
  .ov-empty-ic { display: flex; align-items: center; justify-content: center; width: 30px; height: 30px; border-radius: 999px; background: var(--muted); color: var(--muted-foreground); margin-bottom: 3px; }
  .ov-empty-t { font-size: 12px; font-weight: 600; }
  .ov-empty-b { font-size: 10.5px; color: var(--muted-foreground); }

  /* Day-one card only — the side-by-side comparison. */
  .d1-grid { display: grid; grid-template-columns: 300px 300px; gap: 14px; align-items: start; }
  .d1-lab { font-family: var(--font-mono); font-size: 9px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; color: var(--muted-foreground); margin: 0 0 7px; }
  .d1-charts { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-top: 18px; }
</style>
`;

/* ── Card 22b — what actually renders before the ticket endpoint exists ────
   Two panels side by side for the ticket card, and the same chart with and
   without the ticket band, so the cost of the missing endpoint is visible
   rather than described. */
const dayOneHtml = `<div class="ds-section">
  <p class="ds-eyebrow">Screens · Overview</p>
  <h2 class="ds-h">Overview — before the ticket endpoint lands</h2>
  <p class="ds-sub">
    Camps and travel are live on day one: <code class="ds-code">GET /v1/transactions</code> and
    <code class="ds-code">GET /v1/overview</code> both already exist, and transactions is unpaginated
    with a <code class="ds-code">created_at</code> on every row, so the period buckets can be summed
    client-side with no new endpoint. <b>Match tickets has no backend at all</b> —
    <code class="ds-code">features/tickets/api.ts</code> is a deliberate mock and
    <code class="ds-code">store/matchday.ts</code> is static data. This card is what the Overview
    actually shows until that is fixed.
  </p>

  <div class="d1-grid">
    <div>
      <p class="d1-lab">Day one — no endpoint</p>
      <div class="ds-card ov-stream">
        <div class="ov-stream-h">
          <span class="ov-ic" style="background: color-mix(in oklch, var(--chart-1) 14%, transparent); color: var(--chart-1)">{{icon:ticket:14}}</span>
          <span class="ov-stream-n">Match tickets</span>
          <span class="ds-pill" data-tone="warn">No endpoint</span>
        </div>
        <div class="ov-money-row">
          <span class="ov-money" style="color: var(--muted-foreground)">€—</span>
        </div>
        <div class="ov-meta"><span class="ov-orders">— orders</span></div>
        <div class="ov-empty">
          <span class="ov-empty-ic">{{icon:ticket:16}}</span>
          <span class="ov-empty-t">Not measured yet</span>
          <span class="ov-empty-b">Needs <code class="ds-code">GET /v1/tickets/overview</code></span>
        </div>
      </div>
    </div>
    <div>
      <p class="d1-lab">Once it lands</p>
      <div class="ds-card ov-stream">
        <div class="ov-stream-h">
          <span class="ov-ic" style="background: color-mix(in oklch, var(--chart-1) 14%, transparent); color: var(--chart-1)">{{icon:ticket:14}}</span>
          <span class="ov-stream-n">Match tickets</span>
        </div>
        <div class="ov-money-row">
          <span class="ov-money">${CARDS[0].money}</span>
          ${sparkline("tickets", "--chart-1")}
        </div>
        <div class="ov-meta">
          <span class="ov-d" data-dir="up">{{icon:arrow-up:11}} ${CARDS[0].delta}</span>
          <span class="ov-orders">${CARDS[0].orders} orders</span>
        </div>
${CARDS[0].subs.map((s, i) => subRow(STREAMS[0].tok, STEPS[i], s[0], s[1], s[2])).join("")}        <div class="ov-foot">${CARDS[0].href} {{icon:chevron-right:12}}</div>
      </div>
    </div>
  </div>

  <p class="ds-note">
    <strong>Em-dashes, never zeroes.</strong> <code class="ds-code">€0</code> and
    <code class="ds-code">0 orders</code> are a claim that nothing sold. That is a completely
    different — and much worse — statement than "this is not wired up yet", and it is the kind of
    number that ends up in a board deck. The warn pill names the gap, and the empty state names the
    endpoint that closes it, so nobody has to go and ask.
    <br /><br />
    The ticket rows in <b>Needs attention</b> and the whole <b>Next fixtures</b> band are hidden on
    day one for the same reason, rather than shown empty. An action queue that lists work you cannot
    see, and a fixture table with no sell-through, are both worse than their own absence.
  </p>

  <div class="d1-charts">
    <div class="ds-card">
      <div class="ds-card-h">Day one — two bands</div>
      <p class="ov-card-sub">Camps and travel only. The chart is honest about its own coverage; it does not reserve an empty slot for the third stream.</p>
      ${dayOne.svg}
      <div class="ov-legend">
${dayOne.legend}
      </div>
    </div>
    <div class="ds-card">
      <div class="ds-card-h">Once it lands — three bands</div>
      <p class="ov-card-sub">Match tickets is the largest of the three and the fastest-growing, which is exactly why running blind on it is the expensive option.</p>
      ${full.svg}
      <div class="ov-legend">
${full.legend}
      </div>
    </div>
  </div>
</div>
`;

writeFileSync(OUT, html + LOCAL_CSS, "utf8");
writeFileSync(OUT_STATES, dayOneHtml + LOCAL_CSS, "utf8");
const kb = (s) => (Buffer.byteLength(s, "utf8") / 1024).toFixed(1);
console.log(`wrote ${kb(html + LOCAL_CSS)}KB -> ${OUT}`);
console.log(`wrote ${kb(dayOneHtml + LOCAL_CSS)}KB -> ${OUT_STATES}`);
