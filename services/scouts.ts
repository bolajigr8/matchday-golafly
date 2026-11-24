import golaflyAxios from '@/services/golafly-axios'
import type { ApiResponse } from '@/services/programs'
import type {
  AssignedPlayer,
  PlayerEvaluation,
} from '@/features/scout/evaluation'

/**
 * Scouts, and which players each one holds.
 *
 * Six endpoints, all admin-authenticated — golaflyAxios attaches the bearer
 * token from the admin session. Kept out of admin-resources.ts because that
 * file is deliberately READ-ONLY list endpoints; this one writes.
 *
 * ── SHAPES WORTH KNOWING BEFORE YOU READ THE SCREEN ───────────────────────
 * `id` is a ULID STRING (01M1VAPG6N3KHKMJ4V57GAPWAP), not a number — unlike
 * every other id in this dashboard. A player id, in the same URL, IS a number.
 * Both appear in the assign path, so the two must not be confused.
 *
 * The index returns scouts WITHOUT their players; only show/assign/unassign
 * carry `players[]`. That is why `players` is optional here rather than
 * required — and why the screen fetches per-scout detail for its counts. If
 * the backend later includes players on the index, nothing here changes and
 * the extra fetches stop happening on their own.
 *
 * Create takes name and email ONLY. There is no role parameter and no
 * activation flag; the server decides both (role "scout", status 1).
 */

export interface ApiScout {
  id: string
  name: string
  email: string
  role: string
  /** 1 = active. Numeric, not boolean — do not truthiness-test a future 2. */
  status: number
  created_at: string
  updated_at: string
  /** Present on show / assign / unassign. Absent on the index.
   *
   *  Each player carries its own `evaluation`, which is what lets the admin
   *  Evaluations tab exist without an endpoint of its own — there is no
   *  "list all evaluations" call, and there does not need to be. */
  players?: AssignedPlayer[]
}

export interface CreateScoutPayload {
  name: string
  email: string
}

export type ScoutsResponse = ApiResponse<ApiScout[]>
export type ScoutResponse = ApiResponse<ApiScout>

/** The players a scout holds, whatever the response was shaped like. */
export function scoutPlayers(scout: ApiScout | undefined | null): AssignedPlayer[] {
  return scout?.players ?? []
}

const json = { headers: { Accept: 'application/json' } }

export class ScoutsService {
  public static async getScouts(): Promise<ScoutsResponse> {
    const response = await golaflyAxios.get<ScoutsResponse>('/v1/scouts', json)
    return response.data
  }

  public static async getScoutById(id: string): Promise<ScoutResponse> {
    const response = await golaflyAxios.get<ScoutResponse>(`/v1/scouts/${id}`, json)
    return response.data
  }

  public static async createScout(payload: CreateScoutPayload): Promise<ScoutResponse> {
    const response = await golaflyAxios.post<ScoutResponse>('/v1/scouts', payload, json)
    return response.data
  }

  public static async deleteScout(id: string): Promise<ApiResponse<null>> {
    const response = await golaflyAxios.delete<ApiResponse<null>>(
      `/v1/scouts/${id}`,
      json,
    )
    return response.data
  }

  /* Assign and unassign are the same path under two verbs, and both return the
     whole scout with its refreshed `players[]` — so the caller can seed the
     detail cache instead of firing a follow-up GET. */

  public static async assignPlayer(
    scoutId: string,
    playerId: number,
  ): Promise<ScoutResponse> {
    const response = await golaflyAxios.post<ScoutResponse>(
      `/v1/scouts/${scoutId}/players/${playerId}`,
      {},
      json,
    )
    return response.data
  }

  public static async unassignPlayer(
    scoutId: string,
    playerId: number,
  ): Promise<ScoutResponse> {
    const response = await golaflyAxios.delete<ScoutResponse>(
      `/v1/scouts/${scoutId}/players/${playerId}`,
      json,
    )
    return response.data
  }
}

/* ── The admin's half of an evaluation ────────────────────────────────────
   A scout writes the scores; the admin rules on them. Two narrow PATCHes
   rather than one — approving an evaluation and annotating it are different
   decisions, and an admin who wanted to leave a note should not have to resend
   a status to do it.

   Both are keyed on the PLAYER id, not the evaluation id, and both return the
   whole evaluation. */

export type EvaluationResponse = ApiResponse<PlayerEvaluation>

export class EvaluationAdminService {
  public static async updateStatus(
    playerId: number,
    status: string,
  ): Promise<EvaluationResponse> {
    const response = await golaflyAxios.patch<EvaluationResponse>(
      `/v1/players/${playerId}/evaluation/status`,
      { status },
      json,
    )
    return response.data
  }

  public static async updateNote(
    playerId: number,
    note: string,
  ): Promise<EvaluationResponse> {
    const response = await golaflyAxios.patch<EvaluationResponse>(
      `/v1/players/${playerId}/evaluation/note`,
      { note },
      json,
    )
    return response.data
  }
}
