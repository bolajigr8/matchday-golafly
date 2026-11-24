/* The scouting side's view of the signed-in user.
 *
 * ── THE ONLY FILE IN features/scout THAT TOUCHES features/fan ─────────────
 *
 * One /login and one /register serve every non-admin role, so a scout and a
 * fan sign in through the same endpoint and receive the same session cookie.
 * That cookie is named `golafly_fan_token` for historical reasons — it was
 * built for the fan dashboard first — but it is the SHARED USER SESSION, not
 * a fan-only artefact. Two cookies would mean two logins, which is the thing
 * we were explicitly asked not to build.
 *
 * The fan dashboard is owned by someone else. So rather than let twenty
 * scouting files import from features/fan and turn every fan refactor into a
 * scouting outage, the dependency is confined to THIS FILE. Everything else
 * under features/scout, components/scout and app/scout imports from here.
 * If the fan side renames its cookie or reshapes its session, exactly one
 * file needs changing and the compiler will point at it.
 *
 * Nothing here writes. Sign-in and sign-out belong to the shared auth flow
 * that already exists; a scout screen only ever reads who is signed in, and
 * clearing a session it does not own is how two dashboards start fighting
 * over one cookie.
 */

import { getFanToken, getFanUser, type FanSessionUser } from '@/features/fan/session'
import { isScoutingRole, normaliseRole } from './roles'

/** The signed-in user, as the scouting dashboard sees them. Structurally the
 *  shared session user — aliased so scouting code never says "fan". */
export type ScoutSessionUser = FanSessionUser

/** The bearer token for scouting requests. Same session, same token. */
export function getScoutToken(): string | null {
  return getFanToken()
}

export function getScoutUser(): ScoutSessionUser | null {
  return getFanUser()
}

/** This user's normalised role, or null when the API did not send one. */
export function getScoutRole(): string | null {
  return normaliseRole(getScoutUser()?.role)
}

/** True when the signed-in user belongs on /scout at all.
 *
 *  Note the null-role case passes, matching proxy.ts: the role is optional on
 *  the API's user object, and locking a scout out over a field the backend
 *  has not started sending yet would be worse than showing them a dashboard
 *  whose requests the API will scope correctly anyway. */
export function isScoutSession(): boolean {
  const role = getScoutRole()
  return role === null || isScoutingRole(role)
}

/** "James Carter" → "JC". Two letters, matching the admin's avatar. */
export function scoutInitials(name: string | null | undefined): string {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'GF'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

/** "James Carter" → "James". Used for the dashboard greeting. */
export function scoutFirstName(name: string | null | undefined): string {
  const trimmed = (name ?? '').trim()
  return trimmed ? trimmed.split(/\s+/)[0] : 'there'
}
