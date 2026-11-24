import fanAxios from '@/services/fan-axios'
import type { ApiResponse } from '@/services/programs'
import type {
  AssignedPlayer,
  PlayerEvaluation,
  SaveEvaluationPayload,
} from '@/features/scout/evaluation'

/**
 * The scout's own three endpoints — what a signed-in scout may read and write.
 *
 * ── WHY fanAxios ──────────────────────────────────────────────────────────
 * There is ONE login for every non-admin role, so a scout and a fan hold the
 * same session cookie and the same bearer token. `fanAxios` is that shared
 * client. The name is historical; it is not a fan-only instance, and standing
 * up a second one pointed at the same session would only mean two places for
 * interceptors to drift. See the same argument at features/scout/session.ts.
 *
 * `golaflyAxios` is NOT interchangeable here: it hard-attaches the ADMIN token
 * and calls clearAdminSession() on a 401, so a scout request through it would
 * carry an admin's credentials on any machine where both sessions exist.
 *
 * ── NO SCOUT ID IN ANY PATH ───────────────────────────────────────────────
 * `/v1/scout/players` means "the players assigned to whoever holds this
 * token". That is not shorthand — it is what makes the scoping enforceable: a
 * scout cannot request another scout's players by editing a URL, because there
 * is no URL to edit.
 *
 * The write breaks that pattern and is worth noticing: the evaluation path is
 * `/v1/players/{id}/evaluation`, an ADMIN-shaped path with a player id in it.
 * The server is the authority on whether this scout holds that player.
 */

const json = { headers: { Accept: 'application/json' } }

export type AssignedPlayersResponse = ApiResponse<AssignedPlayer[]>
export type AssignedPlayerResponse = ApiResponse<AssignedPlayer>
export type EvaluationResponse = ApiResponse<PlayerEvaluation>

export class ScoutPortalService {
  /** Every player assigned to the signed-in scout, each with its evaluation
   *  attached. Flat array, no pagination wrapper. */
  public static async listAssignedPlayers(): Promise<AssignedPlayersResponse> {
    const response = await fanAxios.get<AssignedPlayersResponse>('/v1/scout/players', json)
    return response.data
  }

  /** One assigned player, with the full profile the list omits — documents,
   *  highlights, career statistics, achievements. */
  public static async getAssignedPlayer(id: number): Promise<AssignedPlayerResponse> {
    const response = await fanAxios.get<AssignedPlayerResponse>(
      `/v1/scout/players/${id}`,
      json,
    )
    return response.data
  }

  /** Upsert. This REPLACES the evaluation rather than merging into it, so the
   *  caller must send every field every time — a partial body blanks out the
   *  groups it leaves out. Returns the stored evaluation, so the caller can
   *  seed its cache instead of refetching. */
  public static async saveEvaluation(
    playerId: number,
    payload: SaveEvaluationPayload,
  ): Promise<EvaluationResponse> {
    const response = await fanAxios.put<EvaluationResponse>(
      `/v1/players/${playerId}/evaluation`,
      payload,
      json,
    )
    return response.data
  }
}
