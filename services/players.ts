import golaflyAxios from '@/services/golafly-axios'
import type { ApiResponse } from '@/services/programs'
import type { PlayerEvaluation } from '@/features/scout/evaluation'

/**
 * Players. Ported from the Golafly frontend's players service — same backend.
 *
 * The admin list previously used a hand-trimmed 9-field shape, which meant the
 * profile photo, passport, medical certificate, highlight images and highlight
 * videos were all unreachable from the dashboard.
 */

export interface VideoHighlight {
  title: string
  url: string
  duration?: string
  thumbnail_url?: string
  is_main?: boolean
}

export interface SeasonStats {
  season?: string
  appearances?: number
  goals?: number
  assists?: number
  clean_sheets?: number
  minutes_played?: number
  yellow_cards?: number
  red_cards?: number
}

export interface ApiPlayer {
  id: number

  /* Identity */
  first_name: string
  last_name: string
  email: string
  phone: string | null
  date_of_birth?: string | null
  gender?: string | null
  nationality: string | null
  country_of_residence?: string | null
  city?: string | null

  /* Football profile */
  primary_position: string | null
  secondary_position?: string | null
  preferred_foot?: string | null
  jersey_number?: string | null
  height_cm?: string | number | null
  weight_kg?: string | number | null
  current_club_academy?: string | null
  current_level: string | null
  /* "Available for Trials", "Open to Opportunities", "Free Agent", … — NOT a
     pipeline state, which is why a null must never default to "Pending". */
  player_status: string | null

  /* Assessment */
  player_attributes?: Record<string, number> | null
  career_statistics?: SeasonStats | SeasonStats[] | null
  scout_notes?: string | null
  additional_notes?: string | null

  /* Media and documents — all absolute URLs, Cloudinary for the images */
  profile_photo_url?: string | null
  passport_document_url?: string | null
  medical_certificate_url?: string | null
  highlights?: string[] | null
  highlight_video_url?: string | null
  highlight_videos?: VideoHighlight[] | null

  /* The scout's evaluation of this player.
   *
   * NOT SENT BY /v1/players TODAY — optional for exactly that reason. It is
   * returned by /v1/scout/players and by /v1/scouts/{id}, both of which are
   * scoped to one scout, which left the admin with no way to read an
   * evaluation without fetching every scout in turn: one request per scout,
   * and no way to ask "what is pending" without pulling all of them first.
   *
   * An evaluation is keyed on the PLAYER (PUT /v1/players/{id}/evaluation,
   * PATCH /v1/players/{id}/evaluation/status), so this is where it belongs.
   * The admin screens read it from here and degrade to "unavailable" until
   * the backend adds it — at which point they light up with no code change.
   *
   * Requested of the backend team: add `evaluation` to GET /v1/players and
   * GET /v1/players/{id}, the same nested object /v1/scout/players returns. */
  evaluation?: PlayerEvaluation | null

  created_at: string
  updated_at?: string
}

export type PlayersResponse = ApiResponse<ApiPlayer[]>
export type PlayerResponse = ApiResponse<ApiPlayer>

export function playerFullName(p: Pick<ApiPlayer, 'first_name' | 'last_name' | 'email'>): string {
  return [p.first_name, p.last_name].filter(Boolean).join(' ') || p.email
}

export class PlayersService {
  public static async getPlayers(): Promise<PlayersResponse> {
    const response = await golaflyAxios.get<PlayersResponse>('/v1/players', {
      headers: { Accept: 'application/json' },
    })
    return response.data
  }

  public static async getPlayerById(id: number): Promise<PlayerResponse> {
    const response = await golaflyAxios.get<PlayerResponse>(`/v1/players/${id}`, {
      headers: { Accept: 'application/json' },
    })
    return response.data
  }
}
