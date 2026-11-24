import axios, {
  type AxiosError,
  AxiosHeaders,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios'
import {
  clearAdminSession,
  getAdminToken,
  setAdminToken,
} from '@/features/admin/session'

/**
 * Dedicated axios instance for the Golafly backend (programs, offers, apply-now,
 * and the admin dashboard). Kept separate from `lib/axios.ts`, which talks to
 * Matchday's own booking/flights API — these are two different backends and must
 * not share a base URL or interceptors.
 */
const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || ''
const baseURL = `${apiBase}/api`

/* ngrok's free plan shows a browser-warning interstitial unless this header is
   sent. Only attach it when the API is actually served through ngrok so it
   never reaches a real production backend (and never needs a CORS allowance
   there). To force it on regardless, set `isNgrok` to `true`. */
const isNgrok = apiBase.includes('ngrok')

const ngrokHeaders: Record<string, string> = isNgrok
  ? { 'ngrok-skip-browser-warning': 'true' }
  : {}

const golaflyAxios = axios.create({ baseURL })

type RetryableRequestConfig = InternalAxiosRequestConfig & { _retry?: boolean }

golaflyAxios.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  config.headers = config.headers || new AxiosHeaders()

  if (!config.headers.has('Accept')) {
    config.headers.set('Accept', 'application/json')
  }

  if (isNgrok) {
    config.headers.set('ngrok-skip-browser-warning', 'true')
  }

  /* Public landing calls run without a token; admin calls pick one up once the
     session cookie exists. Same instance either way — the backend decides. */
  const token = getAdminToken()

  if (token && !config.headers.has('Authorization')) {
    config.headers.set('Authorization', `Bearer ${token}`)
  }

  return config
})

/* The backend exposes two refresh endpoints and which one answers depends on
   the guard that issued the token, so try both before giving up. */
async function refreshAdminToken(): Promise<string | null> {
  const current = getAdminToken()

  if (!current) return null

  for (const endpoint of ['/v1/auth/refresh', '/v1/auth/admin/refresh']) {
    try {
      /* Bare axios bypasses the instance interceptors, so the ngrok header
         has to be added here explicitly. */
      const response = await axios.post<{ data?: { token?: string } }>(
        `${baseURL}${endpoint}`,
        {},
        {
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${current}`,
            ...ngrokHeaders,
          },
        },
      )

      const next = response.data?.data?.token

      if (next) {
        setAdminToken(next)
        return next
      }
    } catch {
      /* Try the next endpoint. */
    }
  }

  return null
}

golaflyAxios.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined
    const status = error?.response?.status

    /* One refresh attempt per request, then the session is genuinely dead.
       The redirect is left to the caller — an interceptor that navigates makes
       every failure untestable and can fire mid-render. */
    if (status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true

      const refreshed = await refreshAdminToken()

      if (refreshed) {
        originalRequest.headers = originalRequest.headers || new AxiosHeaders()

        originalRequest.headers.set('Authorization', `Bearer ${refreshed}`)

        return golaflyAxios(
          originalRequest as AxiosRequestConfig,
        ) as Promise<AxiosResponse>
      }

      clearAdminSession()
    }

    if (status === 413) {
      error.message =
        'Content too large. Please reduce the file size and try again.'
    }

    if (
      typeof window !== 'undefined' ||
      process.env.NODE_ENV !== 'production'
    ) {
      console.error('Golafly API error:', error?.message)
    }

    return Promise.reject(error)
  },
)

export default golaflyAxios
