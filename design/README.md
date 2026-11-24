# Golafly — design system bundle

Source for **three** design-system projects on claude.ai/design. One build, one
set of tokens, three component layers — see `CSS_BY_PROJECT` in `build.mjs`.

| Project | id | Implemented in | CSS |
|---|---|---|---|
| Golafly Admin | `9762771c-5d70-45b8-9cb9-0148cc3a3f54` | `app/admin` | kit + shell + data + components + refinements |
| Golafly Fan | `4f6bbe0d-9255-46ff-acc6-1c4c499433c2` | `app/dashboard` | fan.css |
| Golafly Scouting | `29fafb28-13e2-4495-91b8-e0067587d83e` | `app/scout` (not built yet) | the admin stack + scout.css |

Scouting deliberately reuses the admin component layer rather than inventing a
third visual language: a scout works the way an admin does, all day at a desk,
in tables. `scout.css` adds only what evaluation needs — the 1–10 score scale,
the red/amber/green column, the eight-step rail, the percentile bar.

**Sidebar rule, all three: flat, and no search box.** Group headings put a row
of chrome between the reader and every link. A grouped scouting nav was built
from the mockup and removed.

This dashboard now runs **three businesses**: golafly.com (camps, programs,
academies), matchday (match tickets) and golaflytravels.com (flights, stays,
eSIMs). That is what drove the nav regrouping and the Overview rewrite — see
`tickets-endpoint.md` for the one stream that still has no backend.

## Commands

```bash
node design/build.mjs          # src/ + css/ -> dist/  (run before every upload)
node design/serve.mjs 4180     # preview dist/ at http://localhost:4180
node design/verify-contrast.mjs # audit the brand tokens (10 pairs)
node design/gen-icons.mjs      # regenerate icons.mjs (only when icons change)
node design/gen-chart-card.mjs # regenerate the chart-forms card's SVG geometry
node design/gen-overview-card.mjs # regenerate the two Overview cards
```

`build.mjs` and `verify-contrast.mjs` both exit non-zero on failure, so either
is safe to gate an upload on.

`gen-icons.mjs` reads real lucide geometry from the repo's own
`node_modules/lucide-react` — run `npm install` at the root first, or point
`LUCIDE_ICONS_DIR` at another checkout's copy. It stamps the resolved lucide
version into the generated header.

## Generated cards

Two cards are emitted by scripts rather than hand-written, both because the
arithmetic is where bugs hide. **Edit the generator, never the fragment** —
`build.mjs` will happily rebuild a hand-edited fragment, and the next generator
run will silently discard the edit.

| Generator | Emits |
|---|---|
| `gen-chart-card.mjs` | `src/charts/07-chart-forms.html` — donut dash offsets, rounded-top bars |
| `gen-overview-card.mjs` | `src/screens/22-screen-overview.html` + `src/screens/22b-overview-day-one.html` — the 3-series stacked bar with surface gaps, and three mini sparklines |

`gen-overview-card.mjs` also holds the **stream → chart slot** mapping
(Matchday `--chart-1`, Camps `--chart-2`, Travel `--chart-3`). Slots follow nav
order, never revenue rank: rank moves week to week, and colour that follows it
repaints the dashboard every time a stream has a good month. `partials.mjs`
repeats the same three tokens for the sidebar group dots — keep the two in step.

## How it works

- **Tokens are extracted, never copied.** `build.mjs` parses the `:root` and
  `.dark` blocks straight out of `app/globals.css` and re-emits them scoped to
  `[data-theme]`. A token change in the app propagates on the next build, so
  the design system cannot drift.
- **`css/tokens.overrides.css` is the deliverable.** It holds the additions
  that do *not* exist in the app yet — the replacement `--chart-1..5` ramp and
  the `--status-*` tones. Once approved, paste those blocks into
  `app/globals.css`.
- **`src/**/*.html` are body fragments**, not documents: markup plus an
  optional trailing `<style data-local>` block. No doctype, no `<head>`, no
  marker, no tokens — `build.mjs` wraps all of that.
- **Light and dark come from one fragment.** For `mode: "dual"` the build
  renders the fragment twice, into two sibling panels carrying
  `data-theme="light"` / `"dark"`. Both paint in a single static screenshot,
  and the two themes can never diverge structurally because the markup is the
  same string.
- **Cards are self-contained.** A strict CSP blocks every external request, so
  all CSS is inlined and icons are inline SVG. The self-check fails the build
  on any `http(s)://`, `@import`, `<link>`, or `<script src>`.

## Placeholders available in fragments

| Placeholder | Expands to |
|---|---|
| `{{icon:users}}` / `{{icon:users:20}}` | inline lucide SVG at 16px / 20px |
| `{{sidebar:orders}}` | the shared 280px admin sidebar, with that nav item active |
| `{{scoutnav:evaluations}}` | the scouting sidebar, with that nav item active |
| `{{evalsteps:tactical}}` | the eight-step evaluation rail, states derived from position |
| `{{val:--brand}}` | that token's value **in the current panel's theme** |
| `{{hex:--brand}}` | the same value as hex, matching what the browser paints |

`{{sidebar:…}}` is defined once in `partials.mjs`, which also owns the nav
grouping and the valid key list — an unknown key fails the build rather than
rendering a screen with nothing highlighted. Every screen card uses it. It
exists because the sidebar used to be copy-pasted into all eight screen
fragments, so regrouping the nav for three businesses meant eight identical
edits and the first one missed would have shown reviewers a nav that no longer
existed, on a card whose job is to be trusted as the spec.

`{{hex:...}}` clips out-of-gamut colours per channel because that is what
Chrome does — verified against live canvas readback. Chroma reduction would
print colours no browser shows.

## Adding a card

1. Write the fragment under `src/<group>/`.
2. Add an entry to `cards.mjs` (path, group, name, subtitle, viewport, mode).
3. `node design/build.mjs`, then check the height in a browser — the viewport
   height must be **at least** the rendered `scrollHeight` at width 1200, or
   the card gets cropped. Keep cards under ~1400px tall so thumbnails stay
   legible; split a card rather than letting it grow.
4. Upload with DesignSync `write_files`, then `register_assets`.

## Uploading

A `planId` does not survive across sessions, so **call `finalize_plan` first**
every time — it needs both `writes` and `deletes` (pass `deletes: []`), and
`localDir` must be `design/dist`. Globs that cover the whole bundle:

```
foundations/*.html  charts/*.html  shell/*.html  data/*.html
components/*.html   overlays/*.html  screens/*.html
```

**Upload every card, not just the ones you edited.** The shared CSS and the
inline icon set are baked into all 28 files, so touching one token or one icon
changes every byte-for-byte output. Uploading only the "changed" fragments
leaves the rest stale.

`build.mjs` prints a ready-to-paste `register_assets` payload. Call it after
`write_files`: the `@dsCard` marker's `group` is the documented mechanism, but
`name` / `subtitle` / `viewport` are not, and explicit registration is what
reliably populates the pane.

## Groups

Numeric prefixes (`1 · Foundations`) because the pane's group ordering is
undocumented — the prefix pins reading order and still reads as a heading.

Admin: `1 · Foundations` · `2 · Charts` · `3 · App Shell` · `4 · Components` ·
`5 · Data & Tables` · `6 · Overlays` · `7 · Patterns` · `8 · Screens`

Scouting: `1 · Shell & controls` · `2 · Auth & access` · `3 · Screens` ·
`4 · Evaluation` · `5 · Report` · `6 · Communication` · `7 · Account & templates`

## Card heights are measured, not guessed

`viewport.height` must be **at least** the real rendered height at the declared
width, or the pane crops the card. Measure it — load the built file in an
iframe collapsed to 60px tall and read `body.getBoundingClientRect().height`.
Sizing an iframe to the declared height makes every card *appear* to fit.

Two traps this bundle has already hit:

- **A `dual` card renders the fragment twice, side by side.** Each panel is
  only ~700px at a 1500px card, so a multi-column layout inside a dual
  fragment collapses. Dual fragments are single-column and grow downward.
- **`out` paths are not unique across projects.** `shell/01-shell.html` exists
  in both fan and scouting. Scripted edits to `cards.mjs` must key on `src`,
  which is unique, or they will silently rewrite the wrong project's card.
