// components/promo/promo-badge.tsx
//
// The green "BLACK FRIDAY · 20% OFF" pill for the match promo.

import { Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

export function PromoBadge({
  label,
  percent,
  className,
}: {
  label: string
  percent: number
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex max-w-full items-center gap-1 rounded-md bg-primary/15 px-1.5 py-1 ring-1 ring-inset ring-brand-text/30',
        className,
      )}
    >
      <Sparkles className='size-2.5 shrink-0 text-brand-text' strokeWidth={2.5} />
      <span className='truncate font-mono text-[10px] font-bold uppercase leading-none tracking-wide text-brand-text'>
        {label} · {percent}% OFF
      </span>
    </span>
  )
}
