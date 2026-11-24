// lib/flags.ts
//
// Testing/dev-only affordances that must never be on by default in a
// production build. Each one defaults to OFF (real backend / live data
// only) unless explicitly turned on via env var — so a normal
// `npm run build` never ships mock/static fallbacks or debug UI unless
// someone deliberately opts in.
//
// Set these in `.env.local` (never commit real values that enable them
// in a production .env file):
//   NEXT_PUBLIC_ENABLE_FALLBACK_FLIGHTS=true
//
// NOTE: the checkout-simulation flag that used to live here
// (ENABLE_CHECKOUT_SIMULATION) has been removed along with the mock
// checkout backend it gated (app/api/checkout/*, DevSimulatePanel).
// Every checkout now goes through a real backend — features/matchday
// for single tickets, features/cart for the unified cart.

function flag(name: string): boolean {
  return process.env[name] === 'true'
}

/** Show the hardcoded/static flight list when live flight search fails
 *  or returns nothing. OFF by default — a failed live search shows a
 *  real error + retry instead of switching to canned demo flights. */
export const ENABLE_FALLBACK_FLIGHTS = flag(
  'NEXT_PUBLIC_ENABLE_FALLBACK_FLIGHTS',
)
