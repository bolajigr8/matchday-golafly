import { Plane, Ticket } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Pillar } from '@/lib/pillar-intro'

/* The pillar badge: PLAY IT, LIVE IT or TRAVEL FOR IT, above a product's
   headline. All three share one shape; the icon and word tell them apart.

   `onInk` is for bands and photos that stay dark in both themes, where neon
   may be used as type. On the normal page surface the accent uses
   text-brand-text, which stays readable in light mode. */

const WORDS: Record<Pillar, string> = {
  play: 'PLAY',
  live: 'LIVE',
  travel: 'TRAVEL FOR',
}

function FootballIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='1.8'
      strokeLinecap='round'
      strokeLinejoin='round'
      aria-hidden
      className={className}
    >
      <circle cx='12' cy='12' r='9' />
      <path d='m12 7 4 3-1.5 5h-5L8 10z' />
      <path d='M12 3v4M21 10h-5M3 10h5M7 20l2.5-5M17 20l-2.5-5' />
    </svg>
  )
}

const ICONS = { play: FootballIcon, live: Ticket, travel: Plane } as const

export function PillarBadge({
  pillar,
  size = 'md',
  onInk = false,
  className,
}: {
  pillar: Pillar
  size?: 'sm' | 'md'
  onInk?: boolean
  className?: string
}) {
  const Icon = ICONS[pillar]
  const accent = onInk ? 'text-primary' : 'text-brand-text'

  return (
    <span
      translate='no'
      className={cn(
        'notranslate inline-flex max-w-full items-center rounded-full border bg-primary/10 font-mono font-bold uppercase leading-none tracking-[0.12em] whitespace-nowrap',
        onInk ? 'border-primary/40 text-band-ink-fg' : 'border-brand-text/40 text-foreground',
        size === 'sm'
          ? 'gap-1.5 py-1 pr-2.5 pl-2 text-[9px] sm:gap-2 sm:py-1.5 sm:pr-3 sm:text-[11px]'
          : 'gap-2 py-1.5 pr-3.5 pl-2.5 text-[11px] sm:py-2 sm:pr-4 sm:text-[13px]',
        className,
      )}
    >
      <Icon
        aria-hidden
        className={cn(accent, size === 'sm' ? 'size-3 sm:size-3.5' : 'size-4 sm:size-[18px]')}
      />
      <span>
        {WORDS[pillar]} <span className={accent}>IT</span>
      </span>
    </span>
  )
}
