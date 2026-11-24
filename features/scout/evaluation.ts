import type { ApiPlayer } from '@/services/players'

/* ══════════════════════════════════════════════════════════════════════════
   THE EVALUATION CONTRACT — one file, because everything disagrees otherwise.
   ══════════════════════════════════════════════════════════════════════════

   One evaluation per player. Not per assignment, not per camp: the API keys it
   on the PLAYER id, and `PUT /v1/players/{id}/evaluation` is a whole-document
   upsert. There is no draft/submit cycle and no separate evaluation resource —
   `status` is the only thing that distinguishes a scout's work in progress
   from one an admin has approved.

   ── THREE THINGS THAT WILL BITE YOU ───────────────────────────────────────

   1. AN EMPTY GROUP COMES BACK AS `[]`, NOT `{}`.
      PHP serialises an empty associative array as a JSON list, so a player
      nobody has scored returns `"technical": []`. Reach into that and
      `.passing` is undefined; loop it with Object.entries and you get nothing,
      silently. Never touch a group directly — go through `group()` below.

   2. AN UNEVALUATED PLAYER STILL HAS AN `evaluation` OBJECT.
      All nulls, with `id: null`. So "has this been evaluated" is
      `evaluation.id !== null` — `evaluation != null` is true for everybody and
      would mark the whole register as done. Use `isEvaluated()`.

   3. THE PATH TAKES A PLAYER ID, NOT AN EVALUATION ID.
      `evaluation.id` exists and is tempting and is wrong. Player ids are
      numbers; scout ids (services/scouts.ts) are ULID strings. */

/* ── Status ───────────────────────────────────────────────────────────────
   Three admin rulings, as before the redesign: Approve, Needs revision,
   Reject.

   "pending" and "approved" are observed in real responses. "rejected" and
   "needs_revision" are the values the admin screen sends for the other two
   rulings. If the API refuses "needs_revision", the admin hook falls back to
   "pending" and keeps the admin's note — so the scout still sees what to
   change — and says so in the toast. See useRequestEvaluationChanges.

   `note` is the ADMIN's field. The scout wizard no longer writes its own note
   into it; it sends the stored one back unchanged, because the PUT replaces
   the whole document. */

export const EVALUATION_STATUSES = ['pending', 'needs_revision', 'approved', 'rejected'] as const
export type EvaluationStatus = (typeof EVALUATION_STATUSES)[number]

export const STATUS_LABEL: Record<string, string> = {
  pending: 'Pending review',
  needs_revision: 'Needs revision',
  approved: 'Approved',
  rejected: 'Rejected',
}

/** Whatever the API sent, in words. Unknown values are shown as-is rather than
 *  folded into "Pending" — a status we do not recognise is worth seeing. */
export const statusLabel = (s: string | null | undefined) =>
  s ? (STATUS_LABEL[s] ?? s) : 'Not evaluated'

export type ReviewState = 'not_started' | EvaluationStatus

/** Where an evaluation sits in the review loop, including "never scored".
 *  One function so every screen buckets a player the same way. */
export function reviewState(e: PlayerEvaluation | null | undefined): ReviewState {
  if (!isEvaluated(e)) return 'not_started'
  if (e.status === 'approved' || e.status === 'rejected' || e.status === 'needs_revision') {
    return e.status
  }
  /* "returned" is what the original scouting contract called it. */
  if (e.status === 'returned') return 'needs_revision'
  return 'pending'
}

export const reviewLabel = (e: PlayerEvaluation | null | undefined) => {
  const state = reviewState(e)
  return state === 'not_started' ? 'Not evaluated' : STATUS_LABEL[state]
}

/** A scout can no longer edit once the admin has ruled for good. Needs
 *  revision reopens it; so does an admin moving it back to pending. */
export const isLockedForScout = (e: PlayerEvaluation | null | undefined) => {
  const state = reviewState(e)
  return state === 'approved' || state === 'rejected'
}

/* ── Shapes ───────────────────────────────────────────────────────────────
   Groups are typed loosely on purpose: `[] | Record<string, number>` is what
   the wire actually carries, and pretending otherwise moves the problem from
   the type system into a runtime crash. `group()` is the only way in. */

export type ScoreGroup = Record<string, number> | unknown[]

export interface DevelopmentPlan {
  focus?: string
  timeline?: string
}

export interface EvaluationSummary {
  headline?: string
  recommendation?: string
}

export interface PlayerEvaluation {
  /** null until somebody scores this player. The evaluated/not test. */
  id: number | null
  player_id: number
  technical: ScoreGroup
  tactical: ScoreGroup
  physical: ScoreGroup
  mental: ScoreGroup
  development_plan: DevelopmentPlan | unknown[]
  summary: EvaluationSummary | unknown[]
  good: number | null
  potential: number | null
  provisional_score: number | null
  status: string | null
  note: string | null
  created_at: string | null
  updated_at: string | null
}

/** A player as the scout portal returns them — the admin player record with
 *  the evaluation attached. The list endpoint sends a trimmed player; the
 *  detail endpoint sends all of it. Same type, optional fields. */
export type AssignedPlayer = ApiPlayer & { evaluation: PlayerEvaluation }

/** What PUT /v1/players/{id}/evaluation accepts. Every field, every time —
 *  it replaces the document rather than merging, so a partial body would blank
 *  out the groups it omits. */
export interface SaveEvaluationPayload {
  technical: Record<string, number>
  tactical: Record<string, number>
  physical: Record<string, number>
  mental: Record<string, number>
  development_plan: DevelopmentPlan
  summary: EvaluationSummary
  good: number | null
  potential: number | null
  provisional_score: number | null
  status: string
  note: string
}

/* ── Normalisers ──────────────────────────────────────────────────────────
   See trap 1. Used by every read; nothing else may touch a raw group. */

export function group(g: ScoreGroup | undefined | null): Record<string, number> {
  return g && !Array.isArray(g) ? g : {}
}

export function plan(p: DevelopmentPlan | unknown[] | undefined | null): DevelopmentPlan {
  return p && !Array.isArray(p) ? p : {}
}

export function summary(
  s: EvaluationSummary | unknown[] | undefined | null,
): EvaluationSummary {
  return s && !Array.isArray(s) ? s : {}
}

/** See trap 2.
 *
 *  A type guard, not a boolean, so a `true` here also narrows away the null
 *  and undefined for the caller — otherwise every screen that checks this
 *  still has to re-check the same thing to read a field off it. */
export function isEvaluated(
  e: PlayerEvaluation | null | undefined,
): e is PlayerEvaluation {
  return !!e && e.id !== null
}

/* ── The general schema ───────────────────────────────────────────────────
   The four scored groups with the eighteen outfield attributes every player
   was scored on before position templates existed.

   It is no longer what the wizard asks for — features/scout/templates.ts
   picks a template from the player's position — but it stays as the
   "General outfield" template: the fallback for a player with no recognised
   position, and the shape every evaluation written before templates holds.
   Screens never read this directly; they go through templateFor(). */

export interface EvalGroupSpec {
  key: 'technical' | 'tactical' | 'physical' | 'mental'
  label: string
  hint: string
  fields: { key: string; label: string; hint?: string }[]
}

export const EVAL_SCHEMA: EvalGroupSpec[] = [
  {
    key: 'technical',
    label: 'Technical',
    hint: 'On the ball',
    fields: [
      { key: 'first_touch', label: 'First touch' },
      { key: 'passing', label: 'Passing' },
      { key: 'dribbling', label: 'Dribbling' },
      { key: 'shooting', label: 'Shooting' },
      { key: 'heading', label: 'Heading' },
    ],
  },
  {
    key: 'tactical',
    label: 'Tactical',
    hint: 'Reading the game',
    fields: [
      { key: 'positioning', label: 'Positioning' },
      { key: 'decision_making', label: 'Decision making' },
      { key: 'off_the_ball', label: 'Off the ball' },
      { key: 'defensive_shape', label: 'Defensive shape' },
    ],
  },
  {
    key: 'physical',
    label: 'Physical',
    hint: 'Athletic profile',
    fields: [
      { key: 'pace', label: 'Pace' },
      { key: 'acceleration', label: 'Acceleration' },
      { key: 'stamina', label: 'Stamina' },
      { key: 'strength', label: 'Strength' },
      { key: 'agility', label: 'Agility' },
    ],
  },
  {
    key: 'mental',
    label: 'Mental',
    hint: 'Attitude and application',
    fields: [
      { key: 'composure', label: 'Composure' },
      { key: 'work_rate', label: 'Work rate' },
      { key: 'concentration', label: 'Concentration' },
      { key: 'leadership', label: 'Leadership' },
    ],
  },
]

/** Scores are 1–10. Stated once so the wizard, the templates table and the
 *  bars cannot disagree about what a 7 means. */
export const SCORE_MIN = 1
export const SCORE_MAX = 10

/* ── Derived numbers ──────────────────────────────────────────────────────
   All of these ignore unscored fields rather than treating a blank as zero: a
   half-finished evaluation averaging 3.5 because nine attributes are missing
   would read as a bad player rather than an unfinished job. */

/** Mean of the scored fields in one group, or null when none are scored. */
export function groupAverage(
  evaluation: PlayerEvaluation | null | undefined,
  key: EvalGroupSpec['key'],
): number | null {
  const scores = Object.values(group(evaluation?.[key])).filter(
    (n): n is number => typeof n === 'number' && Number.isFinite(n),
  )
  if (scores.length === 0) return null
  return scores.reduce((a, b) => a + b, 0) / scores.length
}

/** Mean across all four groups, weighting each group equally rather than each
 *  attribute — otherwise Technical's five fields would outvote Mental's four
 *  for no reason anybody chose. */
export function overallAverage(
  evaluation: PlayerEvaluation | null | undefined,
): number | null {
  const groups = EVAL_SCHEMA.map(g => groupAverage(evaluation, g.key)).filter(
    (n): n is number => n !== null,
  )
  if (groups.length === 0) return null
  return groups.reduce((a, b) => a + b, 0) / groups.length
}

/** One decimal, or an em dash. Every score in the UI goes through this so the
 *  tables line up and nothing renders 7.000000001. */
export const score = (n: number | null | undefined) =>
  typeof n === 'number' && Number.isFinite(n) ? n.toFixed(1) : '—'
