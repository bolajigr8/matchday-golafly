// features/vip/api.ts
//
// The ONE door every VIP page uses to reach the backend. It forwards to the
// real API (./live.ts) or, in test mode, to the in-browser stand-in
// (./mock/server.ts) — see ./mode.ts for the switch. Callers never know
// which one answered; both speak the contract's shapes (./contract.ts) and
// both throw VipApiError (./errors.ts).

import type { VipApi } from './live'
import { liveVipApi } from './live'
import { toVipError } from './errors'
import { isVipMock } from './mode'

let mockApi: VipApi | null = null

async function api(): Promise<VipApi> {
  if (!isVipMock) return liveVipApi
  /* Loaded only in test mode, so the mock never ships in a live bundle's
     first load. */
  if (!mockApi) mockApi = (await import('./mock/server')).mockVipApi
  return mockApi
}

type Fn<K extends keyof VipApi> = VipApi[K]

function forward<K extends keyof VipApi>(name: K): Fn<K> {
  return (async (...args: Parameters<Fn<K>>) => {
    const target = await api()
    try {
      return await (target[name] as (...a: Parameters<Fn<K>>) => ReturnType<Fn<K>>)(...args)
    } catch (err) {
      /* Same error shape from both doors (e.g. the empty "switched off" 404
         becomes "VIP packages are unavailable right now."). */
      throw toVipError(err)
    }
  }) as unknown as Fn<K>
}

export const vipApi: VipApi = {
  getSettings: forward('getSettings'),
  getClubs: forward('getClubs'),
  getEvents: forward('getEvents'),
  getListings: forward('getListings'),
  createPackage: forward('createPackage'),
  getPackage: forward('getPackage'),
  changeTicket: forward('changeTicket'),
  deletePackage: forward('deletePackage'),
  searchFlights: forward('searchFlights'),
  addFlight: forward('addFlight'),
  removeFlight: forward('removeFlight'),
  searchHotels: forward('searchHotels'),
  getHotelRates: forward('getHotelRates'),
  lockHotel: forward('lockHotel'),
  addHotel: forward('addHotel'),
  removeHotel: forward('removeHotel'),
  getEsims: forward('getEsims'),
  addEsim: forward('addEsim'),
  removeEsim: forward('removeEsim'),
  checkout: forward('checkout'),
  getTransaction: forward('getTransaction'),
}
