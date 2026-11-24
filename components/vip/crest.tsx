'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

/* A team crest. Like the main Matchday matches page (components/tickets/
   primitives TeamCrest): the transparent crest on its own, no tile or ring
   behind it. `ring` adds Figma's gold ring (seats banner only). `src` is
   Figma's crest (Barcelona, Real Madrid) or the supplier crest for the
   backend's team id; without one, or if it fails, the initials in a ring. */
export function VipCrest({
  name,
  src,
  ring = false,
  className,
}: {
  name: string
  src: string | null
  ring?: boolean
  className?: string
}) {
  const [failed, setFailed] = useState<string | null>(null)
  const initials = name
    .split(/\s+/)
    .filter((w) => /[A-Za-zÀ-ÿ]/.test(w[0] ?? ''))
    .map((w) => w[0])
    .join('')
    .slice(0, 3)
    .toUpperCase()
  const show = src && failed !== src
  return (
    <span
      className={cn(
        'relative flex size-10 shrink-0 items-center justify-center',
        (ring || !show) && 'rounded-full border-2 border-vip-gold/80 bg-vip-sunken',
        className,
      )}
    >
      {show ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt=''
          loading='lazy'
          onError={() => setFailed(src)}
          className={cn('object-contain', ring ? 'size-[62%]' : 'size-full')}
        />
      ) : (
        <span className='font-heading text-[12px] font-bold leading-none text-vip-gold-text'>{initials}</span>
      )}
    </span>
  )
}
