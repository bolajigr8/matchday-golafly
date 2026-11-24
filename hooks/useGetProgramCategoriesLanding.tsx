'use client'

import { useQuery } from '@tanstack/react-query'
import { QueryErrCodes, QueryKeys } from '@/models/query'
import { ProgramsService } from '@/services/programs'

export function useGetProgramCategoriesLanding() {
  return useQuery({
    queryKey: [QueryKeys.Get_Program_Categories_Landing],
    queryFn: () => ProgramsService.getLandingProgramCategories(),
    meta: {
      errCode: QueryErrCodes.ProgramCategoriesLanding,
    },
  })
}
