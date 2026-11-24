'use client'

import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { QueryKeys } from '@/models/query'
import { fanApiMessage } from '@/services/fan-axios'
import { ScoutPortalService } from '@/services/scout-portal'
import { useFanAuth } from '@/store/fan-auth'
import { getScoutToken } from './session'
import {
  EVAL_SCHEMA,
  groupAverage,
  isEvaluated,
  overallAverage,
  reviewState,
  type AssignedPlayer,
  type SaveEvaluationPayload,
} from './evaluation'

/* React Query bindings for the scouting dashboard.
 *
 * ── ONE REQUEST FEEDS FIVE SCREENS ────────────────────────────────────────
 * GET /v1/scout/players returns every assigned player WITH their evaluation
 * attached. The dashboard counters, the players table, Reports and Comparisons
 * are all projections of that one response, so they are derived here as plain
 * functions over the cached list rather than as four more queries. Five
 * screens, one round trip, and no way for the dashboard to claim six pending
 * while the table shows five.
 *
 * ── EVERY READ IS GATED ON THE TOKEN ──────────────────────────────────────
 * Same as features/fan/hooks.ts, and for the same reason: a signed-out render
 * that fires a request guaranteed to 401 also trips the shared response
 * interceptor, which clears a session that was never there.
 *
 * ── THE FIXTURES ARE GONE ─────────────────────────────────────────────────
 * Every read used to run through withMock(real, fixture), falling back to
 * sample data on a 404/405 because none of these endpoints existed. They exist
 * now. A screen that invents 24 players when a call fails is how a broken
 * endpoint ships unnoticed, so failures surface as failures — the shared
 * QueryTable already renders the endpoint and status for exactly this.
 */

const enabled = () => typeof window !== 'undefined' && !!getScoutToken()

/** The signed-in scout, hydrated from the shared session store. Reuses the
 *  fan store rather than standing up a second one: there is one session, so a
 *  second store would be a second copy of the same cookie that can disagree
 *  with the first. */
export function useScoutSession() {
  const hydrate = useFanAuth((s) => s.hydrate)
  const hasHydrated = useFanAuth((s) => s.hasHydrated)
  const user = useFanAuth((s) => s.user)

  useEffect(() => {
    if (!hasHydrated) hydrate()
  }, [hasHydrated, hydrate])

  /* Returns the STORE value only — never a direct cookie read.
   *
   * An earlier version fell back to getScoutUser() "for the first client
   * render before the store is filled". That is a hydration mismatch by
   * construction: the server has no cookies and renders "there", the first
   * client render reads the real cookie and renders "James", React sees two
   * different trees and throws away the server HTML. It showed up as
   * "Hydration failed because the server rendered text didn't match" on every
   * scouting page, because the sidebar and the greeting are on all of them.
   *
   * store/fan-auth.ts documents this exact trap and starts EMPTY for the same
   * reason. hydrate() fills it after mount, when both sides already agree on
   * what they rendered. */
  return { user, hasHydrated }
}

/* ── Reads ────────────────────────────────────────────────────────────── */

/** Every player assigned to this scout, with their evaluations. The source
 *  for the dashboard, the players table, Reports and Comparisons. */
export function useAssignedPlayers() {
  return useQuery({
    queryKey: [QueryKeys.Scout_Assigned_Players],
    queryFn: () => ScoutPortalService.listAssignedPlayers(),
    enabled: enabled(),
    staleTime: 30 * 1000,
  })
}

/** One assigned player, with the full profile the list omits. */
export function useAssignedPlayer(id: number | null) {
  return useQuery({
    queryKey: [QueryKeys.Scout_Player, id],
    queryFn: () => ScoutPortalService.getAssignedPlayer(id as number),
    enabled: enabled() && !!id,
  })
}

/* ── Writes ───────────────────────────────────────────────────────────── */

/** Upsert the whole evaluation.
 *
 *  There is no draft/submit cycle on this API — one PUT replaces the document,
 *  and `status` is what separates a scout's work from an approved one. So the
 *  wizard saves the same way whether it is halfway through or finished, and
 *  "submit" is nothing more than the last save.
 *
 *  SILENT on success. The wizard saves as you move between steps, and a toast
 *  that fires that often becomes noise a scout learns to dismiss unread —
 *  including the one that matters. The AutoSave readout reports it instead. */
export function useSaveEvaluation(playerId: number | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: SaveEvaluationPayload) =>
      ScoutPortalService.saveEvaluation(playerId as number, payload),
    onSuccess: () => {
      /* Both caches: the detail this wizard reads, and the list every other
         screen counts. Invalidate rather than seed — the response is the
         evaluation alone, and the list holds player-and-evaluation. */
      qc.invalidateQueries({ queryKey: [QueryKeys.Scout_Player, playerId] })
      qc.invalidateQueries({ queryKey: [QueryKeys.Scout_Assigned_Players] })
    },
    onError: (error: unknown) =>
      toast.error('Changes not saved', { description: fanApiMessage(error) }),
  })
}

/* ── Derived views ────────────────────────────────────────────────────────
   Plain functions over the cached list, not queries. Each screen calls
   useAssignedPlayers() and projects it, so there is exactly one fetch and
   exactly one set of numbers. */

export interface ScoutCounts {
  assigned: number
  not_started: number
  pending: number
  needs_revision: number
  approved: number
  rejected: number
}

export function countsFor(players: AssignedPlayer[] | undefined): ScoutCounts {
  const list = players ?? []
  const counts: ScoutCounts = {
    assigned: list.length,
    not_started: 0,
    pending: 0,
    needs_revision: 0,
    approved: 0,
    rejected: 0,
  }
  for (const p of list) counts[reviewState(p.evaluation)] += 1
  return counts
}

/** Players who have actually been scored. What Reports lists. */
export const evaluatedOnly = (players: AssignedPlayer[] | undefined) =>
  (players ?? []).filter(p => isEvaluated(p.evaluation))

/** Mean overall across every scored player, or null when none are. The one
 *  dashboard number that is not a count. */
export function averageScore(players: AssignedPlayer[] | undefined): number | null {
  const scores = evaluatedOnly(players)
    .map(p => overallAverage(p.evaluation))
    .filter((n): n is number => n !== null)
  if (scores.length === 0) return null
  return scores.reduce((a, b) => a + b, 0) / scores.length
}

/** One row of the comparison table: a player and their four group averages. */
export interface ComparisonRow {
  player: AssignedPlayer
  groups: Record<string, number | null>
  overall: number | null
}

export function comparisonRows(players: AssignedPlayer[] | undefined): ComparisonRow[] {
  return (players ?? []).map(player => ({
    player,
    groups: Object.fromEntries(
      EVAL_SCHEMA.map(g => [g.key, groupAverage(player.evaluation, g.key)]),
    ),
    overall: overallAverage(player.evaluation),
  }))
}
