/**
 * Pure citizenship helpers, safe to import from stores (no API, no hooks).
 * The rest lives in ./residency.ts.
 */

/** Shown pre-selected until the guest picks; always visible in the form. */
export const DEFAULT_RESIDENCY = 'gb'

/** The backend accepts any case and spacing; we always send the canonical form. */
export function normalizeResidency(code: string | null | undefined): string {
  return (code ?? '').trim().toLowerCase()
}
