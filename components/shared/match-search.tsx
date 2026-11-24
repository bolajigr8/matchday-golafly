'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useMatchdayTeams } from '@/features/matchday/hooks'
import { pickTeam } from '@/features/matchday/resolve'
import type { MatchSearchQuery } from '@/features/matchday/use-matches-search'
import { useHydrated } from '@/hooks/use-hydrated'
import { CLUBS } from '@/features/matchday/flyers'
import { useLandingScope } from '@/features/landing/scope'
import { DatePicker } from '@/components/ui/date-picker'
import {
  SuggestionPanel,
  useSearchSuggestions,
  type SuggestionRow,
} from '@/components/shared/search-suggestions'

/* Ticket search: live suggestions + date + trending chips.

   layout="stacked"  the /matches hero card (centered, partner layout)
   layout="inline"   the home hero: one pill row on desktop, stacked fields
                     on phones, trending chips underneath

   As you type, a panel lists "Search for “…”", then matching EVENTS, TEAMS
   and TOURNAMENTS (components/shared/search-suggestions.tsx — the search
   that used to sit in the navbar). Picking an event, team or tournament
   opens its own page on its readable URL; "Search for", Enter with nothing
   highlighted, or "Find tickets" run the full search with the date
   (features/matchday/use-matches-search.ts). ArrowUp/ArrowDown move through
   the rows, Enter opens the highlighted one, Esc closes the panel.

   The date uses the same calendar as the flight search on the Extras page
   (components/ui/date-picker.tsx). */

const TRENDING = ['Arsenal', 'Chelsea', 'FC Barcelona', 'Manchester United']

function todayISO() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function MatchSearch({
  onSearch,
  layout = 'stacked',
  className,
}: {
  onSearch?: (s: MatchSearchQuery) => void
  layout?: 'stacked' | 'inline'
  className?: string
}) {
  const router = useRouter()
  const { data: teams } = useMatchdayTeams()
  const hydrated = useHydrated()
  const [q, setQ] = React.useState('')
  const [date, setDate] = React.useState('')
  const [open, setOpen] = React.useState(false)
  const [active, setActive] = React.useState(-1)
  const listId = React.useId()
  const qId = React.useId()
  const dateId = React.useId()

  const s = useSearchSuggestions(q)
  const rows = s.rows
  const showList = open && !!s.text
  const optionId = (i: number) => `${listId}-${i}`

  const close = () => {
    setOpen(false)
    setActive(-1)
  }

  /** The full search: free text + date → use-matches-search, which opens a
   *  team/competition page when the text is exactly one of them. */
  const submit = () => {
    close()
    onSearch?.({ q, date })
  }

  /** A row was clicked. The <Link> navigates for event/team/tournament
   *  rows; "Search for" runs the full search instead (keeps the date). */
  const onPick = (row: SuggestionRow) => {
    if (row.kind === 'all') submit()
    else {
      close()
      row.onSelect?.()
    }
  }

  /** A row was chosen from the keyboard. */
  const pickFromKeyboard = (row: SuggestionRow) => {
    if (row.kind === 'all') return submit()
    close()
    if (row.onSelect) return row.onSelect()
    router.push(row.href)
  }

  const scope = useLandingScope()
  const trending = scope
    ? scope.site.clubs
        .map((file) => CLUBS.find((c) => c.file === file)?.name)
        .filter((n): n is string => !!n)
        .map((name) => ({ name, team: pickTeam(scope.teams, name) }))
        // only clubs that really have a fixture in this competition
        .filter((c) => !!c.team)
        .slice(0, 4)
    : TRENDING.map((name) => ({ name, team: pickTeam(teams, name) }))
  const inline = layout === 'inline'

  const queryInput = (
    <input
      id={qId}
      type='text'
      role='combobox'
      aria-expanded={showList}
      aria-controls={listId}
      aria-autocomplete='list'
      aria-activedescendant={showList && active >= 0 && active < rows.length ? optionId(active) : undefined}
      autoComplete='off'
      enterKeyHint='search'
      value={q}
      onChange={(e) => {
        setQ(e.target.value)
        setOpen(true)
        setActive(-1)
      }}
      onFocus={() => setOpen(true)}
      onBlur={() => setTimeout(close, 120)}
      onKeyDown={(e) => {
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
          if (!rows.length) return
          e.preventDefault()
          setOpen(true)
          setActive((i) =>
            e.key === 'ArrowDown'
              ? i + 1 >= rows.length
                ? 0
                : i + 1
              : i <= 0
                ? rows.length - 1
                : i - 1,
          )
        } else if (e.key === 'Escape') {
          close()
        }
      }}
      placeholder={inline ? 'Team, match or competition' : 'Search teams, matches, venues & more…'}
      className={cn(
        'w-full text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring',
        inline
          ? 'h-12 rounded-xl bg-muted/60 pr-4 pl-11 text-[15px] focus:bg-muted sm:h-[52px] sm:rounded-full sm:bg-transparent sm:focus:bg-transparent'
          : 'h-[50px] rounded-xl border border-border bg-background pr-11 pl-4 text-[15px] focus:border-ring sm:h-[42px] sm:rounded-lg sm:text-[14px]',
      )}
    />
  )

  const suggestionList = showList && (
    <SuggestionPanel
      id={listId}
      optionId={optionId}
      s={s}
      active={active}
      onActive={setActive}
      onPick={onPick}
      className={cn(
        'absolute inset-x-0',
        // Home pill row: the text field is narrow on desktop, so the panel
        // is widened from its left edge (event details otherwise truncate).
        inline
          ? 'top-[calc(100%+10px)] sm:right-auto sm:w-[min(34rem,calc(100vw-2rem))]'
          : 'top-[calc(100%+6px)]',
      )}
    />
  )

  const dateInput = (
    <DatePicker
      id={dateId}
      value={date}
      onChange={setDate}
      min={hydrated ? todayISO() : undefined}
      placeholder='Any date'
      months={2}
      iconClassName='size-[18px]'
      triggerClassName={cn(
        'font-normal transition-colors focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring',
        inline
          ? 'h-12 gap-2.5 rounded-xl bg-muted/60 px-4 text-[15px] hover:bg-muted sm:h-[52px] sm:rounded-full sm:bg-transparent sm:hover:bg-transparent'
          : 'h-[50px] gap-2.5 rounded-xl border border-border bg-background px-4 text-[15px] hover:border-ring sm:h-[42px] sm:rounded-lg sm:text-[14px]',
      )}
    />
  )

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (showList && active >= 0 && active < rows.length) pickFromKeyboard(rows[active])
    else submit()
  }

  if (inline) {
    return (
      <form role='search' onSubmit={onSubmit} className={cn('relative w-full', className)}>
        <div className='flex flex-col gap-2 rounded-[22px] border border-border bg-card p-2 shadow-[0_28px_60px_-36px_oklch(0.18_0_0/0.55)] sm:flex-row sm:items-center sm:gap-0 sm:rounded-full sm:p-1.5'>
          <div className='relative min-w-0 flex-1'>
            <label htmlFor={qId} className='sr-only'>
              Search teams, matches or competitions
            </label>
            <Search className='pointer-events-none absolute top-1/2 left-4 size-[18px] -translate-y-1/2 text-muted-foreground' />
            {queryInput}
            {suggestionList}
          </div>
          <span aria-hidden className='hidden h-7 w-px shrink-0 bg-border sm:block' />
          <div className='relative sm:w-[188px] sm:shrink-0'>
            <label htmlFor={dateId} className='sr-only'>
              Match date
            </label>
            {dateInput}
          </div>
          <button
            type='submit'
            className='inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-[15px] font-semibold text-primary-foreground shadow-[inset_0_0_0_1px_var(--brand-edge)] transition-[transform,opacity] hover:opacity-90 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground sm:h-[52px] sm:rounded-full sm:px-7'
          >
            Find tickets
            <ArrowRight className='size-[18px]' />
          </button>
        </div>

        <div className='mt-3 -mx-1 flex items-center gap-2 overflow-x-auto p-1 scrollbar-hide'>
          <span className='shrink-0 font-mono text-[11px] tracking-[0.18em] text-muted-foreground uppercase'>
            Trending
          </span>
          {trending.map(({ name, team }) => (
            <button
              key={name}
              type='button'
              onClick={() => {
                setQ(name)
                onSearch?.({ q: name, date, teamId: team?.team_id })
              }}
              className='shrink-0 rounded-full border border-border bg-card px-3.5 py-1.5 text-[13px] text-foreground transition-colors hover:border-foreground/40 hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground'
            >
              {name}
            </button>
          ))}
        </div>
      </form>
    )
  }

  return (
    <form
      role='search'
      onSubmit={onSubmit}
      className={cn(
        'relative mt-6 w-full max-w-[740px] rounded-[22px] border border-border bg-card p-5 text-left shadow-[0_20px_50px_-28px_rgba(0,0,0,0.45)] sm:px-14 sm:pt-7 sm:pb-6',
        className,
      )}
    >
      <p className='mb-4 text-center text-[13px] text-foreground sm:text-[14.5px]'>
        <b className='font-semibold'>Secure your seats:</b>{' '}
        <span className='text-muted-foreground'>verified tickets, plus flights, hotel &amp; eSIM in one checkout</span>
      </p>

      <div className='grid gap-3 sm:grid-cols-[minmax(0,1fr)_220px_52px]'>
        <div className='relative'>
          <label htmlFor={qId} className='sr-only'>
            Search teams, matches, venues
          </label>
          {queryInput}
          <Search className='pointer-events-none absolute top-1/2 right-3.5 size-[18px] -translate-y-1/2 text-muted-foreground' />
          {suggestionList}
        </div>

        <div className='relative'>
          <label htmlFor={dateId} className='sr-only'>
            Match date
          </label>
          {dateInput}
        </div>

        <button
          type='submit'
          aria-label='Search tickets'
          className='flex h-[50px] items-center justify-center gap-2 rounded-xl bg-primary px-5 text-[15px] font-semibold text-primary-foreground shadow-[0_0_14px_var(--brand-glow)] transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:h-[42px] sm:rounded-lg sm:px-0'
        >
          <span className='sm:sr-only'>Search tickets</span>
          <ArrowRight className='size-5' />
        </button>
      </div>

      <div className='mt-3 -mx-1 flex items-center gap-2 overflow-x-auto p-1 scrollbar-hide sm:justify-center'>
        <span className='shrink-0 text-[13px] font-semibold text-foreground'>Trending now:</span>
        {trending.map(({ name, team }) => (
          <button
            key={name}
            type='button'
            onClick={() => {
              setQ(name)
              onSearch?.({ q: name, date, teamId: team?.team_id })
            }}
            className='shrink-0 rounded-md border border-border bg-background px-3 py-1 text-[12.5px] text-foreground transition-colors hover:border-primary hover:bg-primary/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'
          >
            {name}
          </button>
        ))}
      </div>
    </form>
  )
}
