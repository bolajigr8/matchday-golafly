/* Wording and small shared vocabulary for the scouting screens.
 *
 * Status wording lives in features/scout/evaluation.ts, next to the values it
 * describes. What is left here is the two things that are presentation only:
 * the red/amber/green banding a score is DRAWN with, and the steps the
 * evaluation wizard is filled in through.
 *
 * This file used to also carry development priorities and notification types.
 * Both belonged to the invented /v1/scouting/* contract; the API that shipped
 * has neither, so they are gone rather than left as vocabulary for a feature
 * nobody can build against.
 */

/* ── Banding ──────────────────────────────────────────────────────────────
   DERIVED from the score, never stored. The API sends a number 1–10 and
   nothing else, so a band that came down the wire would be a second source of
   truth for the same fact — and the first time they disagreed, the colour
   would be the one people believed. */

export type EvaluationBand = 'red' | 'amber' | 'green'

const BAND: Record<EvaluationBand, string> = {
  red: 'Needs work',
  amber: 'Developing',
  green: 'Strength',
}

export function bandLabel(band: EvaluationBand): string {
  return BAND[band] ?? band
}

/** Where the thresholds are. 1–3 / 4–6 / 7–10, stated once. */
export function bandFor(score: number | null | undefined): EvaluationBand | null {
  if (typeof score !== 'number' || !Number.isFinite(score)) return null
  if (score <= 3) return 'red'
  if (score <= 6) return 'amber'
  return 'green'
}

/** The CSS custom property for a band. Red/amber/green map onto the existing
 *  --status-* tokens, so a RAG cell and a status pill agree without anyone
 *  coordinating them — and no new colour value enters the system. */
export const BAND_TOKEN: Record<EvaluationBand, string> = {
  red: 'var(--status-danger)',
  amber: 'var(--status-warn)',
  green: 'var(--status-good)',
}

export const BAND_BG: Record<EvaluationBand, string> = {
  red: 'var(--status-danger-bg)',
  amber: 'var(--status-warn-bg)',
  green: 'var(--status-good-bg)',
}

/* ── The seven evaluation steps ───────────────────────────────────────────
   Order is the order a scout fills it in, and also the order the profile
   renders: profile first because it is context, summary last because it is
   where the whole document is sent.

   There used to be an eighth, "Review & save". It repeated the summary's
   outcome fields and ended in a Next button that could never be pressed, so
   the outcome fields moved into Summary and Summary's button submits.

   THE FOUR MIDDLE KEYS ARE THE API'S OWN GROUP KEYS — 'technical', 'tactical',
   'physical', 'mental'. That is not a coincidence to preserve carefully; it is
   the point. The wizard looks a step's fields up in EVAL_SCHEMA by this key,
   so a step and its questions cannot drift apart, and adding a fifth group is
   one entry in each list rather than a switch statement to find. */

export interface EvalStep {
  key: string
  label: string
  hint: string
}

export const EVAL_STEPS: EvalStep[] = [
  { key: 'profile', label: 'Profile', hint: 'Player context' },
  { key: 'technical', label: 'Technical', hint: 'On the ball' },
  { key: 'tactical', label: 'Tactical', hint: 'Reading the game' },
  { key: 'physical', label: 'Physical', hint: 'Athletic profile' },
  { key: 'mental', label: 'Mental', hint: 'Attitude & application' },
  { key: 'development', label: 'Development plan', hint: 'What to work on' },
  { key: 'summary', label: 'Summary & submit', hint: 'Verdict, scores, send' },
]

export const stepIndex = (key: string) => {
  const i = EVAL_STEPS.findIndex((s) => s.key === key)
  return i === -1 ? 0 : i
}

/* ── What the numbers mean ────────────────────────────────────────────────
   Shown as tooltips beside every score label, so the wizard, the readout and
   the admin sheet explain them in the same words. */

export const OVERALL_TIP =
  'The average of the four group averages — Technical, Tactical, Physical and Mental count equally, however many attributes each has. Unscored attributes are left out, not counted as zero.'

export const PROVISIONAL_TIP =
  'A live preview of the overall score while you are still scoring. It moves with every attribute you rate and is pre-filled into the Provisional score field on the last step, rounded to a whole number.'

export const PROVISIONAL_FIELD_TIP =
  'The whole-number score submitted with this evaluation. Pre-filled from the live average of your attribute scores — type your own number to override it.'

export const GOOD_TIP =
  "The player's current level today, 1–10. Pre-filled from your attribute scores — type your own number to override it."

export const POTENTIAL_TIP =
  'Your judgement of the level this player could reach, 1–10. It is never calculated from the scores.'

/** Percent of steps behind the scout, derived from position so the bar and
 *  the rail can never tell the reader two different things. */
export const stepPercent = (key: string) =>
  Math.round((stepIndex(key) / (EVAL_STEPS.length - 1)) * 100)
