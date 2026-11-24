'use client'

/* Desktop "Competitions" dropdown.

   ┌─────────────────────┬──────────────────────────────────────┐
   │ CLUB COMPETITIONS   │ PREMIER LEAGUE TEAMS                 │
   │ UEFA Champions L. ◀ │ AFC Bournemouth      Arsenal         │
   │ Premier League      │ Aston Villa          Brentford       │
   │ …                   │ …                                    │
   │ INTERNATIONAL       │                                      │
   │ Nations League      │                                      │
   ├─────────────────────┴──────────────────────────────────────┤
   │ All competitions →   International hub →                   │
   └────────────────────────────────────────────────────────────┘

   Left: one column with the club and international competitions under
   their existing group headings (no duplicates). Hovering or focusing one
   fills the right column with that competition's teams, each linking to
   its team page; the first competition is shown by default.

   Teams come from useTournamentTeams (GET /events?tour_id=, cached 30
   minutes) and are only requested once `armed` — set by the navbar the
   first time the menu is hovered or focused — so a page load never pays
   for a menu nobody opened. */

import Link from 'next/link'
import { useState } from 'react'
import { ArrowRight, Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { NavChild, NavGroup } from '@/store/data'
import { useTournamentTeams } from '@/features/matchday/hooks'
import { useCatalogueSlugs } from '@/features/matchday/use-catalogue-slugs'

/* Same recipes as components/navbar.tsx (the navbar imports this file). */
const FOCUS_RING =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'
const POPOVER_ITEM =
  'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13.5px] transition-colors duration-150 hover:bg-muted hover:text-foreground focus-visible:bg-muted focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50'
const GROUP_LABEL =
  'px-3 pb-1 pt-2 font-mono text-[10.5px] font-medium uppercase tracking-[0.2em] text-muted-foreground'

export function CompetitionsPanel({
  items,
  hrefOf,
  idOf,
  armed,
  onNavigate,
}: {
  items: NavChild[]
  hrefOf: (c: NavChild) => string
  /** The child's real tournament_id, or undefined if it didn't resolve. */
  idOf: (c: NavChild) => number | undefined
  armed: boolean
  onNavigate: () => void
}) {
  const slugs = useCatalogueSlugs()

  /* One row per competition: a nav label that resolves to the same
     tournament as an earlier one is dropped. */
  const seen = new Set<string>()
  const competitions = items.filter((c) => {
    if (c.cta) return false
    const id = idOf(c)
    const key = id != null ? `id:${id}` : `label:${c.label}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
  const groups: { group?: NavGroup; list: NavChild[] }[] = []
  for (const c of competitions) {
    const g = groups.find((x) => x.group === c.group)
    if (g) g.list.push(c)
    else groups.push({ group: c.group, list: [c] })
  }
  const ctas = items.filter((c) => c.cta)

  const [activeLabel, setActiveLabel] = useState<string | null>(null)
  const active =
    competitions.find((c) => c.label === activeLabel) ?? competitions[0]
  const activeId = active ? idOf(active) : undefined

  const teamsQ = useTournamentTeams(activeId, { enabled: armed })

  let body: React.ReactNode
  if (!active) {
    body = null
  } else if (!armed || (activeId != null && teamsQ.isPending)) {
    body = <TeamsSkeleton />
  } else if (activeId == null) {
    body = (
      <p className='px-3 py-2 text-[13px] text-muted-foreground'>
        Teams appear here once this competition has fixtures listed.
      </p>
    )
  } else if (teamsQ.isError) {
    body = (
      <div className='px-3 py-2 text-[13px] text-muted-foreground'>
        <p>Couldn&rsquo;t load the teams right now.</p>
        <button
          type='button'
          onClick={() => teamsQ.refetch()}
          className={cn(
            'mt-1 rounded-sm font-semibold text-foreground underline underline-offset-2',
            FOCUS_RING,
          )}
        >
          Try again
        </button>
      </div>
    )
  } else if (!teamsQ.data?.length) {
    body = (
      <p className='px-3 py-2 text-[13px] text-muted-foreground'>
        No upcoming fixtures listed for this competition yet.
      </p>
    )
  } else {
    body = (
      <ul className='grid max-h-[24rem] grid-cols-2 overflow-y-auto overscroll-contain'>
        {teamsQ.data.map((t) => (
          <li key={t.id} className='min-w-0'>
            <Link
              href={slugs.teamPath(t.id, t.name)}
              onClick={onNavigate}
              className={cn(POPOVER_ITEM, 'text-[13.5px] text-foreground/80')}
            >
              <span className='truncate'>{t.name}</span>
            </Link>
          </li>
        ))}
      </ul>
    )
  }

  return (
    <div className='w-[36rem] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-border bg-popover text-popover-foreground shadow-[var(--lift-3)]'>
      <div className='flex'>
        <div className='w-56 shrink-0 border-r border-border p-2'>
          {groups.map(({ group, list }) => (
            <div key={group ?? 'links'}>
              {group && <p className={GROUP_LABEL}>{group}</p>}
              <ul>
                {list.map((child) => {
                  const selected = child === active
                  return (
                    <li key={child.label} className='min-w-0'>
                      <Link
                        href={hrefOf(child)}
                        onClick={onNavigate}
                        onMouseEnter={() => setActiveLabel(child.label)}
                        onFocus={() => setActiveLabel(child.label)}
                        aria-current={selected ? 'true' : undefined}
                        className={cn(
                          POPOVER_ITEM,
                          'text-[14px]',
                          selected ? 'bg-muted text-foreground' : 'text-foreground/80',
                        )}
                      >
                        {child.star && (
                          <Star
                            aria-hidden
                            className='size-3.5 shrink-0 fill-primary text-brand-text'
                          />
                        )}
                        <span className='truncate'>{child.label}</span>
                        {child.badge && (
                          <span className='ml-auto rounded-full bg-primary px-1.5 py-px text-[9.5px] font-bold uppercase tracking-[0.12em] text-primary-foreground shadow-[inset_0_0_0_1px_var(--brand-edge)]'>
                            {child.badge}
                          </span>
                        )}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </div>

        <div className='min-w-0 flex-1 p-2' aria-live='polite'>
          {active && (
            <p className={cn(GROUP_LABEL, 'truncate')}>{active.label} teams</p>
          )}
          {body}
        </div>
      </div>

      {ctas.length > 0 && (
        <div className='flex items-center gap-1 border-t border-border bg-muted/50 px-2 py-1.5'>
          {ctas.map((cta) => (
            <Link
              key={cta.label}
              href={hrefOf(cta)}
              onClick={onNavigate}
              className={cn(
                'group/cta inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-[13.5px] font-semibold text-foreground transition-colors duration-200 hover:bg-foreground hover:text-background',
                FOCUS_RING,
                'focus-visible:-outline-offset-2',
              )}
            >
              {cta.label}
              <ArrowRight
                aria-hidden
                className='size-3.5 transition-transform duration-200 group-hover/cta:translate-x-0.5'
              />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

function TeamsSkeleton() {
  return (
    <ul aria-hidden className='grid grid-cols-2 gap-x-2'>
      {Array.from({ length: 12 }, (_, i) => (
        <li key={i} className='px-3 py-2.5'>
          <span
            className='block h-3 rounded-full bg-muted motion-safe:animate-pulse'
            style={{ width: `${55 + ((i * 17) % 40)}%` }}
          />
        </li>
      ))}
    </ul>
  )
}
