'use client'

import { Smartphone } from 'lucide-react'
import { usePublicFreeEsim } from '@/features/free-esim/hooks'
import {
  FREE_ESIM_NOTE_BODY,
  FREE_ESIM_NOTE_TITLE,
  showsFreeEsimNote,
} from '@/features/free-esim/rules'
import { cn } from '@/lib/utils'

/**
 * "Free 1 GB eSIM with your match tickets" (Free eSIM contract §4).
 * Renders nothing unless the offer is live (GET /free-esim/settings) and the
 * match qualifies (scope "europe" → venue in Europe, UK included). Never use
 * it on VIP pages; pass `vip` when a cart holds a VIP package.
 * It is a message only: the backend grants the eSIM by itself.
 */
export function FreeEsimNote({
  venueCountry,
  vip = false,
  enabled = true,
  className,
}: {
  venueCountry: string | null | undefined
  vip?: boolean
  /** false skips the request (e.g. no match ticket in the cart). */
  enabled?: boolean
  className?: string
}) {
  const { data } = usePublicFreeEsim({ enabled: enabled && !vip })
  if (!enabled || !showsFreeEsimNote(data, { venueCountry, vip })) return null

  return (
    <div
      data-testid='free-esim-note'
      className={cn(
        'flex items-start gap-3 rounded-xl border border-brand-text/30 bg-primary/5 px-4 py-3',
        className,
      )}
    >
      <span className='mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-brand-text'>
        <Smartphone className='size-4' />
      </span>
      <span className='min-w-0'>
        <span className='block text-[13px] font-bold text-foreground'>
          {FREE_ESIM_NOTE_TITLE}
        </span>
        <span className='mt-0.5 block text-[11.5px] leading-snug text-muted-foreground'>
          {FREE_ESIM_NOTE_BODY}
        </span>
      </span>
    </div>
  )
}
