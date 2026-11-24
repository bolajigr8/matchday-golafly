'use client'

// features/vip/use-available.ts
//
// True when VIP packages are switched on (see app/api/vip/available). False
// while unknown, so a VIP link never appears and then leads to a dead page.

import { useQuery } from '@tanstack/react-query'

export function useVipAvailable(): boolean {
  const { data } = useQuery({
    queryKey: ['vip', 'available'],
    queryFn: async () => {
      const res = await fetch('/api/vip/available')
      if (!res.ok) return false
      const body = (await res.json()) as { available?: boolean }
      return body.available === true
    },
    /* Re-asked after a minute (and on focus), so an admin's switch shows soon. */
    staleTime: 60_000,
    retry: false,
  })
  return data === true
}
