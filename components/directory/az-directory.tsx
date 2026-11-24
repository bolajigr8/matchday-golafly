'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { cn } from '@/lib/utils'

export interface DirectoryItem {
  id: number | string
  name: string
  image?: string | null
  href: string
}

const LETTERS = [
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
  'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', '0-9',
] as const

function letterOf(name: string): string {
  const c = name.trim().charAt(0).toUpperCase()
  return /[A-Z]/.test(c) ? c : '0-9'
}

/**
 * A-Z browse widget: a letter grid with per-letter counts, and a filtered
 * list of items below it — the same shape as footballticketnet.com's
 * "Teams starting with M" / "Tournaments starting with W" pages.
 *
 * This component has no data source of its own: it renders exactly the
 * `items` it's given. Whether the resulting page is "real backend data" or
 * "static/flagged data" is entirely down to what the caller passes — see
 * app/teams/client.tsx (real, from GET /teams) vs
 * app/international/client.tsx (curated + flagged) for the two cases.
 */
export function AZDirectory({
  items,
  emptyLabel = 'items',
  heading,
}: {
  items: DirectoryItem[]
  emptyLabel?: string
  /** e.g. "Browse teams alphabetically" */
  heading?: string
}) {
  const [active, setActive] = useState<string | null>(null)

  const counts = useMemo(() => {
    const map = new Map<string, number>()
    for (const item of items) {
      const l = letterOf(item.name)
      map.set(l, (map.get(l) ?? 0) + 1)
    }
    return map
  }, [items])

  const visible = useMemo(() => {
    const filtered = active
      ? items.filter((i) => letterOf(i.name) === active)
      : items
    return [...filtered].sort((a, b) => a.name.localeCompare(b.name))
  }, [items, active])

  return (
    <div>
      {heading && (
        <h2 className='mb-4 text-[13px] font-bold uppercase tracking-wide text-ticket-ink'>
          {heading}
        </h2>
      )}
      {/* Letter grid */}
      <div className='mb-8 grid grid-cols-5 gap-2 sm:grid-cols-9 sm:gap-2.5'>
        {LETTERS.map((letter) => {
          const count = counts.get(letter) ?? 0
          const isActive = active === letter
          return (
            <button
              key={letter}
              type='button'
              disabled={count === 0}
              onClick={() => setActive(isActive ? null : letter)}
              aria-pressed={isActive}
              className={cn(
                'flex h-[52px] flex-col items-center justify-center gap-1 rounded-lg transition-colors focus-visible:outline-2 focus-visible:outline-ticket',
                count === 0
                  ? 'cursor-not-allowed bg-ticket-surface/50 text-ticket-ink/30'
                  : isActive
                    ? 'bg-ticket-soft text-ticket-soft-foreground ring-1 ring-ticket'
                    : 'bg-ticket-surface text-ticket-ink ring-1 ring-ticket-line hover:ring-ticket/60',
              )}
            >
              <span className='font-display text-[20px] leading-none'>{letter}</span>
              <span className='text-[10px] leading-none opacity-70'>
                {count || '—'}
              </span>
            </button>
          )
        })}
      </div>

      {/* Active filter chip */}
      {active && (
        <div className='mb-4 flex items-center gap-3'>
          <span className='text-[13px] font-semibold text-ticket-ink'>
            {visible.length} starting with &ldquo;{active}&rdquo;
          </span>
          <button
            type='button'
            onClick={() => setActive(null)}
            className='text-[12px] font-semibold text-ticket-ink underline underline-offset-2'
          >
            Show all
          </button>
        </div>
      )}

      {/* List */}
      {visible.length === 0 ? (
        <p className='py-16 text-center text-sm text-muted-foreground'>
          No {emptyLabel} found.
        </p>
      ) : (
        <div className='grid grid-cols-1 gap-x-8 gap-y-1 sm:grid-cols-2 lg:grid-cols-3'>
          {visible.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className='flex items-center gap-3 rounded-lg px-2 py-2.5 text-ticket-ink transition-colors hover:bg-ticket-soft/60'
            >
              <span className='flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white ring-1 ring-ticket-line'>
                {item.image ? (
                  <img
                    src={item.image}
                    alt=''
                    className='h-full w-full object-contain'
                  />
                ) : (
                  <span className='font-heading text-[10px] font-bold text-muted-foreground'>
                    {item.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </span>
              <span className='truncate text-sm font-medium'>
                {item.name}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
