'use client'

import { useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AlertTriangle, Loader2 } from 'lucide-react'
import { useMatchdayTeams } from '@/features/matchday/hooks'
import {
  TEAM_BASE,
  resolveCatalogueParam,
  teamSlugIndex,
} from '@/lib/slug'
import { TeamPageClient } from './client'

/* Rendered only when the server couldn't reach GET /teams: the same
   slug → id lookup, done in the browser with the catalogue hook. A
   redirect-worthy URL is replaced in place; a numeric id still works if
   the catalogue fails here too, so an old link is never a dead end. */
export function TeamResolve({ param }: { param: string }) {
  const router = useRouter()
  const { data, isLoading, isError, refetch } = useMatchdayTeams()
  const result = useMemo(
    () => (data ? resolveCatalogueParam(param, teamSlugIndex(data)) : null),
    [data, param],
  )

  useEffect(() => {
    if (result?.status === 'redirect') router.replace(`${TEAM_BASE}/${result.slug}`)
  }, [result, router])

  if (result && result.status !== 'missing') return <TeamPageClient teamId={result.id} />

  if (result?.status === 'missing') {
    return (
      <div className='page-container flex min-h-[50vh] flex-col items-center justify-center gap-2 py-20 text-center'>
        <p className='text-sm font-semibold'>We couldn&apos;t find that team</p>
        <Link
          href='/teams'
          className='font-mono text-[11px] text-primary underline underline-offset-2'
        >
          Browse all teams
        </Link>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className='flex min-h-[50vh] flex-col items-center justify-center gap-2 py-20 text-center'>
        <Loader2 className='size-5 animate-spin text-primary' />
        <p className='text-sm text-muted-foreground'>Loading team…</p>
      </div>
    )
  }

  if (/^\d+$/.test(param)) return <TeamPageClient teamId={Number(param)} />

  return (
    <div className='flex min-h-[50vh] flex-col items-center justify-center gap-2 py-20 text-center'>
      <AlertTriangle className='size-5 text-amber-400' />
      <p className='text-sm font-semibold'>
        {isError ? 'Couldn’t load this team right now' : 'Loading team…'}
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
