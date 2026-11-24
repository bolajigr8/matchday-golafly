// lib/email/crest.ts
//
// FALLBACK club badge for the emails, used only when the club's real crest
// can't be loaded (lib/email/club-crest.ts): the same "initials in club
// colours" badge the website uses (store/matches.ts TEAMS + MORE_TEAMS).
// Clubs not in that list get their initials on a colour picked from the
// name, so every team always has a picture.

import { MORE_TEAMS, TEAMS } from '@/store/matches'
import { namesMatch } from '@/features/matchday/resolve'

export interface EmailCrest {
  abbr: string
  color: string
  bg: string
}

/** Calm, readable pairs for clubs without known colours. */
const FALLBACK: Array<{ color: string; bg: string }> = [
  { color: '#FFFFFF', bg: '#1F3A93' },
  { color: '#FFFFFF', bg: '#B3202A' },
  { color: '#FFFFFF', bg: '#0B6E4F' },
  { color: '#111111', bg: '#F2C94C' },
  { color: '#FFFFFF', bg: '#5B2C83' },
  { color: '#FFFFFF', bg: '#2D2D2D' },
  { color: '#FFFFFF', bg: '#0F7EA8' },
  { color: '#FFFFFF', bg: '#C2501B' },
]

/** Words left out of initials: "FC Twente" → "TWE", "Club Brugge" → "BRU". */
const SKIP = new Set(['fc', 'cf', 'afc', 'sc', 'ac', 'as', 'ssc', 'cd', 'ud', 'rc', 'sl', 'the', 'de', 'of', 'club', 'football'])

function initials(name: string): string {
  const words = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean)
  const kept = words.filter((w) => !SKIP.has(w.toLowerCase()))
  const use = kept.length ? kept : words
  if (use.length === 1) return use[0].slice(0, 3).toUpperCase()
  return use
    .map((w) => w[0])
    .join('')
    .slice(0, 3)
    .toUpperCase()
}

function hash(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return h
}

export function emailCrest(name: string): EmailCrest {
  const clean = name.trim()
  const known = [...TEAMS, ...MORE_TEAMS].find((t) => namesMatch(t.name, clean))
  if (known) return { abbr: known.abbr, color: known.color, bg: known.bg }
  const pick = FALLBACK[hash(clean.toLowerCase()) % FALLBACK.length]
  return { abbr: initials(clean) || '?', ...pick }
}
