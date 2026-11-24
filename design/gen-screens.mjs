#!/usr/bin/env node
/* Emits design/src/screens/*.html — the eight assembled screens.

   Generated rather than hand-written because every screen shares the same
   sidebar and content-header chrome; copy-pasting it eight times guarantees
   the eighth copy drifts from the first. Edit this file, not the output.

   Run: node design/gen-screens.mjs                                        */
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const OUT = join(dirname(fileURLToPath(import.meta.url)), "src", "screens");
mkdirSync(OUT, { recursive: true });

const NAV = [
  ["dashboard", "layout-dashboard", "Dashboard", null],
  ["offers", "briefcase", "Offers", "42"],
  ["programs", "layers", "Programs", null],
  ["academy", "graduation-cap", "Academy", null],
  ["players", "users", "Players", null],
  ["transactions", "credit-card", "Transactions", null],
  ["partner", "file-text", "Partner Apps", "7"],
  ["settings", "settings", "Settings", null],
];

const sidebar = (active) => `      <aside class="ds-sb">
        <div class="ds-sb-sec">
          <div class="ds-sb-brand"><span class="ds-sb-mark">GOLAFLY</span><span class="ds-sb-tag">Admin</span></div>
        </div>
        <div class="ds-sb-sec">
          <button class="ds-sb-search">{{icon:search:13}} Search…<span class="ds-kbd">⌘K</span></button>
        </div>
        <nav class="ds-sb-nav">
${NAV.map(
  ([id, ic, label, count]) =>
    `          <div class="ds-sb-item"${id === active ? ' data-state="active"' : ""}>{{icon:${ic}:15}} ${label}${
      count ? `<span class="ds-sb-count">${count}</span>` : ""
    }</div>`,
).join("\n")}
        </nav>
        <div class="ds-sb-sec">
          <div class="ds-sb-util">
            <button class="ds-icon-btn" data-dot="1">{{icon:bell:15}}</button>
            <button class="ds-icon-btn">{{icon:panel-left-close:15}}</button>
            <span class="ds-seg"><span class="ds-seg-btn" data-on="1">{{icon:sun:13}}</span><span class="ds-seg-btn">{{icon:moon:13}}</span></span>
          </div>
        </div>
        <div class="ds-sb-sec">
          <div class="ds-sb-user">
            <span class="ds-avatar">NA</span>
            <span><span class="ds-sb-user-name">Nathan A.</span><span class="ds-sb-user-role">Admin</span></span>
            {{icon:chevrons-up-down:13}}
          </div>
        </div>
      </aside>`;

const header = ({ crumb, title, stats = "", action = "", tabs = null }) => `        <div class="ds-hdr">
          <div class="ds-hdr-r1">
            <span class="ds-crumb">${crumb}</span>
            ${action}
          </div>
          <div class="ds-hdr-r2">
            <span class="ds-hdr-title">${title}</span>
            ${stats ? `<span class="ds-hdr-stats">${stats}</span>` : ""}
          </div>
          ${
            tabs
              ? `<div class="ds-tabs">${tabs
                  .map((t, i) => `<span class="ds-tab"${i === tabs.length - 1 && t.on ? "" : ""}${t.on ? ' data-on="1"' : ""}>${t.label}</span>`)
                  .join("")}</div>`
              : `<div style="height: 14px"></div>`
          }
        </div>`;

const stat = (label, icon, value, delta, dir) => `          <div class="ds-stat">
            <div class="ds-stat-lab">{{icon:${icon}:13}} ${label}</div>
            <div class="ds-stat-val">${value}</div>
            ${delta ? `<div class="ds-stat-d" data-dir="${dir}">{{icon:arrow-${dir === "up" ? "up" : "down"}:11}} ${delta}</div>` : ""}
          </div>`;

const toolbar = (placeholder, chips = []) => `          <div class="ds-tb">
            <span class="ds-input" style="width: 230px">{{icon:search:14}} ${placeholder}</span>
            <span class="ds-input" style="gap: 9px">{{icon:list-filter:14}} Status {{icon:chevron-down:12}}</span>
            <span class="ds-input" style="gap: 9px">{{icon:calendar:14}} Last 30 days {{icon:chevron-down:12}}</span>
${chips.map((c) => `            <span class="ds-chip">${c}<span class="ds-chip-x">{{icon:x:10}}</span></span>`).join("\n")}
            <span style="margin-left: auto; display: flex; gap: 7px">
              <button class="ds-btn" data-variant="outline" data-size="sm">{{icon:download:13}} Export</button>
            </span>
          </div>`;

const table = (cols, rows) => `          <div class="ds-tw">
            <table class="ds-t">
              <thead><tr>${cols.map((c) => `<th${c.num ? ' style="text-align:right"' : ""}${c.w ? ` style="width:${c.w}"` : ""}>${c.label}</th>`).join("")}<th style="text-align:right">Actions</th></tr></thead>
              <tbody>
${rows
  .map(
    (r) =>
      `                <tr>${r.map((cell) => `<td${cell.num ? ' class="ds-num"' : ""}>${cell.v}</td>`).join("")}<td><span class="ds-acts"><span class="ds-act">{{icon:eye:14}}</span><span class="ds-act">{{icon:pencil:14}}</span><span class="ds-act" data-tone="danger">{{icon:trash-2:14}}</span></span></td></tr>`,
  )
  .join("\n")}
              </tbody>
            </table>
            <div class="ds-pag">
              <span>Showing <span class="ds-pag-n">1–${rows.length}</span> of <span class="ds-pag-n">156</span></span>
              <span class="ds-pages">
                <span class="ds-page" data-disabled="1">{{icon:chevron-left:13}}</span>
                <span class="ds-page" data-on="1">1</span><span class="ds-page">2</span><span class="ds-page">3</span><span class="ds-page">…</span><span class="ds-page">16</span>
                <span class="ds-page">{{icon:chevron-right:13}}</span>
              </span>
              <span>Rows <span class="ds-pag-n">10</span> {{icon:chevrons-up-down:11}}</span>
            </div>
          </div>`;

const pill = (tone, label) => `<span class="ds-pill"${tone ? ` data-tone="${tone}"` : ""}>${label}</span>`;
const idc = (initials, name, sub) =>
  `<span class="ds-idc"><span class="ds-av-sm">${initials}</span><span class="ds-idc-txt"><span class="ds-idc-name">${name}</span><span class="ds-idc-sub">${sub}</span></span></span>`;

const NEW = (label) => `<button class="ds-btn">{{icon:plus:14}} ${label}</button>`;

/* Wraps a screen body in the shell. `aside` is an optional open sheet. */
const screen = (active, headerCfg, body, aside = "") => `<div class="ds-screen">
  <div class="ds-shell">
${sidebar(active)}
    <div class="ds-pane">
${header(headerCfg)}
      <div class="ds-pane-body">
${body}
      </div>
    </div>
${aside}
  </div>
</div>

<style data-local>
  .ds-screen { }
  .ds-shell { min-height: 660px; }
  .ds-open-sheet { position: absolute; top: 0; right: 0; bottom: 0; width: 380px; }
  .ds-shell-wrap { position: relative; }
</style>
`;

/* ── 1. Overview ─────────────────────────────────────────────────────────── */
const overview = screen(
  "dashboard",
  {
    crumb: "<b>Dashboard</b>",
    title: "Overview",
    stats:
      '<span class="ds-hdr-stat"><i style="background: var(--status-good)"></i>Live</span><span class="ds-hdr-stat">Updated 2 min ago</span>',
    action: `<button class="ds-btn" data-variant="outline" data-size="sm">{{icon:refresh-cw:13}} Refresh</button>`,
  },
  `          <div class="ds-stat-grid">
${stat("Applications", "file-text", "348", "12.4%", "up")}
${stat("Pending", "circle-alert", "42", "8.1%", "down")}
${stat("Approved", "circle-check", "286", "15.2%", "up")}
${stat("Revenue", "credit-card", "€124,500", "6.3%", "up")}
${stat("Countries", "external-link", "42", null)}
${stat("Signed", "users", "156", "12.4%", "up")}
          </div>

          <div class="ds-ov-grid">
            <div class="ds-card ds-ov-main">
              <div class="ds-card-h">Application journey</div>
              <div class="fn">
                <div class="fn-row"><span class="fn-lab">Applied</span><span class="fn-track"><span class="fn-bar" style="width:100%;background:var(--chart-1)"></span></span><span class="fn-val">348</span><span class="fn-drop"></span></div>
                <div class="fn-row"><span class="fn-lab">Reviewed</span><span class="fn-track"><span class="fn-bar" style="width:82.2%;background:var(--chart-2)"></span></span><span class="fn-val">286</span><span class="fn-drop">−18%</span></div>
                <div class="fn-row"><span class="fn-lab">Interviewed</span><span class="fn-track"><span class="fn-bar" style="width:50%;background:var(--chart-3)"></span></span><span class="fn-val">174</span><span class="fn-drop">−39%</span></div>
                <div class="fn-row"><span class="fn-lab">Approved</span><span class="fn-track"><span class="fn-bar" style="width:32.2%;background:var(--chart-4)"></span></span><span class="fn-val">112</span><span class="fn-drop">−36%</span></div>
              </div>
              <div class="ds-card-h" style="margin-top:18px">Applications vs approvals</div>
              <svg viewBox="0 0 400 150" width="100%" height="158" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Applications versus approvals by month">
                <line x1="30" x2="392" y1="126" y2="126" class="gr"/><text x="24" y="129" class="ax2" text-anchor="end">0</text>
                <line x1="30" x2="392" y1="92" y2="92" class="gr"/><text x="24" y="95" class="ax2" text-anchor="end">20</text>
                <line x1="30" x2="392" y1="58" y2="58" class="gr"/><text x="24" y="61" class="ax2" text-anchor="end">40</text>
                <line x1="30" x2="392" y1="24" y2="24" class="gr"/><text x="24" y="27" class="ax2" text-anchor="end">60</text>
                <path d="M50 126 L50 55.6 Q50 51.6 54 51.6 L59 51.6 Q63 51.6 63 55.6 L63 126 Z" fill="var(--chart-1)"/>
                <path d="M66 126 L66 78.4 Q66 74.4 70 74.4 L75 74.4 Q79 74.4 79 78.4 L79 126 Z" fill="var(--chart-2)"/>
                <path d="M118 126 L118 27.4 Q118 23.4 122 23.4 L127 23.4 Q131 23.4 131 27.4 L131 126 Z" fill="var(--chart-1)"/>
                <path d="M134 126 L134 68.2 Q134 64.2 138 64.2 L143 64.2 Q147 64.2 147 68.2 L147 126 Z" fill="var(--chart-2)"/>
                <path d="M186 126 L186 39.3 Q186 35.3 190 35.3 L195 35.3 Q199 35.3 199 39.3 L199 126 Z" fill="var(--chart-1)"/>
                <path d="M202 126 L202 59.7 Q202 55.7 206 55.7 L211 55.7 Q215 55.7 215 59.7 L215 126 Z" fill="var(--chart-2)"/>
                <path d="M254 126 L254 2.9 Q254 -1.1 258 -1.1 L263 -1.1 Q267 -1.1 267 2.9 L267 126 Z" fill="var(--chart-1)"/>
                <path d="M270 126 L270 49.5 Q270 45.5 274 45.5 L279 45.5 Q283 45.5 283 49.5 L283 126 Z" fill="var(--chart-2)"/>
                <path d="M322 126 L322 14.8 Q322 10.8 326 10.8 L331 10.8 Q335 10.8 335 14.8 L335 126 Z" fill="var(--chart-1)"/>
                <path d="M338 126 L338 37.6 Q338 33.6 342 33.6 L347 33.6 Q351 33.6 351 37.6 L351 126 Z" fill="var(--chart-2)"/>
                <text x="64" y="140" class="ax2">Mar</text><text x="132" y="140" class="ax2">Apr</text><text x="200" y="140" class="ax2">May</text><text x="268" y="140" class="ax2">Jun</text><text x="336" y="140" class="ax2">Jul</text>
              </svg>
              <div style="display:flex;gap:14px;margin-top:6px">
                <span class="lg-row"><span class="lg-dot" style="background:var(--chart-1)"></span><span class="lg-lab">Applications</span></span>
                <span class="lg-row"><span class="lg-dot" style="background:var(--chart-2)"></span><span class="lg-lab">Approved</span></span>
              </div>
            </div>
            <div class="ds-ov-side">
            <div class="ds-card">
              <div class="ds-card-h">Program distribution</div>
              <div style="display:flex;gap:18px;align-items:center">
                <svg viewBox="0 0 160 160" width="132" height="132" role="img" aria-label="Program distribution">
                  <circle cx="80" cy="80" r="52" fill="none" stroke="var(--chart-1)" stroke-width="16" stroke-dasharray="134.20 192.53" stroke-dashoffset="0" transform="rotate(-90 80 80)"/>
                  <circle cx="80" cy="80" r="52" fill="none" stroke="var(--chart-2)" stroke-width="16" stroke-dasharray="88.50 238.23" stroke-dashoffset="-137.20" transform="rotate(-90 80 80)"/>
                  <circle cx="80" cy="80" r="52" fill="none" stroke="var(--chart-3)" stroke-width="16" stroke-dasharray="55.81 270.92" stroke-dashoffset="-228.87" transform="rotate(-90 80 80)"/>
                  <circle cx="80" cy="80" r="52" fill="none" stroke="var(--chart-4)" stroke-width="16" stroke-dasharray="36.21 290.52" stroke-dashoffset="-287.68" transform="rotate(-90 80 80)"/>
                  <text x="80" y="76" class="ct-big">348</text>
                  <text x="80" y="92" class="ct-sm">applications</text>
                </svg>
                <div class="lg">
                  <div class="lg-row"><span class="lg-dot" style="background:var(--chart-1)"></span><span class="lg-lab">Football Tourism</span><span class="lg-val">42%</span></div>
                  <div class="lg-row"><span class="lg-dot" style="background:var(--chart-2)"></span><span class="lg-lab">Player Management</span><span class="lg-val">28%</span></div>
                  <div class="lg-row"><span class="lg-dot" style="background:var(--chart-3)"></span><span class="lg-lab">Sports Marketing</span><span class="lg-val">18%</span></div>
                  <div class="lg-row"><span class="lg-dot" style="background:var(--chart-4)"></span><span class="lg-lab">Academy</span><span class="lg-val">12%</span></div>
                </div>
              </div>
            </div>
            <div class="ds-card">
              <div class="ds-card-h">Recent activity</div>
              <div class="ds-act-row"><span class="ds-act-ic">{{icon:user:12}}</span><span><span class="ds-act-t"><b>Adaeze Okonkwo</b> was approved for Football Tourism.</span><span class="ds-act-time">12 min ago</span></span></div>
              <div class="ds-act-row"><span class="ds-act-ic">{{icon:credit-card:12}}</span><span><span class="ds-act-t">Payment <b>txn_9Kd2</b> failed and was retried.</span><span class="ds-act-time">1 hr ago</span></span></div>
              <div class="ds-act-row"><span class="ds-act-ic">{{icon:briefcase:12}}</span><span><span class="ds-act-t">Offer <b>Summer Trials</b> was published.</span><span class="ds-act-time">3 hrs ago</span></span></div>
              <div class="ds-act-row"><span class="ds-act-ic">{{icon:graduation-cap:12}}</span><span><span class="ds-act-t">Academy <b>Lagos U17</b> closed registration.</span><span class="ds-act-time">Yesterday</span></span></div>
            </div>
            </div>
          </div>`,
);

/* ── 2. Offers ───────────────────────────────────────────────────────────── */
const offers = screen(
  "offers",
  {
    crumb: "Dashboard / Offers / <b>Overview</b>",
    title: "Offers",
    stats:
      '<span class="ds-hdr-stat"><i style="background: var(--status-good)"></i>18 active</span><span class="ds-hdr-stat"><i style="background: var(--status-warn)"></i>42 applications</span>',
    action: NEW("New offer"),
    tabs: [{ label: "Overview", on: true }, { label: "Categories" }, { label: "Applications" }],
  },
  toolbar("Search offers…", ["Status <b>Active</b>"]) +
    "\n" +
    table(
      [{ label: "Title" }, { label: "Category" }, { label: "Deadline" }, { label: "Status" }],
      [
        [{ v: "Summer Trials 2026" }, { v: "Football Tourism" }, { v: "2026-08-30", num: true }, { v: pill("good", "Active") }],
        [{ v: "Elite Scouting Camp" }, { v: "Player Management" }, { v: "2026-09-14", num: true }, { v: pill("good", "Active") }],
        [{ v: "Brand Ambassador Drive" }, { v: "Sports Marketing" }, { v: "2026-07-31", num: true }, { v: pill("warn", "Closing") }],
        [{ v: "Lagos Academy Intake" }, { v: "Academy" }, { v: "2026-06-30", num: true }, { v: pill(null, "Closed") }],
        [{ v: "Winter Tour Placements" }, { v: "Football Tourism" }, { v: "2026-11-20", num: true }, { v: pill("info", "Draft") }],
      ],
    ),
);

/* ── 3. Programs ─────────────────────────────────────────────────────────── */
const programs = screen(
  "programs",
  {
    crumb: "Dashboard / Programs / <b>Programs</b>",
    title: "Programs",
    stats: '<span class="ds-hdr-stat">12 programs</span><span class="ds-hdr-stat">4 categories</span>',
    action: NEW("New program"),
    tabs: [{ label: "Categories" }, { label: "Programs", on: true }],
  },
  toolbar("Search programs…") +
    "\n" +
    table(
      [{ label: "Title" }, { label: "Subcategory" }, { label: "Dates" }, { label: "Status" }],
      [
        [{ v: "Football Tourism — Spain" }, { v: "Tours" }, { v: "Aug 4 – Aug 18", num: true }, { v: pill("good", "Published") }],
        [{ v: "Player Management Intro" }, { v: "Representation" }, { v: "Sep 1 – Sep 30", num: true }, { v: pill("good", "Published") }],
        [{ v: "Sports Marketing Lab" }, { v: "Brand" }, { v: "Oct 12 – Oct 26", num: true }, { v: pill("info", "Draft") }],
        [{ v: "Academy Scouting Week" }, { v: "Scouting" }, { v: "Jul 7 – Jul 14", num: true }, { v: pill(null, "Archived") }],
        [{ v: "Winter Trials — Portugal" }, { v: "Tours" }, { v: "Dec 2 – Dec 16", num: true }, { v: pill("warn", "Pending") }],
      ],
    ),
);

/* ── 4. Academy ──────────────────────────────────────────────────────────── */
const academy = screen(
  "academy",
  {
    crumb: "Dashboard / Academy / <b>Overview</b>",
    title: "Academy",
    stats: '<span class="ds-hdr-stat">6 academies</span><span class="ds-hdr-stat">218 registrations</span>',
    action: NEW("New academy"),
    tabs: [{ label: "Overview", on: true }, { label: "Registrations" }],
  },
  toolbar("Search academies…") +
    "\n" +
    table(
      [{ label: "Academy" }, { label: "Location" }, { label: "Age range" }, { label: "Price" }, { label: "Status" }],
      [
        [{ v: "Lagos Elite U17" }, { v: "Lagos, NG" }, { v: "15–17" }, { v: "€ 1,240.00", num: true }, { v: pill("good", "Active") }],
        [{ v: "Porto Development" }, { v: "Porto, PT" }, { v: "13–16" }, { v: "€ 980.00", num: true }, { v: pill("good", "Active") }],
        [{ v: "Nairobi Goalkeeping" }, { v: "Nairobi, KE" }, { v: "14–18" }, { v: "€ 640.00", num: true }, { v: pill("warn", "Closing") }],
        [{ v: "Accra Youth Camp" }, { v: "Accra, GH" }, { v: "12–15" }, { v: "€ 520.00", num: true }, { v: pill(null, "Inactive") }],
        [{ v: "Madrid Winter Clinic" }, { v: "Madrid, ES" }, { v: "16–19" }, { v: "€ 1,680.00", num: true }, { v: pill("info", "Draft") }],
      ],
    ),
);

/* ── 5. Players (with detail sheet open) ─────────────────────────────────── */
const playersSheet = `      <div class="ds-sh ds-open-sheet">
        <div class="ds-sh-head">
          <div>
            <div class="ds-sh-l1">Adaeze Okonkwo</div>
            <div class="ds-sh-l2">Midfielder · Nigeria · U19</div>
          </div>
          <button class="ds-icon-btn">{{icon:x:14}}</button>
        </div>
        <div class="ds-tabs" style="margin: 0 15px">
          <span class="ds-tab">Details</span>
          <span class="ds-tab" data-on="1">Assessment</span>
        </div>
        <div class="ds-sh-body">
          <div>
            <div class="ds-sh-sec">Scouting scores</div>
            <div class="ds-score"><span>Technical</span><span class="ds-stars">{{icon:star:13}}{{icon:star:13}}{{icon:star:13}}{{icon:star:13}}<span class="off">{{icon:star:13}}</span></span><b>4.0</b></div>
            <div class="ds-score"><span>Physical</span><span class="ds-stars">{{icon:star:13}}{{icon:star:13}}{{icon:star:13}}<span class="off">{{icon:star:13}}</span><span class="off">{{icon:star:13}}</span></span><b>3.0</b></div>
            <div class="ds-score"><span>Tactical</span><span class="ds-stars">{{icon:star:13}}{{icon:star:13}}{{icon:star:13}}{{icon:star:13}}{{icon:star:13}}</span><b>5.0</b></div>
            <div class="ds-score"><span>Mentality</span><span class="ds-stars">{{icon:star:13}}{{icon:star:13}}{{icon:star:13}}{{icon:star:13}}<span class="off">{{icon:star:13}}</span></span><b>4.0</b></div>
          </div>
          <div class="ds-field">
            <span class="ds-label">Recommendation</span>
            <span class="ds-input" style="justify-content: space-between">Sign — first team pathway {{icon:chevron-down:12}}</span>
          </div>
          <div class="ds-field">
            <span class="ds-label">Scout notes</span>
            <div class="ds-ta">Composed on the ball under pressure. Needs a pre-season strength block before senior minutes.</div>
          </div>
          <div class="ds-switch-row"><span class="ds-switch" data-on="1"></span> Verified by lead scout</div>
        </div>
        <div class="ds-sh-foot">
          <button class="ds-btn" data-variant="outline" data-size="sm">{{icon:download:13}} Download CV</button>
          <button class="ds-btn" data-size="sm">Save assessment</button>
        </div>
      </div>`;

const players = screen(
  "players",
  {
    crumb: "Dashboard / <b>Players</b>",
    title: "Players",
    stats:
      '<span class="ds-hdr-stat"><i style="background: var(--status-good)"></i>156 signed</span><span class="ds-hdr-stat"><i style="background: var(--status-warn)"></i>24 pending</span>',
    action: `<button class="ds-btn" data-variant="outline" data-size="sm">{{icon:download:13}} Export CSV</button>`,
  },
  toolbar("Search players…", ["Level <b>U19</b>"]) +
    "\n" +
    table(
      [{ label: "Player" }, { label: "Position" }, { label: "Nationality" }, { label: "Registered" }, { label: "Status" }],
      [
        [
          { v: idc("AO", "Adaeze Okonkwo", "adaeze.okonkwo@example.com") },
          { v: "Midfielder" },
          { v: "Nigeria" },
          { v: "2026-07-14", num: true },
          { v: pill("good", "Signed") },
        ],
        [
          { v: idc("MS", "Marco Silva", "marco.silva@example.com") },
          { v: "Forward" },
          { v: "Portugal" },
          { v: "2026-07-11", num: true },
          { v: pill("warn", "Pending") },
        ],
        [
          { v: idc("JT", "Joseph Tembo", "j.tembo@example.com") },
          { v: "Goalkeeper" },
          { v: "Zambia" },
          { v: "2026-07-09", num: true },
          { v: pill("info", "Under review") },
        ],
        [
          { v: idc("LM", "Lukas Meyer", "lukas.meyer@example.com") },
          { v: "Defender" },
          { v: "Germany" },
          { v: "2026-07-02", num: true },
          { v: pill(null, "Inactive") },
        ],
      ],
    ),
  playersSheet,
);

/* ── 6. Transactions ─────────────────────────────────────────────────────── */
const transactions = screen(
  "transactions",
  {
    crumb: "Dashboard / <b>Transactions</b>",
    title: "Transactions",
    stats:
      '<span class="ds-hdr-stat"><i style="background: var(--status-good)"></i>€124,500 collected</span><span class="ds-hdr-stat"><i style="background: var(--destructive)"></i>3 failed</span>',
    action: `<button class="ds-btn" data-variant="outline" data-size="sm">{{icon:download:13}} Export</button>`,
  },
  toolbar("Search transactions…") +
    "\n" +
    table(
      [{ label: "Customer" }, { label: "Product" }, { label: "Amount", num: true }, { label: "Date" }, { label: "Status" }],
      [
        [{ v: idc("AO", "Adaeze Okonkwo", "adaeze.okonkwo@example.com") }, { v: "Academy entry" }, { v: "€ 1,240.00", num: true }, { v: "2026-07-14", num: true }, { v: pill("good", "Paid") }],
        [{ v: idc("MS", "Marco Silva", "marco.silva@example.com") }, { v: "Trial package" }, { v: "€ 118.50", num: true }, { v: "2026-07-13", num: true }, { v: pill("danger", "Failed") }],
        [{ v: idc("GL", "Golafly Ltd", "billing@golafly.com") }, { v: "Sponsorship" }, { v: "€ 97,310.25", num: true }, { v: "2026-07-12", num: true }, { v: pill("good", "Paid") }],
        [{ v: idc("JT", "Joseph Tembo", "j.tembo@example.com") }, { v: "Brochure" }, { v: "€ 11.11", num: true }, { v: "2026-07-10", num: true }, { v: pill("warn", "Refunded") }],
      ],
    ),
);

/* ── 7. Partner applications (review sheet open) ─────────────────────────── */
const partnerSheet = `      <div class="ds-sh ds-open-sheet">
        <div class="ds-sh-head">
          <div>
            <div class="ds-sh-l1">Adaeze Okonkwo</div>
            <div class="ds-sh-l2">Scouting partner · Nigeria</div>
          </div>
          <button class="ds-icon-btn">{{icon:x:14}}</button>
        </div>
        <div class="ds-sh-body">
          <div>
            <div class="ds-sh-sec">Applicant</div>
            <dl class="ds-dl">
              <dt>Email</dt><dd>adaeze.okonkwo@example.com</dd>
              <dt>Country</dt><dd>Nigeria</dd>
              <dt>Role</dt><dd>Regional scout</dd>
              <dt>Applied on</dt><dd>2026-07-14</dd>
              <dt>Experience</dt><dd>6 years</dd>
            </dl>
          </div>
          <div>
            <div class="ds-sh-sec">Motivation</div>
            <p style="font-size:12px;line-height:1.55;color:var(--muted-foreground);margin:0">
              Has run a grassroots scouting network in Lagos since 2020 and placed four players into
              European academies. Requesting regional partner status to formalise referrals.
            </p>
          </div>
          <div class="ds-alert" data-tone="warn">{{icon:triangle-alert:15}}<span><b>Duplicate check.</b> An application from this email was rejected in March 2026.</span></div>
        </div>
        <div class="ds-sh-foot">
          <button class="ds-btn" data-variant="destructive" data-size="sm">Reject</button>
          <button class="ds-btn" data-size="sm">{{icon:check:13}} Accept</button>
        </div>
      </div>`;

const partner = screen(
  "partner",
  {
    crumb: "Dashboard / <b>Partner applications</b>",
    title: "Partner applications",
    stats:
      '<span class="ds-hdr-stat"><i style="background: var(--status-warn)"></i>7 awaiting review</span><span class="ds-hdr-stat">41 total</span>',
    action: "",
  },
  toolbar("Search applicants…", ["Status <b>Pending</b>"]) +
    "\n" +
    table(
      [{ label: "Applicant" }, { label: "Country" }, { label: "Role" }, { label: "Applied on" }, { label: "Status" }],
      [
        [{ v: idc("AO", "Adaeze Okonkwo", "adaeze.okonkwo@example.com") }, { v: "Nigeria" }, { v: "Regional scout" }, { v: "2026-07-14", num: true }, { v: pill("warn", "Pending") }],
        [{ v: idc("MS", "Marco Silva", "marco.silva@example.com") }, { v: "Portugal" }, { v: "Academy partner" }, { v: "2026-07-12", num: true }, { v: pill("info", "Under review") }],
        [{ v: idc("KN", "Kwame Nkrumah", "kwame.n@example.com") }, { v: "Ghana" }, { v: "Regional scout" }, { v: "2026-07-09", num: true }, { v: pill("good", "Accepted") }],
        [{ v: idc("EM", "Elena Moreau", "elena.moreau@example.com") }, { v: "France" }, { v: "Agency" }, { v: "2026-07-04", num: true }, { v: pill("danger", "Rejected") }],
      ],
    ),
  partnerSheet,
);

/* ── 8. Settings ─────────────────────────────────────────────────────────── */
const settings = screen(
  "settings",
  {
    crumb: "Dashboard / Settings / <b>Profile</b>",
    title: "Settings",
    action: `<button class="ds-btn" data-size="sm">Save changes</button>`,
    tabs: [{ label: "Profile", on: true }, { label: "Teams" }, { label: "System" }],
  },
  `          <div class="ds-set-grid">
            <div class="ds-card">
              <div class="ds-card-h">Profile</div>
              <div style="display:flex;gap:14px;align-items:center;margin-bottom:14px">
                <span class="ds-avatar" style="width:48px;height:48px;font-size:14px">NA</span>
                <button class="ds-btn" data-variant="outline" data-size="sm">{{icon:upload:13}} Change photo</button>
              </div>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
                <div class="ds-field"><span class="ds-label">First name</span><span class="ds-input">Nathan</span></div>
                <div class="ds-field"><span class="ds-label">Last name</span><span class="ds-input">Adebayo</span></div>
                <div class="ds-field" style="grid-column:1/-1"><span class="ds-label">Email <i>*</i></span><span class="ds-input" data-state="focus">nathan@golafly.com</span><span class="ds-help">Used for sign-in and system notifications.</span></div>
                <div class="ds-field" style="grid-column:1/-1"><span class="ds-label">Role</span><span class="ds-input" style="justify-content:space-between;color:var(--foreground)">Administrator {{icon:chevron-down:12}}</span></div>
              </div>
            </div>
            <div class="ds-card">
              <div class="ds-card-h">Security</div>
              <div style="display:flex;flex-direction:column;gap:12px">
                <div class="ds-field"><span class="ds-label">Current password</span><span class="ds-input">••••••••••</span></div>
                <div class="ds-field"><span class="ds-label">New password</span><span class="ds-input" data-state="error">••••</span><span class="ds-err">{{icon:circle-alert:11}} Must be at least 12 characters.</span></div>
                <div class="ds-switch-row"><span class="ds-switch" data-on="1"></span> Require 2FA for this account</div>
              </div>
              <div class="ds-card-h" style="margin-top:18px">Preferences</div>
              <div style="display:flex;flex-direction:column;gap:10px">
                <div class="ds-switch-row"><span class="ds-switch" data-on="1"></span> Email me when an application needs review</div>
                <div class="ds-switch-row"><span class="ds-switch"></span> Weekly summary digest</div>
                <div class="ds-field"><span class="ds-label">Theme</span>
                  <div style="display:flex;gap:14px;margin-top:2px">
                    <span class="ds-radio"><span class="ds-rad"></span> Light</span>
                    <span class="ds-radio"><span class="ds-rad"></span> Dark</span>
                    <span class="ds-radio"><span class="ds-rad" data-on="1"></span> System</span>
                  </div>
                </div>
              </div>
            </div>
          </div>`,
);

const SHARED_STYLE = `
<style data-local>
  .ds-shell { min-height: 640px; position: relative; }
  .ds-stat-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 10px; margin-bottom: 14px; }
  /* Two columns, not three. The left card is the tall one (funnel + bar
     chart); the right column stacks two shorter cards to match its height,
     so neither column ends in dead space. */
  .ds-ov-grid { display: grid; grid-template-columns: 1.25fr 1fr; gap: 12px; align-items: start; }
  .ds-ov-side { display: flex; flex-direction: column; gap: 12px; }
  .ds-set-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .ds-card { background: var(--card); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 14px; }
  .ds-card-h { font-family: var(--font-heading); font-size: 13px; font-weight: 600; margin-bottom: 12px; }
  .fn { display: flex; flex-direction: column; gap: 7px; }
  .fn-row { display: grid; grid-template-columns: 80px 1fr 38px 38px; gap: 8px; align-items: center; }
  .fn-lab { font-size: 11px; }
  .fn-track { height: 15px; background: var(--muted); border-radius: 3px; overflow: hidden; }
  .fn-bar { display: block; height: 100%; border-radius: 3px; }
  .fn-val { font-family: var(--font-mono); font-size: 11px; text-align: right; font-variant-numeric: tabular-nums; }
  .fn-drop { font-family: var(--font-mono); font-size: 9.5px; color: var(--muted-foreground); text-align: right; }
  .gr { stroke: var(--edge); stroke-width: 1; }
  .ax2 { fill: var(--muted-foreground); font-family: var(--font-mono); font-size: 8px; text-anchor: middle; }
  .ct-big { fill: var(--foreground); font-family: var(--font-heading); font-size: 22px; font-weight: 700; text-anchor: middle; }
  .ct-sm { fill: var(--muted-foreground); font-family: var(--font-mono); font-size: 7px; text-anchor: middle; letter-spacing: 0.1em; text-transform: uppercase; }
  .lg { display: flex; flex-direction: column; gap: 6px; flex: 1; }
  .lg-row { display: flex; align-items: center; gap: 7px; font-size: 11px; }
  .lg-dot { width: 8px; height: 8px; border-radius: 2px; flex: none; }
  .lg-val { margin-left: auto; font-family: var(--font-mono); font-size: 10px; color: var(--muted-foreground); }
  .ds-open-sheet { position: absolute; top: 0; right: 0; bottom: 0; width: 380px; border-radius: 0; border-top: none; border-right: none; border-bottom: none; }
  .ds-score { display: grid; grid-template-columns: 74px 1fr 28px; gap: 8px; align-items: center; padding: 5px 0; font-size: 11.5px; }
  .ds-stars { display: flex; gap: 2px; color: var(--brand-text); }
  .ds-stars .off { color: var(--border); }
  .ds-score b { font-family: var(--font-mono); font-size: 11px; text-align: right; }
</style>
`;

const SCREENS = [
  ["22-screen-overview", overview],
  ["23-screen-offers", offers],
  ["24-screen-programs", programs],
  ["25-screen-academy", academy],
  ["26-screen-players", players],
  ["27-screen-transactions", transactions],
  ["28-screen-partner-applications", partner],
  ["29-screen-settings", settings],
];

for (const [name, html] of SCREENS) {
  // Strip the per-screen placeholder style block; use the shared one.
  const body = html.replace(/\n<style data-local>[\s\S]*?<\/style>\n/, "\n");
  writeFileSync(join(OUT, `${name}.html`), body + SHARED_STYLE, "utf8");
}
console.log(`wrote ${SCREENS.length} screens -> ${OUT}`);
