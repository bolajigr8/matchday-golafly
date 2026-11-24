'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { useHydrated } from '@/hooks/use-hydrated'

/* Figma "WFS · Early bird countdown": four glass tiles (days, hrs, min,
   sec) ticking down to the end of the early-bird price; the seconds are
   lime. `size='s'` is the 0.8× copy in the booking pages' event strip.
   The clock only starts once the page is live in the browser, so the server
   and the first client render always show the same "--". */

function parts(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000))
  return [Math.floor(s / 86400), Math.floor((s % 86400) / 3600), Math.floor((s % 3600) / 60), s % 60]
}

const LABELS = ['DAYS', 'HRS', 'MIN', 'SEC']

export function SummitCountdown({ endsAt, size = 'm', className }: { endsAt: string; size?: 'm' | 's'; className?: string }) {
  const hydrated = useHydrated()
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(t)
  }, [])
  const values = parts(new Date(endsAt).getTime() - now)
  const small = size === 's'
  return (
    <div role='timer' aria-label='Early bird price ends in' className={cn('flex items-center', small ? 'gap-1.5' : 'gap-2', className)}>
      {values.map((v, i) => (
        <span
          key={LABELS[i]}
          className={cn(
            'flex flex-col items-center border border-white/14 bg-white/8',
            small ? 'w-[51px] gap-0.5 rounded-[10px] py-2' : 'w-16 gap-0.5 rounded-xl py-2.5',
          )}
        >
          <span
            className={cn(
              'font-display leading-[1.2] tabular-nums',
              small ? 'text-[27.2px]' : 'text-[34px]',
              i === 3 ? 'text-wfs-lime' : 'text-white',
            )}
          >
            {hydrated ? String(v).padStart(2, '0') : '--'}
          </span>
          <span
            className={cn(
              'font-mono font-medium leading-[normal] text-wfs-on-ink-muted',
              small ? 'text-[7.6px] tracking-[1.06px]' : 'text-[9.5px] tracking-[1.33px]',
            )}
          >
            {LABELS[i]}
          </span>
        </span>
      ))}
    </div>
  )
}
