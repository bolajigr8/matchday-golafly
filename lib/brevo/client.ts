const BREVO_BASE_URL = 'https://api.brevo.com/v3'

function assertServer() {
  if (typeof window !== 'undefined') {
    throw new Error('brevoFetch must never be called from the browser')
  }
}

export async function brevoFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  assertServer()

  const apiKey = process.env.BREVO_API_KEY
  if (!apiKey) throw new Error('BREVO_API_KEY is not set')

  const res = await fetch(`${BREVO_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'api-key': apiKey,
      ...init.headers,
    },
  })

  // Brevo returns 204/202 with no body on some endpoints
  const text = await res.text()
  const data = text ? JSON.parse(text) : null

  if (!res.ok) {
    const message =
      (data && (data.message || data.error)) || `Brevo error ${res.status}`
    throw new Error(message)
  }

  return data as T
}

/** Optional Brevo list per product. Unset/invalid → contact is upserted
 *  without being added to a list (never an error). */
export const BREVO_LISTS = {
  flight: Number(process.env.BREVO_LIST_FLIGHTS),
  stays: Number(process.env.BREVO_LIST_STAYS),
  esim: Number(process.env.BREVO_LIST_ESIM),
  matchday: Number(process.env.BREVO_LIST_MATCHDAY),
} as const
