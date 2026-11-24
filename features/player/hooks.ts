'use client'

import axios from 'axios'
import { useQuery } from '@tanstack/react-query'
import { QueryKeys } from '@/models/query'
import { useHydratedFan } from '@/features/fan/hooks'
import type { FanApiResponse } from '@/features/fan/types'
import type { ApiPlayer } from '@/services/players'

/* THE PLAYER'S OWN RECORD.
 *
 * The API has no "my player profile" endpoint — every /v1/player/* path is an
 * unregistered route. What does exist is GET /v1/players/{id}, which is PUBLIC
 * (the Golafly frontend's public profile page reads it) and returns the full
 * record with the evaluation attached.
 *
 * So the dashboard needs the player id for the signed-in account. It is taken
 * from the login response (`player_id`, or `player.id`) and kept in the
 * session cookie. When the API does not send one, `linked` is false and every
 * screen says the profile is not connected yet — rather than showing someone
 * else's record or demo data.
 *
 * ── WHY NOT fanAxios ─────────────────────────────────────────────────────
 * fanAxios clears the session on any 401. The route is public today; if it is
 * ever guarded for admins only, a player's valid token would 401 and silently
 * sign them out. A token-free client can only ever fail this one request. */

const publicAxios = axios.create({
  baseURL:
    process.env.NEXT_PUBLIC_GOLAFLY_USER_API_BASE_URL ||
    process.env.NEXT_PUBLIC_GOLAFLY_API_BASE_URL ||
    'https://api.golafly.com/api',
  headers: { Accept: 'application/json' },
})

async function getPlayer(id: number): Promise<FanApiResponse<ApiPlayer>> {
  const { data } = await publicAxios.get<FanApiResponse<ApiPlayer>>(`/v1/players/${id}`)
  return data
}

const toId = (v: unknown): number | null => {
  const n = typeof v === 'number' ? v : typeof v === 'string' ? Number(v) : NaN
  return Number.isInteger(n) && n > 0 ? n : null
}

export function useOwnPlayer() {
  const { user, hasHydrated } = useHydratedFan()
  const playerId = toId(user?.player_id)

  const query = useQuery({
    queryKey: [QueryKeys.Player_Self, playerId],
    queryFn: () => getPlayer(playerId as number),
    enabled: playerId !== null,
    staleTime: 60 * 1000,
    retry: false,
  })

  return {
    query,
    player: query.data?.data ?? null,
    /** False until the session has been read, so screens can hold a skeleton
     *  instead of flashing "not linked". */
    hasHydrated,
    linked: playerId !== null,
  }
}

/** A value off the raw record for keys the ApiPlayer type does not declare
 *  (player_cv, passport_document, language_spoken, …). */
export function rawField(player: ApiPlayer | null, key: string): unknown {
  return player ? (player as unknown as Record<string, unknown>)[key] : undefined
}
