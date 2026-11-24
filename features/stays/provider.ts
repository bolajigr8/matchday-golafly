// features/stays/provider.ts
//
// The single seam every hotel flow reads to decide which supplier's steps to
// render. Contract "Citizenship, room name and failed hotel" v1.1, section 5:
// GET /stays/providers lists ONLY the provider that is switched on (admin →
// Settings → Providers), so data[0] is the live one.
//
//   - one provider        → use its flow ('etg' | 'duffel')
//   - empty list          → 'none': hide the hotel search ("not available")
//   - request failed      → NEXT_PUBLIC_STAYS_PROVIDER fallback, with a
//                           console warning for the team (never shown to the
//                           customer)

import { useQuery } from '@tanstack/react-query'
import axiosInstance from '@/lib/axios'
import { STAYS_PROVIDER, type StaysProvider } from '@/lib/stays-config'

interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
}

interface PublicStaysProvider {
  slug: string
  enabled: boolean
}

/** 'none' = the backend has no hotel provider switched on. */
export type ActiveStaysProvider = StaysProvider | 'none'

function isProvider(slug: unknown): slug is StaysProvider {
  return slug === 'etg' || slug === 'duffel'
}

export async function fetchActiveStaysProvider(): Promise<ActiveStaysProvider> {
  let list: PublicStaysProvider[]
  try {
    const { data } = await axiosInstance.get<ApiResponse<PublicStaysProvider[]>>(
      '/api/v1/stays/providers',
    )
    if (!Array.isArray(data?.data)) throw new Error('response has no data list')
    list = data.data
  } catch (error) {
    // For the team only: the customer just sees the hotel step as usual.
    console.warn(
      `[stays] GET /stays/providers failed, using the .env fallback NEXT_PUBLIC_STAYS_PROVIDER=${STAYS_PROVIDER}.`,
      error,
    )
    return STAYS_PROVIDER
  }

  if (list.length === 0) return 'none'
  const slug = (list.find((p) => p.enabled) ?? list[0]).slug
  if (isProvider(slug)) return slug
  console.warn(`[stays] GET /stays/providers returned an unknown provider "${slug}"; hotels hidden.`)
  return 'none'
}

/**
 * Read once per page load (contract 5.4: an admin can switch at any time, so
 * no long cache). No placeholder: the hotel box waits for the real answer
 * instead of flashing the fallback provider first.
 */
export function useStaysProvider() {
  return useQuery({
    queryKey: ['stays-provider'],
    queryFn: fetchActiveStaysProvider,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
  })
}
