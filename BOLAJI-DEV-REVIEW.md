# Code Review — `bolaji-dev` (Matchday Dashboard)

> Scratch file for pasting into the PR — safe to delete. Reviewed `origin/bolaji-dev`
> against merge-base `0b6377a`. **Not merged.** Couldn't run/build locally (disk full →
> `npm install` ENOSPC), so this is a static review.

## Summary

The branch ships a **full Matchday user dashboard** (8 routes under `app/dashboard/*`,
`components/dashboard/*`, `store/dashboard.ts`) plus a routing restructure. Good structural
instincts, but there are a few **build-breakers**, a **React anti-pattern**, and repo-wide
**style/convention drift** that should be fixed before merge. Also note: this is the
*dashboard*, not eSIM — confirm that's expected.

---

## ✅ What's good (keep doing this)

- **Route groups done right.** Moving `Navbar`/`Footer` out of the root `app/layout.tsx` into
  `app/(landing-page)/layout.tsx`, and giving `/dashboard` its own `layout.tsx` with
  sidebar/topbar, is the correct App-Router pattern. The flights/stays/match pages were all
  moved into the group consistently.
- **Data/layer separation.** `store/dashboard.ts` is well-organized, typed, and uses `as const`.
  Pages stay thin (`page.tsx` → `client.tsx`). Matches the project flow.
- **Theme tokens + framer-motion + lucide** are used throughout — consistent with the rest of the app.

---

## 🔴 Must fix (these break the build / behaviour)

1. **`next/image` with external Wikipedia URLs but no `remotePatterns`.**
   `components/dashboard/home/NextMatchCard.tsx` (`TEAM_BADGES`) renders `<Image>` from
   `upload.wikimedia.org`, but `next.config.ts` has **no `images.remotePatterns`**. next/image
   throws at runtime: *"hostname is not configured under images"*.
   **Fix:** add the host to `next.config.ts`, **or** (better) don't hotlink Wikipedia in prod —
   bundle the crests under `/public` or use plain `<img>`. *Why:* hotlinked SVGs are fragile
   (can 404/move) and next/image needs explicit allow-listing.

2. **`text-background` used as the on-primary text colour (~9 places).**
   e.g. `NextMatchCard.tsx:155/231`, `MatchdayEssentials.tsx:54/85/121`,
   `InboxAndRewards.tsx:52`, `inbox-left-panel.tsx:82/87`, `payment-sidebar.tsx:257`,
   `transaction-methods.tsx:128`, `sidebar.tsx` active state.
   The token for text sitting on a neon `bg-primary` is **`text-primary-foreground`**.
   `text-background` only *looks* right in dark mode (background ≈ black); in **light mode**
   `--background` is near-white → near-invisible label on a neon button.
   **Fix:** replace `text-background` → `text-primary-foreground` on every `bg-primary` element.

3. **Non-standard Tailwind size class `h-4.5 w-4.5`.** `sidebar.tsx:159`, `topbar.tsx:59`.
   `4.5` isn't in the default spacing scale, so nothing is generated and the element collapses.
   **Fix:** use `size-4`/`size-5`, or arbitrary `size-[18px]`.

---

## 🟠 Should fix (anti-pattern + conventions = "the flow")

4. **Mutable module-level export to bridge components — React anti-pattern.**
   `components/dashboard/sidebar.tsx`:
   ```ts
   export let openMobileSidebar: () => void = () => {}
   useEffect(() => { openMobileSidebar = () => setMobileOpen(true) }, [])
   ```
   Mutating a module export from an effect so the topbar can open the drawer is fragile: it isn't
   reactive, breaks with >1 instance, and is order-dependent. **Fix:** lift `mobileOpen` into the
   dashboard `layout.tsx` and pass setters down, or use a small React Context (or the existing
   store pattern). *Why:* state should flow through React, not module globals.

5. **Code style diverges from the entire repo.** The branch is **single-quote + no-semicolon**;
   the codebase is **double-quote + semicolon**. He also reformatted shared files
   (`app/layout.tsx`, `store/data.ts`) fully into his style, which turns small edits into large,
   noisy diffs and makes review/merge harder. **Fix:** match the existing style (or we agree on
   Prettier config and apply it repo-wide in a separate commit — not mixed into a feature PR).

6. **Inconsistent file naming.** `components/dashboard/home/` uses PascalCase
   (`NextMatchCard.tsx`, `MatchdayEssentials.tsx`, `InboxAndRewards.tsx`), but the repo — and his
   own other folders (`inbox/inbox-left-panel.tsx`, `payment/payment-sidebar.tsx`) — use
   **kebab-case**. **Fix:** rename the `home/` files to kebab-case for consistency.

7. **Branch is off a stale base (`0b6377a`) → behind `main`.** Its `store/data.ts` still has the
   old 3-link `NAV_LINKS` and an older Facebook URL, so merging as-is risks **reverting** recent
   redesign work. **Fix:** rebase `bolaji-dev` onto current `main` and resolve `app/layout.tsx`,
   `store/data.ts`, `app/page.tsx` conflicts before merge.

---

## 🟡 Nits

- `inbox` count badge: `count` and `badge` both render in the same flex row in `sidebar.tsx` — fine,
  but consider one consistent "indicator" rather than two parallel `null`-able fields.
- The mobile "Help" link points to `href="#"`. Wire it or mark TODO.
- `DASHBOARD_USER` mixes `name`/`lastName`/`fullName` (`'Adewale O.'`) — redundant; derive `fullName`.

---

## Integration note (for whoever merges)

After this restructure lands, **new top-level pages must live inside `app/(landing-page)/`** to
keep the navbar/footer — including the just-added `app/matches/` and the stadium-tours home.
Plan the rebase so the route group and the new `/matches` route end up in the same place.
