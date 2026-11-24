import axios, {
  type AxiosError,
  AxiosHeaders,
  type InternalAxiosRequestConfig,
} from 'axios'
import Cookies from 'js-cookie'

// Store is imported at call-time (inside the interceptor) to avoid a
// module-initialisation cycle: zustand's persist middleware reads from
// localStorage, which doesn't exist during SSR, so we defer the read to
// the moment an actual request is made (always client-side).
// We do NOT use the hook here — this is plain module code, not a component.
import { useCurrencyStore } from '@/store/currency'

const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || ''

// ngrok's free plan shows a browser-warning page unless this header is sent.
// Only attach it when the API is served through ngrok, so normal/production
// URLs behave exactly as before.
const isNgrok = apiBase.includes('ngrok')

const axiosInstance = axios.create({
  baseURL: apiBase,
  headers: {
    Accept: 'application/json',
    'Duffel-Version': 'v2',
    ...(isNgrok && { 'ngrok-skip-browser-warning': 'true' }),
  },
  timeout: 25_000,
})

axiosInstance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  /**
   * NEXT_PUBLIC_API_TOKEN is a client token, not the buyer's identity.
   * Guest cart/order requests must resolve through X-Cart-Token, so the
   * public API token must not make those calls look authenticated.
   *
   * flights/orders and esim2/orders were added to this list to match the
   * fix already shipped in the travels project's lib/axios.ts — without
   * them, a stale/empty NEXT_PUBLIC_API_TOKEN gets attached as a bearer
   * token on flight and eSIM order calls that are meant to be resolved
   * as guest checkouts, which can cause the backend to reject or
   * misattribute the request.
   */
  const isCartFlowEndpoint =
    /\/api\/v1\/(?:cart(?:\/|$)|esim2\/orders(?:\/|$)|flights\/orders(?:\/|$)|ledgers\/transactions(?:\/|$))/.test(
      config.url ?? '',
    )

  const userToken = Cookies.get('matchday:token')
  const token =
    userToken ??
    (!isCartFlowEndpoint ? process.env.NEXT_PUBLIC_API_TOKEN : undefined)

  if (token) {
    config.headers = config.headers || new AxiosHeaders()
    if (!config.headers.has('Authorization')) {
      config.headers.set('Authorization', `Bearer ${token}`)
    }
  }

  // ── X-Currency header (Multi-Currency Checkout Contract) ─────────
  // Inject on every outbound request so the server returns prices in
  // the buyer's chosen currency. The doc says: "the header belongs on
  // every request the same way an auth token does."
  //
  // We read directly from zustand's internal store state (not the hook)
  // so this works in module scope outside of React components.
  // If no currency is stored yet we send nothing, which the server
  // treats as EUR (the documented default).
  try {
    const { currency } = useCurrencyStore.getState()
    config.headers = config.headers || new AxiosHeaders()
    // A caller may pin a currency for ONE request (a hotel re-prebook keeps
    // the currency the stay was priced in); never override that.
    if (currency && !config.headers.has('X-Currency')) {
      config.headers.set('X-Currency', currency)
    }
  } catch {
    // Store not yet hydrated (e.g. SSR edge case) — omit the header;
    // the server defaults to EUR which is correct.
  }

  return config
})

axiosInstance.interceptors.response.use(
  (res) => res,
  (err: AxiosError) => {
    if (err.response?.status === 401) {
      Cookies.remove('matchday:token')
      Cookies.remove('matchday:user')
    }
    return Promise.reject(err)
  },
)

export default axiosInstance
