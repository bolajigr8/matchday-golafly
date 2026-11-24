import type { EvalGroupSpec, PlayerEvaluation } from './evaluation'
import { EVAL_SCHEMA, group } from './evaluation'

/* ══════════════════════════════════════════════════════════════════════════
   POSITION TEMPLATES — what a scout scores, decided by where the player plays.
   ══════════════════════════════════════════════════════════════════════════

   A goalkeeper and a winger were being scored on the same eighteen outfield
   attributes, which made the goalkeeper's evaluation mostly blanks and the
   winger's mostly irrelevant. Every position now has a template.

   HARDCODED, ON PURPOSE. The API has no templates endpoint; it stores whatever
   keys arrive inside the four groups. So this file IS the configuration, and
   changing a template is a code change — which also keeps two players at the
   same position comparable, because nobody can edit the set mid-camp.

   THE FOUR GROUPS ARE THE API'S OWN. `technical`, `tactical`, `physical` and
   `mental` are the fields PUT /v1/players/{id}/evaluation accepts; a template
   only changes which attribute keys go inside them. Nothing about the wire
   shape changes, and group averages still mean the same thing everywhere.

   The positions are the eleven a player chooses from at registration
   (Golafly frontend, components/register/types.ts). Left and right variants of
   the same role share a template — a left back is scored on what a right back
   is. */

export type TemplateId =
  | 'goalkeeper'
  | 'centre_back'
  | 'full_back'
  | 'defensive_midfielder'
  | 'central_midfielder'
  | 'attacking_midfielder'
  | 'winger'
  | 'second_striker'
  | 'centre_forward'
  | 'general'

export interface PositionTemplate {
  id: TemplateId
  name: string
  /** One line on what this template is looking for. */
  focus: string
  groups: EvalGroupSpec[]
}

export interface Position {
  code: string
  label: string
  line: 'Goalkeeper' | 'Defence' | 'Midfield' | 'Attack'
  template: TemplateId
  /** Other spellings a registration record may carry. Compared normalised. */
  aliases: string[]
}

/* ── Building blocks ──────────────────────────────────────────────────── */

type Field = EvalGroupSpec['fields'][number]
const f = (key: string, label: string, hint?: string): Field => ({ key, label, hint })

function groups(
  technical: Field[],
  tactical: Field[],
  physical: Field[],
  mental: Field[],
): EvalGroupSpec[] {
  return [
    { key: 'technical', label: 'Technical', hint: 'On the ball', fields: technical },
    { key: 'tactical', label: 'Tactical', hint: 'Reading the game', fields: tactical },
    { key: 'physical', label: 'Physical', hint: 'Athletic profile', fields: physical },
    { key: 'mental', label: 'Mental', hint: 'Attitude and application', fields: mental },
  ]
}

/* ── The templates ────────────────────────────────────────────────────── */

export const TEMPLATES: Record<TemplateId, PositionTemplate> = {
  goalkeeper: {
    id: 'goalkeeper',
    name: 'Goalkeeper',
    focus: 'Keeping the ball out, commanding the box and starting attacks.',
    groups: groups(
      [
        f('shot_stopping', 'Shot stopping', 'Saves from close and long range'),
        f('handling', 'Handling', 'Catches cleanly, spills little'),
        f('kicking', 'Kicking', 'Goal kicks, volleys and long distribution'),
        f('throwing', 'Throwing', 'Speed and accuracy of hand distribution'),
        f('playing_out', 'Playing out from the back', 'Comfort with the ball at feet'),
      ],
      [
        f('positioning', 'Positioning', 'Angles and set position for shots'),
        f('command_of_area', 'Command of area', 'Controls the six-yard box'),
        f('claiming_crosses', 'Claiming crosses', 'Comes for and wins high balls'),
        f('sweeping', 'Sweeping', 'Deals with balls played in behind'),
        f('organising_defence', 'Organising the defence', 'Sets walls, directs the line'),
      ],
      [
        f('reflexes', 'Reflexes', 'Reaction speed on close shots'),
        f('agility', 'Agility', 'Gets across the goal and back up'),
        f('explosive_power', 'Explosive power', 'Spring off the ground'),
        f('aerial_reach', 'Aerial reach', 'Height and timing at full stretch'),
      ],
      [
        f('composure', 'Composure', 'Calm under pressure and with the ball'),
        f('concentration', 'Concentration', 'Stays switched on in quiet games'),
        f('communication', 'Communication', 'Loud, clear and early'),
        f('bravery', 'Bravery', 'Goes in for 1v1s and crowded boxes'),
        f('resilience', 'Resilience', 'Recovers after a mistake'),
      ],
    ),
  },

  centre_back: {
    id: 'centre_back',
    name: 'Centre back',
    focus: 'Defending the box, winning duels and building play from the back.',
    groups: groups(
      [
        f('tackling', 'Tackling', 'Clean, well-timed challenges'),
        f('heading', 'Heading', 'Defensive and attacking headers'),
        f('short_passing', 'Short passing', 'Keeps possession under pressure'),
        f('long_passing', 'Long passing', 'Switches and balls into the channels'),
        f('first_touch', 'First touch', 'Controls to set up the next action'),
      ],
      [
        f('positioning', 'Positioning', 'Body shape and distance to the striker'),
        f('marking', 'Marking', 'Tight in the box, tracks runners'),
        f('reading_the_game', 'Reading the game', 'Interceptions and anticipation'),
        f('line_management', 'Holding the line', 'Steps up and drops together'),
        f('covering', 'Covering', 'Supports the full back and partner'),
      ],
      [
        f('strength', 'Strength', 'Holds ground in duels'),
        f('jumping_reach', 'Jumping reach', 'Wins aerial balls'),
        f('recovery_pace', 'Recovery pace', 'Gets back when exposed'),
        f('stamina', 'Stamina', 'Concentration and legs for 90 minutes'),
      ],
      [
        f('composure', 'Composure', 'Calm on the ball in his own half'),
        f('concentration', 'Concentration', 'Few lapses across a match'),
        f('leadership', 'Leadership', 'Organises and lifts those around him'),
        f('communication', 'Communication', 'Talks the line through'),
        f('aggression', 'Controlled aggression', 'Competes without giving fouls away'),
      ],
    ),
  },

  full_back: {
    id: 'full_back',
    name: 'Full back',
    focus: 'Defending the flank one-on-one and adding width going forward.',
    groups: groups(
      [
        f('crossing', 'Crossing', 'Quality from wide areas'),
        f('tackling', 'Tackling', 'Wins the ball without diving in'),
        f('passing', 'Passing', 'Combines with winger and midfield'),
        f('first_touch', 'First touch', 'Receives on the move'),
        f('dribbling', 'Dribbling', 'Carries the ball up the line'),
      ],
      [
        f('positioning', 'Positioning', 'Tucks in, holds width at the right time'),
        f('one_v_one_defending', '1v1 defending', 'Shows the winger where to go'),
        f('overlapping', 'Overlapping runs', 'Timing of support in attack'),
        f('tracking_runners', 'Tracking runners', 'Picks up the back-post run'),
        f('transition', 'Transition', 'Recovers shape after losing the ball'),
      ],
      [
        f('pace', 'Pace', 'Top speed over distance'),
        f('acceleration', 'Acceleration', 'First few yards'),
        f('stamina', 'Stamina', 'Up and down the flank all game'),
        f('agility', 'Agility', 'Turns and changes of direction'),
      ],
      [
        f('work_rate', 'Work rate', 'Covers ground both ways'),
        f('concentration', 'Concentration', 'Aware of the runner behind'),
        f('composure', 'Composure', 'Decisions under a press'),
        f('discipline', 'Discipline', 'Holds position when told to'),
      ],
    ),
  },

  defensive_midfielder: {
    id: 'defensive_midfielder',
    name: 'Defensive midfielder',
    focus: 'Screening the back line, breaking play up and recycling possession.',
    groups: groups(
      [
        f('tackling', 'Tackling', 'Wins the ball back in midfield'),
        f('short_passing', 'Short passing', 'Simple, secure distribution'),
        f('long_passing', 'Long passing', 'Switches play when it opens up'),
        f('first_touch', 'First touch', 'Receives facing forward'),
        f('ball_retention', 'Ball retention', 'Keeps the ball under pressure'),
      ],
      [
        f('screening', 'Screening', 'Protects the space in front of the defence'),
        f('interceptions', 'Interceptions', 'Reads passes before they are played'),
        f('pressing', 'Pressing', 'Triggers and joins the press'),
        f('scanning', 'Scanning', 'Checks shoulders before receiving'),
        f('defensive_transition', 'Defensive transition', 'First to react when possession is lost'),
      ],
      [
        f('stamina', 'Stamina', 'Covers ground for the full match'),
        f('strength', 'Strength', 'Holds off opponents in duels'),
        f('agility', 'Agility', 'Turns out of pressure'),
        f('recovery_pace', 'Recovery pace', 'Gets back in front of the ball'),
      ],
      [
        f('composure', 'Composure', 'Unhurried in tight spaces'),
        f('discipline', 'Discipline', 'Stays in position, avoids cheap fouls'),
        f('work_rate', 'Work rate', 'Constant effort off the ball'),
        f('leadership', 'Leadership', 'Organises the midfield'),
      ],
    ),
  },

  central_midfielder: {
    id: 'central_midfielder',
    name: 'Central midfielder',
    focus: 'Linking defence to attack and controlling the tempo box to box.',
    groups: groups(
      [
        f('short_passing', 'Short passing', 'Accurate combinations'),
        f('long_passing', 'Long passing', 'Range to switch and play in behind'),
        f('first_touch', 'First touch', 'Sets up the next pass or turn'),
        f('dribbling', 'Dribbling', 'Carries through the lines'),
        f('long_shots', 'Long-range shooting', 'Threat from outside the box'),
      ],
      [
        f('vision', 'Vision', 'Sees the forward pass early'),
        f('scanning', 'Scanning', 'Awareness before receiving'),
        f('off_the_ball', 'Movement off the ball', 'Finds space to receive'),
        f('pressing', 'Pressing', 'Presses with intent and timing'),
        f('tempo_control', 'Tempo control', 'Knows when to speed up or slow down'),
      ],
      [
        f('stamina', 'Stamina', 'Box-to-box for 90 minutes'),
        f('agility', 'Agility', 'Turns away from pressure'),
        f('acceleration', 'Acceleration', 'Bursts past a marker'),
        f('strength', 'Strength', 'Holds possession in contact'),
      ],
      [
        f('work_rate', 'Work rate', 'Effort in both phases'),
        f('composure', 'Composure', 'Calm when pressed'),
        f('decision_making', 'Decision making', 'Picks the right option'),
        f('concentration', 'Concentration', 'Keeps shape late in games'),
      ],
    ),
  },

  attacking_midfielder: {
    id: 'attacking_midfielder',
    name: 'Attacking midfielder',
    focus: 'Creating chances between the lines and arriving in the box.',
    groups: groups(
      [
        f('first_touch', 'First touch', 'Receives on the half-turn'),
        f('dribbling', 'Dribbling', 'Beats players in tight areas'),
        f('through_balls', 'Final pass', 'Through balls and cut-backs'),
        f('shooting', 'Shooting', 'Finishes from the edge of the box'),
        f('set_pieces', 'Set pieces', 'Corners, free kicks and delivery'),
      ],
      [
        f('vision', 'Vision', 'Spots the killer pass'),
        f('between_the_lines', 'Receiving between lines', 'Finds pockets of space'),
        f('off_the_ball', 'Movement off the ball', 'Late runs into the box'),
        f('chance_creation', 'Chance creation', 'Consistently makes openings'),
        f('pressing', 'Pressing', 'First line of the press'),
      ],
      [
        f('agility', 'Agility', 'Sharp changes of direction'),
        f('acceleration', 'Acceleration', 'Quick away from a marker'),
        f('balance', 'Balance', 'Stays on his feet through contact'),
        f('stamina', 'Stamina', 'Repeats efforts late on'),
      ],
      [
        f('creativity', 'Creativity', 'Tries the unexpected'),
        f('composure', 'Composure', 'Calm in front of goal'),
        f('decision_making', 'Decision making', 'Shoot, pass or carry'),
        f('confidence', 'Confidence', 'Wants the ball in big moments'),
      ],
    ),
  },

  winger: {
    id: 'winger',
    name: 'Winger',
    focus: 'Beating a full back, delivering from wide and scoring from the flank.',
    groups: groups(
      [
        f('dribbling', 'Dribbling', 'Ball control at speed'),
        f('crossing', 'Crossing', 'Delivery into the box'),
        f('first_touch', 'First touch', 'Controls long balls on the run'),
        f('finishing', 'Finishing', 'Converts chances cutting inside'),
        f('weak_foot', 'Weak foot', 'Uses both feet with confidence'),
      ],
      [
        f('one_v_one', '1v1 attacking', 'Takes on and beats defenders'),
        f('runs_in_behind', 'Runs in behind', 'Times runs beyond the line'),
        f('final_third', 'Final-third decisions', 'Right choice at the end of a move'),
        f('defensive_work_rate', 'Tracking back', 'Helps the full back'),
        f('width', 'Width and positioning', 'Holds width to stretch the pitch'),
      ],
      [
        f('pace', 'Pace', 'Top speed'),
        f('acceleration', 'Acceleration', 'Explosive first steps'),
        f('agility', 'Agility', 'Cuts and changes of direction'),
        f('stamina', 'Stamina', 'Repeated sprints'),
      ],
      [
        f('confidence', 'Confidence', 'Keeps taking players on'),
        f('work_rate', 'Work rate', 'Effort without the ball'),
        f('composure', 'Composure', 'Calm finishing and delivery'),
        f('resilience', 'Resilience', 'Bounces back after losing the ball'),
      ],
    ),
  },

  second_striker: {
    id: 'second_striker',
    name: 'Second striker',
    focus: 'Linking play around the striker and scoring from deeper positions.',
    groups: groups(
      [
        f('first_touch', 'First touch', 'Sets play up with one touch'),
        f('finishing', 'Finishing', 'Scores from different angles'),
        f('dribbling', 'Dribbling', 'Runs at defenders'),
        f('link_up_play', 'Link-up play', 'Combines with the striker and midfield'),
        f('passing', 'Passing', 'Slips others in'),
      ],
      [
        f('movement', 'Movement between lines', 'Drops in and spins off'),
        f('chance_creation', 'Chance creation', 'Makes goals as well as scoring them'),
        f('pressing', 'Pressing', 'Leads the press with the striker'),
        f('attacking_positioning', 'Attacking positioning', 'Arrives in scoring areas'),
      ],
      [
        f('acceleration', 'Acceleration', 'Sharp over five yards'),
        f('agility', 'Agility', 'Turns in tight spaces'),
        f('balance', 'Balance', 'Rides challenges'),
        f('stamina', 'Stamina', 'Keeps pressing late on'),
      ],
      [
        f('composure', 'Composure', 'Calm with chances'),
        f('creativity', 'Creativity', 'Inventive in the final third'),
        f('decision_making', 'Decision making', 'When to shoot, when to pass'),
        f('work_rate', 'Work rate', 'Effort off the ball'),
      ],
    ),
  },

  centre_forward: {
    id: 'centre_forward',
    name: 'Centre forward',
    focus: 'Scoring goals, holding the ball up and leading the line.',
    groups: groups(
      [
        f('finishing', 'Finishing', 'Converts chances with either foot'),
        f('first_touch', 'First touch', 'Controls in the box'),
        f('heading', 'Heading', 'Attacking headers'),
        f('hold_up_play', 'Hold-up play', 'Keeps the ball with back to goal'),
        f('weak_foot', 'Weak foot', 'Finishes on his weaker side'),
      ],
      [
        f('movement_in_box', 'Movement in the box', 'Loses his marker'),
        f('positioning', 'Positioning', 'In the right place for rebounds and crosses'),
        f('pressing', 'Pressing from the front', 'Leads the press'),
        f('link_up_play', 'Link-up play', 'Brings others into the game'),
      ],
      [
        f('strength', 'Strength', 'Holds off centre backs'),
        f('pace', 'Pace', 'Threat in behind'),
        f('jumping_reach', 'Jumping reach', 'Wins aerial duels'),
        f('acceleration', 'Acceleration', 'Gets the first yard'),
      ],
      [
        f('composure', 'Composure', 'Calm one-on-one with the keeper'),
        f('confidence', 'Confidence', 'Keeps shooting after misses'),
        f('work_rate', 'Work rate', 'Effort without the ball'),
        f('resilience', 'Resilience', 'Handles physical treatment'),
      ],
    ),
  },

  /* The fallback: a player with no position on record, or a spelling nothing
     below recognises. Also what every evaluation was scored on before
     templates existed — see templateFor(). */
  general: {
    id: 'general',
    name: 'General outfield',
    focus: 'Used when a player has no recognised position on record.',
    groups: EVAL_SCHEMA,
  },
}

/* ── Positions ────────────────────────────────────────────────────────── */

export const POSITIONS: Position[] = [
  { code: 'GK', label: 'Goalkeeper', line: 'Goalkeeper', template: 'goalkeeper', aliases: ['gk', 'keeper', 'goalie'] },
  { code: 'RB', label: 'Right Back', line: 'Defence', template: 'full_back', aliases: ['rb', 'right wing back', 'rwb', 'right fullback', 'right full back'] },
  { code: 'CB', label: 'Centre Back', line: 'Defence', template: 'centre_back', aliases: ['cb', 'center back', 'central defender', 'centre half', 'center half', 'defender'] },
  { code: 'LB', label: 'Left Back', line: 'Defence', template: 'full_back', aliases: ['lb', 'left wing back', 'lwb', 'left fullback', 'left full back', 'full back', 'fullback'] },
  { code: 'DM', label: 'Defensive Midfielder', line: 'Midfield', template: 'defensive_midfielder', aliases: ['dm', 'cdm', 'holding midfielder', 'defensive midfield'] },
  { code: 'CM', label: 'Central Midfielder', line: 'Midfield', template: 'central_midfielder', aliases: ['cm', 'centre midfielder', 'center midfielder', 'central midfield', 'midfielder', 'box to box'] },
  { code: 'AM', label: 'Attacking Midfielder', line: 'Midfield', template: 'attacking_midfielder', aliases: ['am', 'cam', 'attacking midfield', 'number 10', 'playmaker'] },
  { code: 'RW', label: 'Right Winger', line: 'Attack', template: 'winger', aliases: ['rw', 'right wing', 'right midfielder', 'rm', 'winger', 'wide midfielder'] },
  { code: 'LW', label: 'Left Winger', line: 'Attack', template: 'winger', aliases: ['lw', 'left wing', 'left midfielder', 'lm'] },
  { code: 'SS', label: 'Second Striker', line: 'Attack', template: 'second_striker', aliases: ['ss', 'shadow striker', 'support striker'] },
  { code: 'CF', label: 'Centre Forward', line: 'Attack', template: 'centre_forward', aliases: ['cf', 'st', 'center forward', 'striker', 'forward', 'striker forward', 'number 9'] },
]

const normalise = (s: string) =>
  s
    .toLowerCase()
    .replace(/[-_/\\.]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

/** The position a registration string names, or null. Exact label or alias
 *  first; then the longest alias contained in the string, so "Striker /
 *  Forward" and "Right Winger (inverted)" still land. */
export function positionFor(raw: string | null | undefined): Position | null {
  if (!raw) return null
  const value = normalise(raw)
  if (!value) return null

  for (const p of POSITIONS) {
    if (normalise(p.label) === value || p.code.toLowerCase() === value) return p
    if (p.aliases.some(a => normalise(a) === value)) return p
  }

  let best: { p: Position; len: number } | null = null
  for (const p of POSITIONS) {
    for (const name of [p.label, ...p.aliases]) {
      const n = normalise(name)
      /* Two-letter codes are too short to search for inside a sentence —
         "cb" would match inside nothing useful, "am" inside "team". */
      if (n.length < 4) continue
      if (value.includes(n) && (!best || n.length > best.len)) best = { p, len: n.length }
    }
  }
  return best?.p ?? null
}

export const positionsUsing = (id: TemplateId) => POSITIONS.filter(p => p.template === id)

/** Every attribute a template scores, flattened. */
export const templateFields = (t: PositionTemplate) =>
  t.groups.flatMap(g => g.fields.map(field => ({ ...field, group: g.key, groupLabel: g.label })))

export const templateFieldCount = (t: PositionTemplate) =>
  t.groups.reduce((n, g) => n + g.fields.length, 0)

export interface ResolvedTemplate {
  template: PositionTemplate
  /** The position the template was chosen from, when one was recognised. */
  position: Position | null
  /** True when the stored scores were written against the general template
   *  before this player's position template existed. */
  legacy: boolean
}

/** Which template this player is scored on.
 *
 *  Normally the one for their primary position. The exception is an
 *  evaluation that already holds scores for keys the position template does
 *  not have but the general template does — written before templates
 *  existed. Switching those players silently would hide every score they
 *  already have, so they stay on the general template until re-scored. */
export function templateFor(
  player: { primary_position?: string | null },
  evaluation?: PlayerEvaluation | null,
): ResolvedTemplate {
  const position = positionFor(player.primary_position)
  const template = position ? TEMPLATES[position.template] : TEMPLATES.general

  if (template.id !== 'general' && evaluation) {
    const scoredKeys = template.groups.flatMap(g =>
      Object.entries(group(evaluation[g.key]))
        .filter(([, v]) => typeof v === 'number')
        .map(([k]) => `${g.key}.${k}`),
    )
    if (scoredKeys.length > 0) {
      const keysOf = (t: PositionTemplate) =>
        new Set(t.groups.flatMap(g => g.fields.map(x => `${g.key}.${x.key}`)))
      const inPosition = keysOf(template)
      const inGeneral = keysOf(TEMPLATES.general)
      const fitsPosition = scoredKeys.every(k => inPosition.has(k))
      const fitsGeneral = scoredKeys.every(k => inGeneral.has(k))
      if (!fitsPosition && fitsGeneral) {
        return { template: TEMPLATES.general, position, legacy: true }
      }
    }
  }

  return { template, position, legacy: false }
}

/** How many of the template's attributes carry a score. */
export function scoredIn(
  template: PositionTemplate,
  evaluation: PlayerEvaluation | null | undefined,
): number {
  return template.groups.reduce(
    (n, g) =>
      n + g.fields.filter(x => typeof group(evaluation?.[g.key])[x.key] === 'number').length,
    0,
  )
}

/** The templates in the order the Templates screen lists them — pitch order,
 *  goalkeeper to striker, fallback last. */
export const TEMPLATE_ORDER: TemplateId[] = [
  'goalkeeper',
  'centre_back',
  'full_back',
  'defensive_midfielder',
  'central_midfielder',
  'attacking_midfielder',
  'winger',
  'second_striker',
  'centre_forward',
  'general',
]
