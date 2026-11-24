/* Golafly's three pillars and which one opens each route.
 *
 *   PLAY IT        — you on the pitch: Scouting Camp, Trial Showcase, programmes
 *   LIVE IT        — Matchday: tickets to watch the game
 *   TRAVEL FOR IT  — Golafly Travel: flights, stays, trips
 *
 * Every route that belongs to a pillar opens with that pillar's intro
 * (components/brand/pillar-intro.tsx), with the section's own name under it.
 * Each section plays once per visit (sessionStorage), so moving around
 * inside it never replays. Routes not listed (admin, auth, legal, help,
 * blog, payment) have no intro.
 *
 * No imports and no 'use client': app/layout.tsx inlines bootScript() in
 * <head>, so this file must stay plain data and functions. */

export type Pillar = 'play' | 'live' | 'travel'

export interface PillarIntroSpec {
  pillar: Pillar
  /** The section's name, shown under the pillar word. */
  label: string
  /** sessionStorage identity: one play per section per visit. */
  key: string
}

/** [route prefix, pillar, label]. '/' matches the home page only. */
const RULES: [string, Pillar, string][] = [
  ['/', 'live', 'Matchday'],
  ['/matches', 'live', 'Matches'],
  ['/match', 'live', 'Match tickets'],
  ['/tournaments', 'live', 'Competitions'],
  ['/tournament', 'live', 'Competitions'],
  ['/international', 'live', 'Internationals'],
  ['/teams', 'live', 'Clubs'],
  ['/team', 'live', 'Clubs'],
  ['/builder', 'live', 'Your matchday'],
  ['/cart', 'live', 'Your matchday'],
  ['/fan', 'live', 'Fan zone'],

  ['/scouting-camp', 'play', 'Scouting Camp'],
  ['/tourism/trials', 'play', 'Trial Showcase'],
  ['/program', 'play', 'Programmes'],
  ['/player', 'play', 'Players'],
  ['/scout', 'play', 'Scouts'],
  ['/apply-now', 'play', 'Apply'],

  ['/flights', 'travel', 'Flights'],
  ['/stays', 'travel', 'Stays'],
  ['/travel', 'travel', 'Golafly Travel'],
  ['/tourism-packages', 'travel', 'Football trips'],
]

const STORAGE_KEY = 'gf-intro-seen'
/** Set on <html> by bootScript() when this page's intro must not show. */
export const INTRO_SKIP_ATTR = 'data-intro-skip'

function match(pathname: string, rules: [string, Pillar, string][]) {
  let best: [string, Pillar, string] | null = null
  for (const rule of rules) {
    const prefix = rule[0]
    const hit =
      prefix === '/'
        ? pathname === '/'
        : pathname === prefix || pathname.startsWith(prefix + '/')
    if (hit && (!best || prefix.length > best[0].length)) best = rule
  }
  return best
}

export function introForPath(pathname: string | null): PillarIntroSpec | null {
  const rule = match(pathname ?? '', RULES)
  return rule ? { pillar: rule[1], label: rule[2], key: `${rule[1]}:${rule[0]}` } : null
}

function seenKeys(): string[] {
  try {
    return JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? '[]') as string[]
  } catch {
    return []
  }
}

export function introSeen(key: string) {
  return seenKeys().includes(key)
}

export function markIntroSeen(key: string) {
  try {
    const keys = seenKeys()
    if (!keys.includes(key)) sessionStorage.setItem(STORAGE_KEY, JSON.stringify([...keys, key]))
  } catch {
    // Private mode or blocked storage: the intro may replay, nothing breaks.
  }
}

/* Runs in <head> before first paint. The server always renders the intro for
 * the route; this hides it straight away for a section already seen this
 * visit, or for anyone with reduced motion on, so they never get a flash of
 * the ink screen. The component clears the attribute once it has taken over. */
export function bootScript(): string {
  return (
    `(function(){try{var R=${JSON.stringify(RULES)},p=location.pathname,b=null;` +
    `for(var i=0;i<R.length;i++){var x=R[i][0];` +
    `if((x==='/'?p==='/':(p===x||p.indexOf(x+'/')===0))&&(!b||x.length>b[0].length))b=R[i]}` +
    `var skip=!b||matchMedia('(prefers-reduced-motion: reduce)').matches;` +
    `if(!skip){var s=JSON.parse(sessionStorage.getItem('${STORAGE_KEY}')||'[]');skip=s.indexOf(b[1]+':'+b[0])>-1}` +
    `if(skip)document.documentElement.setAttribute('${INTRO_SKIP_ATTR}','')}catch(e){}})();`
  )
}
