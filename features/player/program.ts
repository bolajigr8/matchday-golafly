'use client'

import publicAxios from '@/services/golafly-public-axios'
import { getRegistrationPrograms } from '@/features/register-player/api'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { QueryKeys } from '@/models/query'
import { getFanToken } from '@/features/fan/session'
import type { ApiPlayer } from '@/services/players'
import type {
  ApiResponse,
  Program,
  ProgramApplicant,
  ProgramApplicantPayload,
} from '@/services/programs'

/* THE PROGRAM THE PLAYER REGISTERED ON.
 *
 * /register/player creates the player (POST /v1/players), then takes a spot
 * on a program (POST /v1/program/{id}/applicants) with `player_id` in the
 * payload. There is no "my registration" endpoint, so this finds it: every
 * program the public can see, then each program's registered players
 * (GET /v1/program/{id}/applicants is public), matched on player_id — or on
 * email, for a player an admin registered by hand.
 *
 * ── WHY NOT fanAxios ─────────────────────────────────────────────────────
 * fanAxios signs the player out on any 401. The update route
 * (PATCH /v1/program/applicants/{id}) may be admin-only; a 401 there must
 * mean "you can't edit this here", not "you are signed out". */

const client = publicAxios

export interface OwnRegistration {
  applicant: ProgramApplicant
  program: Program
}

async function findOwnRegistration(player: ApiPlayer): Promise<OwnRegistration | null> {
  // Only programs that take registrations have spots.
  const programs = (await getRegistrationPrograms()).filter(p => (p.spot ?? 0) > 0)

  const email = player.email?.trim().toLowerCase()
  for (const program of programs) {
    const applicants = await client
      .get<ApiResponse<ProgramApplicant[]>>(`/v1/program/${program.id}/applicants`)
      .then(r => r.data.data)
      .catch(() => [] as ProgramApplicant[])
    const mine =
      applicants.find(a => Number(a.payload?.player_id) === player.id) ??
      applicants.find(a => !!email && a.payload?.email?.trim().toLowerCase() === email)
    if (mine) return { applicant: mine, program }
  }
  return null
}

export function useOwnRegistration(player: ApiPlayer | null) {
  return useQuery({
    queryKey: [QueryKeys.Player_Registration, player?.id],
    queryFn: () => findOwnRegistration(player as ApiPlayer),
    enabled: !!player,
    staleTime: 5 * 60 * 1000,
    retry: false,
  })
}

/* 401/403 from the update route: players aren't allowed to edit here. */
export const isForbidden = (error: unknown) => {
  const status = (error as { response?: { status?: number } })?.response?.status
  return status === 401 || status === 403
}

export function useUpdateOwnRegistration(playerId: number | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ applicantId, payload }: { applicantId: number; payload: ProgramApplicantPayload }) => {
      const token = getFanToken()
      const { data } = await client.patch<ApiResponse<ProgramApplicant>>(
        `/v1/program/applicants/${applicantId}`,
        { payload },
        token ? { headers: { Authorization: `Bearer ${token}` } } : undefined,
      )
      return data
    },
    onSuccess: response => {
      qc.invalidateQueries({ queryKey: [QueryKeys.Player_Registration, playerId] })
      toast.success('Details updated', { description: response.message })
    },
    onError: (error: unknown) => {
      if (isForbidden(error)) return // the sheet explains this one in place
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(message ?? 'Could not update your details.')
    },
  })
}
