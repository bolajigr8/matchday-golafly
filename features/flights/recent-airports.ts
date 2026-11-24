// features/flights/recent-airports.ts
//
// Genuinely real per-browser search history for the airport picker's
// "Recent" section — every entry here was written the moment a person
// actually selected that airport, never fabricated or pre-seeded.

const STORAGE_KEY = 'matchday:recent-airports'
const MAX_RECENTS = 6

export interface RecentAirport {
  iataCode: string
  primary: string
  secondary: string | null
  searchedAt: string
}

export function getRecentAirports(): RecentAirport[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function addRecentAirport(entry: Omit<RecentAirport, 'searchedAt'>) {
  if (typeof window === 'undefined') return
  try {
    const existing = getRecentAirports().filter(
      (r) => r.iataCode !== entry.iataCode,
    )
    const next = [
      { ...entry, searchedAt: new Date().toISOString() },
      ...existing,
    ].slice(0, MAX_RECENTS)
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // Storage can fail (private browsing, quota) — recents are a
    // convenience, not a requirement, so this fails silently.
  }
}
