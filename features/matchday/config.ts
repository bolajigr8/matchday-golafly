// features/matchday/config.ts
//
// The one flag that decides whether the app talks to the real Golafly
// MatchDay API or shows static demo data — everywhere: browsing (home/
// matches/match detail), ticket selection (seats), and the checkout/
// payment flow. Nothing else in the app should infer "live vs mock" on
// its own (e.g. by checking whether a particular id looks numeric) —
// always go through isMatchdayLive() so there is exactly one switch.
//
// Must be NEXT_PUBLIC_-prefixed to be readable in client components
// (every page that needs this runs client-side). Set in .env.local; see
// .env.example for the default.

export function isMatchdayLive(): boolean {
  return process.env.NEXT_PUBLIC_MATCHDAY_TICKETS_LIVE !== 'false'
}
