/* Shared shell markup, injected by build.mjs via {{sidebar:<key>}}.

   Every screen card used to carry its own copy of the ~30-line <aside>, so
   changing the nav meant editing eight identical blocks and the first one
   missed would have shown reviewers a nav that no longer exists — on a card
   whose whole job is to be trusted as the spec. One definition, one active
   key per screen. The nav cannot drift now.

   FLAT, deliberately. An earlier revision grouped these under MATCHDAY /
   CAMPS & PROGRAMS / TRAVEL / REVENUE headings to reflect the three
   businesses now sharing this dashboard. Rejected: eleven items do not need
   four headings to be findable, and the headings added a row of chrome
   between the reader and every single link. Order is unchanged from the
   dashboard people already use, so nobody has to relearn where anything is. */

const NAV = [
  ["dashboard", "layout-dashboard", "Dashboard"],
  ["tickets", "ticket", "Tickets"],
  ["offers", "briefcase", "Offers", 42],
  ["programs", "layers", "Programs"],
  ["academy", "graduation-cap", "Academy"],
  ["players", "users", "Players"],
  ["transactions", "credit-card", "Transactions"],
  ["orders", "shopping-bag", "Orders"],
  ["operations", "hotel", "Operations"],
  ["partner-apps", "file-text", "Partner Apps", 7],
  ["settings", "settings", "Settings"],
];

/** Every key the `active` argument accepts — build.mjs fails the build on a
    typo rather than silently rendering a screen with nothing highlighted. */
export const NAV_KEYS = NAV.map(([key]) => key);

/** The expanded 280px sidebar, with one nav item marked active. */
export function sidebar(active) {
  if (!NAV_KEYS.includes(active)) {
    throw new Error(
      `partials.mjs: unknown sidebar key "${active}" — expected one of ${NAV_KEYS.join(", ")}`,
    );
  }

  const nav = NAV.map(([key, icon, label, count]) => {
    const state = key === active ? ' data-state="active"' : "";
    const badge = count == null ? "" : `<span class="ds-sb-count">${count}</span>`;
    return `          <div class="ds-sb-item"${state}>{{icon:${icon}:15}} ${label}${badge}</div>`;
  }).join("\n");

  return `      <aside class="ds-sb">
        <div class="ds-sb-sec">
          <div class="ds-sb-brand"><span class="ds-sb-mark">GOLAFLY</span><span class="ds-sb-tag">Admin</span></div>
        </div>
        <div class="ds-sb-sec">
          <button class="ds-sb-search">{{icon:search:13}} Search…<span class="ds-kbd">⌘K</span></button>
        </div>
        <nav class="ds-sb-nav">
${nav}
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
}

/* ══════════════════════════════════════════════════════════════════════════
   FAN DASHBOARD SHELL

   A different product from the admin, so a different shell — and deliberately
   NOT a reskin of the one above. The admin is used all day at a desk by a
   handful of staff: dense rows, 1px edges, a 32px nav item. The fan opens
   this on a phone, on match day, to find a ticket. That drives every
   difference: bigger targets, softer radii, a solid active pill you can spot
   at a glance, and a bottom tab bar instead of a sidebar under `md`.

   Learned from the travels customer dashboard, which is the closest thing
   Golafly already ships (Desktop/travels/components/dashboard).
   ══════════════════════════════════════════════════════════════════════════ */

/* Four items, matching the acceptance criteria one-for-one: Home is the
   roll-up and the empty state, Tickets is scenario 2, Travel is scenario 3,
   Settings keeps the account reachable without a second login (scenario 5).

   `pending` marks a destination whose endpoint does not exist yet. It renders
   a dot rather than a count — the honest version of a badge, since we cannot
   know how many tickets a fan has until /v1/tickets exists. */
const FAN_NAV = [
  { key: "home", icon: "house", label: "Home" },
  { key: "tickets", icon: "ticket", label: "Tickets", pending: true },
  { key: "travel", icon: "plane", label: "Travel" },
  { key: "settings", icon: "settings", label: "Settings" },
];

export const FAN_NAV_KEYS = FAN_NAV.map((i) => i.key);

function assertFanKey(active) {
  if (!FAN_NAV_KEYS.includes(active)) {
    throw new Error(
      `partials.mjs: unknown fan nav key "${active}" — expected one of ${FAN_NAV_KEYS.join(", ")}`,
    );
  }
}

/** Desktop sidebar, 264px. Hidden under `md`, where the tab bar takes over. */
export function fanSidebar(active) {
  assertFanKey(active);

  const nav = FAN_NAV.map((item) => {
    const state = item.key === active ? ' data-state="active"' : "";
    /* The pending dot sits after the label, not before — it qualifies the
       destination rather than announcing itself. */
    const dot = item.pending ? '<i class="fan-nav-dot" title="Awaiting endpoint"></i>' : "";
    return `          <div class="fan-nav-item"${state}>{{icon:${item.icon}:18}}<span>${item.label}</span>${dot}</div>`;
  }).join("\n");

  return `      <aside class="fan-sb">
        <div class="fan-sb-brand">
          <span class="fan-sb-mark">GOLAFLY</span>
          <span class="fan-sb-tag">Matchday, sorted.</span>
        </div>

        <div class="fan-user">
          <span class="fan-avatar">A</span>
          <span class="fan-user-txt">
            <span class="fan-user-name">Adaeze Okonkwo</span>
            <span class="fan-user-mail">adaeze@example.com</span>
          </span>
        </div>

        <nav class="fan-nav">
${nav}
        </nav>

        <div class="fan-sb-foot">
          <div class="fan-nav-item" data-muted="1">{{icon:log-out:18}}<span>Log out</span></div>
        </div>
      </aside>`;
}

/** Mobile bottom tab bar. Same four destinations, same order — the sidebar
    and the tab bar must never disagree about what exists or where it sits. */
export function fanTabBar(active) {
  assertFanKey(active);

  const tabs = FAN_NAV.map((item) => {
    const state = item.key === active ? ' data-state="active"' : "";
    const dot = item.pending ? '<i class="fan-tab-dot"></i>' : "";
    return `        <div class="fan-tab"${state}><span class="fan-tab-ic">{{icon:${item.icon}:19}}${dot}</span><span class="fan-tab-lab">${item.label}</span></div>`;
  }).join("\n");

  return `      <nav class="fan-tabs">
${tabs}
      </nav>`;
}

/* ══════════════════════════════════════════════════════════════════════════
   SCOUTING DASHBOARD SHELL

   The scout works the way the admin does — all day, at a desk, in tables —
   so this reuses the admin's ds-sb-* shell wholesale rather than inventing a
   third visual language. What differs is the nav itself.

   GROUPED, where the admin sidebar is deliberately flat. That flat decision
   was about eleven destinations of one kind (things you administer); its
   argument was that headings put a row of chrome between the reader and every
   link for no gain. Here there are two genuinely different modes of work —
   evaluating players, and corresponding about them — and nine items rather
   than eleven. The group label is what tells a scout that Messages is not
   another place to score somebody.
   ══════════════════════════════════════════════════════════════════════════ */

/* FLAT, and no search — same rule as the admin sidebar above, by explicit
   instruction. An earlier revision grouped these under SCOUTING /
   COMMUNICATION / ACCOUNT headings because the mockup does. Rejected for the
   same reason the admin nav is flat: headings put a row of chrome between the
   reader and every single link, and nine destinations do not need three
   headings to be findable.

   The mockup's separate "Players" and "Admin" chat entries are collapsed into
   one Messages inbox: they are the same two-pane screen filtered two ways, and
   splitting them in the nav would imply two different places to look for an
   unread message. */
const SCOUT_NAV = [
  ["dashboard", "layout-dashboard", "Dashboard"],
  ["players", "users", "Assigned Players", 24],
  ["evaluations", "clipboard-list", "Evaluations", 7],
  ["reports", "file-text", "Reports"],
  ["comparisons", "chart-column", "Comparisons"],
  ["templates", "layout-template", "Templates"],
  ["messages", "message-square", "Messages", 3],
  ["notifications", "bell", "Notifications", 6],
  ["settings", "settings", "Settings"],
];

/** Every key the `active` argument accepts — build.mjs fails the build on a
    typo rather than silently rendering a screen with nothing highlighted. */
export const SCOUT_NAV_KEYS = SCOUT_NAV.map(([key]) => key);

/** The expanded scouting sidebar, with one nav item marked active. */
export function scoutSidebar(active) {
  if (!SCOUT_NAV_KEYS.includes(active)) {
    throw new Error(
      `partials.mjs: unknown scout nav key "${active}" — expected one of ${SCOUT_NAV_KEYS.join(", ")}`,
    );
  }

  const nav = SCOUT_NAV.map(([key, icon, label, count]) => {
    const state = key === active ? ' data-state="active"' : "";
    const badge = count == null ? "" : `<span class="ds-sb-count">${count}</span>`;
    return `          <div class="ds-sb-item"${state}>{{icon:${icon}:15}} ${label}${badge}</div>`;
  }).join("\n");

  return `      <aside class="ds-sb">
        <div class="ds-sb-sec">
          <div class="ds-sb-brand"><span class="ds-sb-mark">GOLAFLY</span><span class="ds-sb-tag">Scouting</span></div>
        </div>
        <nav class="ds-sb-nav">
${nav}
        </nav>
        <div class="ds-sb-sec">
          <div class="sc-impact">
            <span class="sc-impact-h">{{icon:trophy:13}} Scouting impact</span>
            <span class="sc-impact-n">18</span>
            <span class="sc-impact-l">reports published</span>
            <span class="sc-impact-track"><i style="width: 72%"></i></span>
          </div>
        </div>
        <div class="ds-sb-sec">
          <div class="ds-sb-util">
            <button class="ds-icon-btn" data-dot="1">{{icon:bell:15}}</button>
            <button class="ds-icon-btn">{{icon:panel-left-close:15}}</button>
            <span class="ds-seg"><span class="ds-seg-btn" data-on="1">{{icon:sun:13}}</span><span class="ds-seg-btn">{{icon:moon:13}}</span></span>
          </div>
        </div>
        <div class="ds-sb-sec">
          <div class="ds-sb-user">
            <span class="ds-avatar">JC</span>
            <span><span class="ds-sb-user-name">James Carter</span><span class="ds-sb-user-role">UEFA A Licence Scout</span></span>
            {{icon:chevrons-up-down:13}}
          </div>
        </div>
      </aside>`;
}

/* ── Evaluation step rail ──────────────────────────────────────────────────
   Eight steps, shown on five different cards. One definition for the same
   reason the sidebar has one: five hand-copied rails would let the step list
   disagree with itself across the very cards meant to specify it.

   Order is the order a scout fills it in, and it is also the order the report
   renders — profile first because it is context, review last because it is the
   only irreversible action. */
const EVAL_STEPS = [
  ["profile", "Profile", "Player context"],
  ["technical", "Technical", "Seven core attributes"],
  ["tactical", "Tactical", "Red / amber / green"],
  ["physical", "Physical", "Athletic profile"],
  ["mentality", "Mentality", "Attitude & coachability"],
  ["development", "Development Plan", "What to work on"],
  ["summary", "Summary", "Scout's written verdict"],
  ["review", "Review & Submit", "Validate, then send"],
];

export const EVAL_STEP_KEYS = EVAL_STEPS.map(([key]) => key);

/** The eight-step rail. Everything before `active` renders done, `active`
    renders current, everything after renders pending — derived from position
    rather than hand-flagged, so a rail can never show step 5 done and step 2
    pending. */
export function evalSteps(active) {
  const at = EVAL_STEP_KEYS.indexOf(active);
  if (at === -1) {
    throw new Error(
      `partials.mjs: unknown evaluation step "${active}" — expected one of ${EVAL_STEP_KEYS.join(", ")}`,
    );
  }

  const rows = EVAL_STEPS.map(([key, label, hint], i) => {
    const state = i < at ? "done" : i === at ? "current" : "pending";
    const status = i < at ? "Completed" : i === at ? "In progress" : hint;
    const mark = i < at ? "{{icon:check:12}}" : String(i + 1);
    return (
      `          <div class="sc-step" data-state="${state}">` +
      `<span class="sc-step-n">${mark}</span>` +
      `<span class="sc-step-t"><b>${label}</b><i>${status}</i></span>` +
      `${i === at ? "{{icon:arrow-right:13}}" : ""}</div>`
    );
  }).join("\n");

  /* Percent complete is derived from the same index, so the bar and the rail
     can never tell the reader two different things. */
  const pct = Math.round((at / EVAL_STEPS.length) * 100);

  return `      <div class="sc-steps">
        <div class="sc-steps-h">
          <span class="ds-card-h" style="margin: 0">Evaluation progress</span>
          <span class="sc-steps-pct">${pct}% complete</span>
        </div>
        <div class="ds-prog"><span style="width: ${pct}%"></span></div>
        <div class="sc-steps-list">
${rows}
        </div>
      </div>`;
}
