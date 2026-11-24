// features/vip/mode.ts
//
// THE live/mock switch for VIP packages.
//
//   NEXT_PUBLIC_VIP_API_MODE=mock  → every VIP call is answered in the
//                                    browser by features/vip/mock/server.ts
//                                    (the contract's own example answers).
//                                    Nothing reaches the backend, the cart or
//                                    Stripe. For testing while the backend
//                                    is not live.
//   anything else / not set        → the real backend (live).
//
// Read when the site is built: change it, then restart `pnpm dev` or rebuild.
// Production must never be built with "mock".

export type VipApiMode = 'live' | 'mock'

export const VIP_API_MODE: VipApiMode =
  process.env.NEXT_PUBLIC_VIP_API_MODE === 'mock' ? 'mock' : 'live'

export const isVipMock = VIP_API_MODE === 'mock'
