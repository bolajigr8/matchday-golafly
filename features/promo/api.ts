// features/promo/api.ts
import axiosInstance from '@/lib/axios'
import type { FlightPromo, MatchPromo } from './types'

export async function getMatchPromo(): Promise<MatchPromo | null> {
  const { data } = await axiosInstance.get<{ data: MatchPromo }>('/api/v1/match-promo')
  return data.data ?? null
}

export async function getFlightPromo(): Promise<FlightPromo | null> {
  const { data } = await axiosInstance.get<{ data: FlightPromo }>('/api/v1/flight-promo')
  return data.data ?? null
}
