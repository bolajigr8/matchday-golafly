'use client'

import { useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AlertTriangle, Loader2 } from 'lucide-react'
import { useMatchdayTournaments } from '@/features/matchday/hooks'
import {
  TOURNAMENT_BASE,
  resolveCatalogueParam,
  tournamentSlugIndex,
} from '@/lib/slug'
import { TournamentPageClient } from './client'

/* Rendered only when the server couldn't reach GET /tournaments: the same
   slug → id lookup, done in the browser with the catalogue hook. A
   redirect-worthy URL is replaced in place; a numeric id still works if
   the catalogue fails here too, so an old link is never a dead end. */
export function TournamentResolve({ param }: { param: string }) {
  const router = useRouter()
  const { data, isLoading, isError, refetch } = useMatchdayTournaments()
  const result = useMemo(
    () => (data ? resolveCatalogueParam(param, tournamentSlugIndex(data)) : null),
    [data, param],
  )

  useEffect(() => {
    if (result?.status === 'redirect') router.replace(`${TOURNAMENT_BASE}/${result.slug}`)
  }, [result, router])

  if (result && result.status !== 'missing') return <TournamentPageClient tourId={result.id} />

  if (result?.status === 'missing') {
    return (
      <div className='page-container flex min-h-[50vh] flex-col items-center justify-center gap-2 py-20 text-center'>
        <p className='text-sm font-semibold'>We couldn&apos;t find that competition</p>
        <Link
          href='/tournaments'
          className='font-mono text-[11px] text-primary underline underline-offset-2'
        >
          Browse all competitions
        </Link>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className='flex min-h-[50vh] flex-col items-center justify-center gap-2 py-20 text-center'>
        <Loader2 className='size-5 animate-spin text-primary' />
        <p className='text-sm text-muted-foreground'>Loading competition…</p>
      </div>
    )
  }

  if (/^\d+$/.test(param)) return <TournamentPageClient tourId={Number(param)} />

  return (
    <div className='flex min-h-[50vh] flex-col items-center justify-center gap-2 py-20 text-center'>
      <AlertTriangle className='size-5 text-amber-400' />
      <p className='text-sm font-semibold'>
        {isError ? 'Couldn’t load this competition right now' : 'Loading competition…'}
      </p>
      <button
        type='button'
        onClick={() => refetch()}
        className='font-mono text-[11px] text-primary underline underline-offset-2'
      >
        Try again
      </button>
    </div>
  )
}
