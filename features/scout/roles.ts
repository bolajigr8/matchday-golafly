/* WHO IS A SCOUT — the single source of truth for the whole app.
 *
 * One /login and one /register serve every non-admin role, so nothing about
 * the URL a person signs in at tells us which dashboard they belong on. The
 * `role` field on the user object returned by /v1/auth/login is the only thing
 * that does, and this file is the only place that interprets it.
 *
 * NO IMPORTS, deliberately. proxy.ts runs in the edge runtime and cannot pull
 * in the session modules, because those import js-cookie. Everything here is
 * plain data and pure functions, so the guard and the client can share it
 * instead of keeping two copies of the role list that drift apart the first
 * time a role is added.
 *
 * ── ROLE VALUES ARE UNVERIFIED ────────────────────────────────────────────
 * The backend types `role` as a bare string and no scouting account exists
 * yet, so the exact strings below are the CONTRACT WE ARE ASKING FOR, not
 * something observed in a response. If the API ends up sending "Scout",
 * "SCOUT" or "scout_user", the comparison here still works — it lowercases
 * first — but "camp_scout" or an id would not. Confirm against a real account
 * before launch; this is the one line that decides where every scout lands.
 * See design/scout-endpoints.md.
 */

/** Roles that belong on /scout. Club reps work the same screens as scouts. */
export const SCOUTING_ROLES = ['scout', 'club', 'club_representative'] as const

export type ScoutingRole = (typeof SCOUTING_ROLES)[number]

/** Where a signed-in non-admin lands. Anything unrecognised — including a
 *  missing role — falls back to the fan dashboard, so a role added on the
 *  backend tomorrow lands somewhere real rather than on a 404. */
export const SCOUT_HOME = '/scout/dashboard'
export const FAN_HOME = '/fan/dashboard'

/** Normalises whatever the API sent. Returns null for absent/garbage. */
export function normaliseRole(role: unknown): string | null {
  return typeof role === 'string' && role.trim() ? role.trim().toLowerCase() : null
}

/** True when this role belongs on the scouting dashboard. */
export function isScoutingRole(role: unknown): boolean {
  const r = normaliseRole(role)
  return r !== null && (SCOUTING_ROLES as readonly string[]).includes(r)
}

/** Roles that belong on /player. */
export const PLAYER_ROLES = ['player'] as const
export const PLAYER_HOME = '/player/dashboard'

export function isPlayerRole(role: unknown): boolean {
  const r = normaliseRole(role)
  return r !== null && (PLAYER_ROLES as readonly string[]).includes(r)
}

/** The dashboard this role belongs on. The fan dashboard is the default, not
 *  a special case — see the fallback note above. */
export function homeForRole(role: unknown): string {
  if (isScoutingRole(role)) return SCOUT_HOME
  if (isPlayerRole(role)) return PLAYER_HOME
  return FAN_HOME
}

/* ── Sign-up ──────────────────────────────────────────────────────────────
   /register creates FAN accounts only. Scouts receive login details from a
   Golafly admin (POST /v1/scouts), and players are onboarded by Golafly, so
   the sign-up form no longer asks which kind of account this is. */

export const SIGNUP_ROLE = 'fan'
