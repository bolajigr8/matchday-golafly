// features/vip/live.ts
//
// The real backend calls (VIP_API_MODE = live). One function per endpoint
// of the contract; api.ts picks between these and the mock.
//
// Own axios instance on purpose: the shared one (lib/axios.ts) attaches the
// site's public API token as a Bearer on routes it doesn't know, which
// would make a guest look signed in to /hospitality/*. Here Authorization
// is ONLY the customer's own login, and the guest is identified by
// X-Cart-Token (contract §1).

import axios, { AxiosHeaders } from 'axios'
import Cookies from 'js-cookie'
import { getCartToken, setCartToken } from '@/lib/cart-token'
import { useCurrencyStore } from '@/store/currency'
import type {
  VipAddFlightBody,
  VipChangeTicketBody,
  VipCheckoutBody,
  VipCheckoutResult,
  VipClub,
  VipCreatePackageBody,
  VipEnvelope,
  VipEsimPage,
  VipEventsPage,
  VipFlightOffer,
  VipFlightSearchBody,
  VipHotelLockRaw,
  VipHotelOption,
  VipHotelRatesRaw,
  VipHotelSearchBody,
  VipLedgerTransaction,
  VipListingsPage,
  VipPackage,
  VipPackageView,
  VipSettings,
} from './contract'
import { toVipError } from './errors'
import { getVipSession } from './session'

const http = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || '',
  headers: {
    Accept: 'application/json',
    'Duffel-Version': 'v2',
    ...((process.env.NEXT_PUBLIC_API_BASE_URL || '').includes('ngrok') && {
      'ngrok-skip-browser-warning': 'true',
    }),
  },
  timeout: 30_000,
})

http.interceptors.request.use((config) => {
  config.headers = config.headers || new AxiosHeaders()
  const userToken = Cookies.get('matchday:token')
  if (userToken) config.headers.set('Authorization', `Bearer ${userToken}`)

  /* Guests always send their cart token. A customer who started the
     package as a guest and logged in mid-way keeps sending it until
     checkout completes (contract §9). */
  const cartToken = getCartToken()
  const guestStarted = getVipSession()?.guestStarted ?? false
  if (cartToken && (!userToken || guestStarted)) config.headers.set('X-Cart-Token', cartToken)

  /* Same currency rule as every other site request (lib/axios.ts). */
  try {
    const { currency } = useCurrencyStore.getState()
    if (currency) config.headers.set('X-Currency', currency)
  } catch {
    /* store not ready: the backend defaults to EUR */
  }
  return config
})

http.interceptors.response.use((res) => {
  const token =
    (res.headers?.['x-cart-token'] as string | undefined) ??
    (res.data?.data?.guest_token as string | undefined)
  if (typeof token === 'string' && token) setCartToken(token)
  return res
})

/** Over the supplier-search limit (429): wait Retry-After seconds, then
 *  retry ONCE (contract §1). The caller's button stays disabled meanwhile
 *  because the promise is still pending. */
async function withRetry<R>(run: () => Promise<R>): Promise<R> {
  try {
    return await run()
  } catch (err) {
    const e = toVipError(err)
    if (e.status !== 429) throw e
    const wait = Math.min(Math.max(e.retryAfter ?? 5, 1), 60)
    await new Promise((r) => setTimeout(r, wait * 1000))
    try {
      return await run()
    } catch (err2) {
      throw toVipError(err2)
    }
  }
}

async function call<T>(run: () => Promise<{ data: VipEnvelope<T> }>): Promise<T> {
  const res = await withRetry(run)
  return res.data.data
}

const H = '/api/v1/hospitality'
const pkg = (id: string) => `${H}/packages/${encodeURIComponent(id)}`

/* ── Browse ── */

export const liveVipApi = {
  /** Public. Which mode new packages use; 404 while VIP is switched off. */
  getSettings: () => call<VipSettings>(() => http.get(`${H}/settings`)),

  getClubs: () => call<VipClub[]>(() => http.get(`${H}/clubs`)),

  async getEvents(club: string, page: number): Promise<VipEventsPage> {
    const res = await withRetry(() =>
      http.get<VipEnvelope<VipEventsPage['data']> & { meta: VipEventsPage['meta'] }>(
        `${H}/clubs/${encodeURIComponent(club)}/events`,
        { params: { page, per_page: 20 } },
      ),
    )
    return { data: res.data.data, meta: res.data.meta }
  },

  async getListings(club: string, eventId: number): Promise<VipListingsPage> {
    const res = await withRetry(() =>
      http.get<VipEnvelope<VipListingsPage['data']> & { meta: VipListingsPage['meta'] }>(
        `${H}/clubs/${encodeURIComponent(club)}/events/${eventId}/listings`,
      ),
    )
    return { data: res.data.data, meta: res.data.meta }
  },

  /* ── Package ── */

  createPackage: (body: VipCreatePackageBody, idempotencyKey: string) =>
    call<VipPackage>(() => http.post(`${H}/packages`, body, { headers: { 'Idempotency-Key': idempotencyKey } })),

  getPackage: (id: string, sessionId?: string | null) =>
    call<VipPackageView>(() => http.get(pkg(id), { params: sessionId ? { session_id: sessionId } : undefined })),

  changeTicket: (id: string, body: VipChangeTicketBody) => call<VipPackage>(() => http.put(`${pkg(id)}/ticket`, body)),

  deletePackage: (id: string) => call<null>(() => http.delete(pkg(id))),

  /* ── Flight ── */

  searchFlights: (id: string, body: VipFlightSearchBody) =>
    call<VipFlightOffer[]>(() => http.post(`${pkg(id)}/flights/search`, body)),

  addFlight: (id: string, body: VipAddFlightBody) => call<VipPackage>(() => http.post(`${pkg(id)}/flight`, body)),

  /** Removes the flight AND the hotel (its dates came from the flight). */
  removeFlight: (id: string) => call<VipPackage>(() => http.delete(`${pkg(id)}/flight`)),

  /* ── Hotel ── */

  searchHotels: (id: string, body: VipHotelSearchBody) =>
    call<VipHotelOption[]>(() => http.post(`${pkg(id)}/hotels/search`, body)),

  getHotelRates: (id: string, optionId: string) =>
    call<VipHotelRatesRaw>(() => http.get(`${pkg(id)}/hotels/${encodeURIComponent(optionId)}/rates`)),

  lockHotel: (id: string, rateId: string) =>
    call<VipHotelLockRaw>(() => http.post(`${pkg(id)}/hotel/lock`, { rate_id: rateId })),

  addHotel: (id: string, lockId: string) => call<VipPackage>(() => http.post(`${pkg(id)}/hotel`, { lock_id: lockId })),

  /** Removes the hotel only; the flight stays. */
  removeHotel: (id: string) => call<VipPackage>(() => http.delete(`${pkg(id)}/hotel`)),

  /* ── eSIM ── */

  getEsims: (id: string, page: number) =>
    call<VipEsimPage>(() => http.get(`${pkg(id)}/esims`, { params: { page, per_page: 15 } })),

  addEsim: (id: string, packageId: string, quantity: number) =>
    call<VipPackage>(() => http.post(`${pkg(id)}/esim`, { package_id: packageId, quantity })),

  removeEsim: (id: string) => call<VipPackage>(() => http.delete(`${pkg(id)}/esim`)),

  /* ── Pay + after payment (existing endpoints) ── */

  checkout: (body: VipCheckoutBody) =>
    call<VipCheckoutResult>(() => http.post('/api/v1/cart/checkout', body, { timeout: 60_000 })),

  getTransaction: (sessionId: string) =>
    call<VipLedgerTransaction>(() => http.get(`/api/v1/ledgers/transactions/${encodeURIComponent(sessionId)}`)),
}

export type VipApi = typeof liveVipApi
