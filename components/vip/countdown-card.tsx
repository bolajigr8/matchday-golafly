'use client'

import { cn } from '@/lib/utils'
import { useCountdown } from '@/features/vip/hooks'

/* "NEXT BIG NIGHT" countdown card — the landing hero (346:2445) and the
   booking-flow Match page hero (504:3038) share it. Ticks every second;
   the seconds cell is gold. */

const label =
  'font-mono text-[11px] font-medium leading-[normal] tracking-[2.42px] text-vip-gold-text'

export function VipCountdownCard({
  className,
  title,
  subtitle,
  kickoff,
}: {
  className?: string
  title: string
  subtitle: string
  kickoff: string | undefined
}) {
  const left = useCountdown(kickoff)
  const pad = (n: number | undefined) =>
    n === undefined ? '--' : String(n).padStart(2, '0')

  const cells: { value: string; unit: string; gold?: boolean }[] = [
    { value: pad(left?.days), unit: 'days' },
    { value: pad(left?.hours), unit: 'hrs' },
    { value: pad(left?.minutes), unit: 'min' },
    { value: pad(left?.seconds), unit: 'sec', gold: true },
  ]

  return (
    <div
      className={cn(
        'dark flex w-full max-w-[330px] flex-col gap-3.5 rounded-3xl border border-vip-line/12 bg-vip-panel/90 p-6',
        className,
      )}
    >
      <p className={label}>NEXT BIG NIGHT</p>
      <p className='text-[19px] font-bold leading-[normal] text-vip-fg'>{title}</p>
      <p className='text-[14px] leading-[normal] text-vip-muted'>{subtitle}</p>
      <div className='flex gap-2' role='timer' aria-label={`Kick-off in ${left?.days ?? '–'} days`}>
        {cells.map((c) => (
          <div
            key={c.unit}
            className='flex w-16 flex-col items-center gap-0.5 rounded-xl bg-vip-line/6 pb-2 pt-2.5'
          >
            <span
              className={cn(
                'font-display text-[34px] leading-8 tabular-nums',
                c.gold ? 'text-vip-gold-text' : 'text-vip-fg',
              )}
            >
              {c.value}
            </span>
            <span className='text-[11.5px] leading-[normal] text-vip-muted'>{c.unit}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
