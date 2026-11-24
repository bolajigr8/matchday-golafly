'use client'

import { useQuery } from '@tanstack/react-query'
import { QueryKeys } from '@/models/query'
import {
  getProgramApplicants,
  getProgramAvailability,
  getRegistrationPrograms,
} from './api'

export function useRegistrationPrograms() {
  return useQuery({
    queryKey: [QueryKeys.Register_Programs],
    queryFn: getRegistrationPrograms,
    staleTime: 60 * 1000,
  })
}

/* Refetched every 30s, so a position someone else takes shows up while the
   player is still filling in the later steps. */
export function useProgramAvailability(programId: number | null) {
  return useQuery({
    queryKey: [QueryKeys.Register_Program_Availability, programId],
    queryFn: () => getProgramAvailability(programId as number),
    enabled: programId !== null,
    retry: false,
    refetchInterval: 30_000,
  })
}

/* The Camp panel's player list. No retries: if the list is ever made
   admin-only, the panel just leaves it out. */
export function useProgramApplicants(programId: number | null) {
  return useQuery({
    queryKey: [QueryKeys.Register_Program_Applicants, programId],
    queryFn: () => getProgramApplicants(programId as number),
    enabled: programId !== null,
    retry: false,
    refetchInterval: 30_000,
  })
}
