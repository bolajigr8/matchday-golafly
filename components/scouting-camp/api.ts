/* Saving a camp sign-up. The form goes to HubSpot only (through this site's
 * /api/hubspot/scouting-camp route) so the team has the contact to follow up
 * with — it is not saved on the Golafly backend. */

export type CampSignup = {
  first_name: string
  last_name: string
  date_of_birth: string
  age: number
  position: string
  country: string
  visa_required: boolean
  phone: string
  email: string
  under_18: boolean
  guardian_name?: string
  guardian_phone?: string
} & Record<string, string | number | boolean | undefined>

export async function submitCampSignup(signup: CampSignup) {
  const res = await fetch('/api/hubspot/scouting-camp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(signup),
  })
  if (!res.ok) {
    throw new Error('We couldn’t save your place. Check your connection and try again, or message us on WhatsApp.')
  }
}

/* ── Google Ads attribution ──────────────────────────────────────────────
   gclid and UTMs arrive on the landing URL; they're kept for the tab so a
   player who scrolls, reads and only then submits is still attributed. */

const KEYS = ['gclid', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'] as const
const STORE = 'golafly-camp-attribution'

export function saveCampAttribution() {
  try {
    const params = new URLSearchParams(window.location.search)
    const found = Object.fromEntries(KEYS.map(k => [k, params.get(k)]).filter(([, v]) => v))
    if (Object.keys(found).length) sessionStorage.setItem(STORE, JSON.stringify(found))
  } catch {
    /* storage blocked — attribution is best-effort */
  }
}

export function campAttribution(): Record<string, string> {
  try {
    return JSON.parse(sessionStorage.getItem(STORE) ?? '{}') as Record<string, string>
  } catch {
    return {}
  }
}
