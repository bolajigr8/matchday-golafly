import axios, { AxiosHeaders, type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { clearFanSession, getFanToken, updateFanUser } from '@/features/fan/session'
import { isEmailNotVerified } from '@/features/fan/verification'

/**
 * Axios instance for the FAN side of the Golafly backend — auth and the fan's
 * own order ledgers.
 *
 * A separate instance from services/golafly-axios.ts on purpose. That one
 * hard-attaches the ADMIN token in its request interceptor and calls
 * clearAdminSession() on a 401. Reusing it here would mean a fan request
 * carrying an admin's bearer token whenever both sessions exist in one
 * browser — which is exactly the case on a developer's machine — and a fan's
 * expired session silently signing the admin out.
 *
 * Same backend, different guard — and, when you want it, a different HOST.
 *
 * ── TWO BASE URLS, ON PURPOSE ─────────────────────────────────────────
 * NEXT_PUBLIC_GOLAFLY_USER_API_BASE_URL points the USER side — login,
 * register, the fan dashboard, the scout dashboard, the player dashboard —
 * somewhere of its own. golafly-axios.ts keeps reading
 * NEXT_PUBLIC_GOLAFLY_API_BASE_URL for the admin and the public marketing
 * pages, so the two can sit on different backends while a feature is being
 * built against a test API.
 *
 * It FALLS BACK to the admin variable, then to production. Set nothing and
 * both instances point at the same host, which is what production does and
 * what anyone who has not heard of this split will expect.
 *
 * KNOW WHAT YOU ARE DOING WHEN YOU SPLIT THEM. The two sides share ids: an
 * admin assigns player 7 to a scout, and the scout's dashboard asks its own
 * backend for player 7. Point them at different hosts and those are two
 * different players, or one of them does not exist. Split for reading a
 * screen; rejoin before you trust anything that crosses between them.
 */
const baseURL =
  process.env.NEXT_PUBLIC_GOLAFLY_USER_API_BASE_URL ||
  process.env.NEXT_PUBLIC_GOLAFLY_API_BASE_URL ||
  'https://api.golafly.com/api'

const fanAxios = axios.create({ baseURL })

fanAxios.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  config.headers = config.headers || new AxiosHeaders()
  if (!config.headers.has('Accept')) config.headers.set('Accept', 'application/json')

  /* Register and login run without a token; everything else picks one up once
     the session cookie exists. Same instance either way — the backend
     decides. */
  const token = getFanToken()
  if (token && !config.headers.has('Authorization')) {
    config.headers.set('Authorization', `Bearer ${token}`)
  }

  return config
})

fanAxios.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    /* A 401 means the token is dead. Clear it so the route guard stops letting
       the fan through to a dashboard whose every request will fail.

       No refresh attempt and no redirect here. The admin instance retries
       against two refresh endpoints; the fan auth API exposes no documented
       refresh, and an interceptor that navigates makes every failure
       untestable and can fire mid-render. The caller redirects. */
    if (error?.response?.status === 401 && getFanToken()) {
      clearFanSession()
    }

    /* 403 email_not_verified: the account must enter its emailed code first.
       Remember it on the session cookie, so the route guard (proxy.ts) sends
       the next dashboard visit to /verify-email. The screen that made the
       call shows a "Verify your email" state (components/fan/query-state). */
    if (isEmailNotVerified(error) && getFanToken()) {
      updateFanUser({ email_verified: false })
    }

    return Promise.reject(error)
  },
)

export default fanAxios

/** The API's own error message where there is one. "These credentials do not
 *  match our records" tells a fan to check their password; "Something went
 *  wrong" sends them to support. */
export function fanApiMessage(error: unknown, fallback = 'Something went wrong.'): string {
  const response = (error as { response?: { data?: { message?: string } } })?.response
  return response?.data?.message ?? (error as { message?: string })?.message ?? fallback
}
