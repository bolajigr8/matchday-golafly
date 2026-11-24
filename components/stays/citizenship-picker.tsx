'use client'

import { useEffect, useId, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import {
  AlertCircle,
  Check,
  ChevronDown,
  Info,
  Loader2,
  RefreshCcw,
  Search,
  UserRound,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { Flag } from '@/components/ui/flag'
import { hasFlag } from '@/components/ui/flag-codes'
import { useStaysStore } from '@/store/stays'
import {
  countryName,
  foldForSearch,
  guessResidencyFromBrowser,
  normalizeResidency,
  useStayCountries,
} from '@/features/stays/residency'

export const CITIZENSHIP_LABEL = 'Citizenship of the main guest'
/** For tight field labels (search strips, hero row). Still names the main guest. */
export const CITIZENSHIP_SHORT_LABEL = "Main guest's citizenship"
/** Shown wherever the selector is: written to the guest, in plain words. */
export const CITIZENSHIP_HINT =
  'Prices can depend on nationality. Choose the passport of the person checking in.'

interface CitizenshipPickerProps {
  /**
   * 'field': a labelled box that sits in a search form, next to Guests.
   * 'strip': the same, drawn exactly like a search-band StripField.
   * 'inline': a compact pill for a summary bar (results header, hotel page).
   */
  variant?: 'field' | 'strip' | 'inline'
  /** Field label (field/strip). Defaults to the full label. */
  label?: string
  /** The field sits on a hero photo (homepage). The panel never does. */
  dark?: boolean
  /** `errors.residency[0]` from a 422, shown under the control. */
  error?: string | null
  /** Called after the guest picks a different citizenship. */
  onChanged?: (code: string) => void
  align?: 'start' | 'end'
  /** Open the panel above the control (e.g. inside a bottom sheet). */
  side?: 'bottom' | 'top'
  /**
   * Pre-select a visible default (the browser's region) for a guest who never
   * picked. Defaults to on for 'field' (search forms). Keep it off wherever a
   * change re-runs a search, so nothing changes without the guest asking.
   */
  preselect?: boolean
  className?: string
}

/**
 * The hotel search's "Citizenship" selector (ETG requirement, see
 * features/stays/residency.ts). Reads and writes the stays store directly, so
 * the one value carries from the search form to results, hotel page and cart.
 * Only codes from GET /stays/countries are offered, in the backend's order.
 */
export function CitizenshipPicker({
  variant = 'field',
  dark = false,
  error,
  onChanged,
  align = 'start',
  side = 'bottom',
  preselect,
  label = CITIZENSHIP_LABEL,
  className,
}: CitizenshipPickerProps) {
  const residency = useStaysStore((s) => s.searchParams.residency)
  const confirmed = useStaysStore((s) => s.residencyConfirmed)
  const hasHydrated = useStaysStore((s) => s.hasHydrated)
  const setResidency = useStaysStore((s) => s.setResidency)
  const { data: countries, isLoading, isError, refetch } = useStayCountries()

  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const rootRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const listId = useId()
  const errorId = useId()

  // A visible pre-selection for a guest who never picked: the browser's
  // region if the backend offers it. Only in search forms: on results or the
  // hotel page a silent change would re-run a search the guest didn't ask for.
  const shouldPreselect = preselect ?? variant !== 'inline'
  const preselectedRef = useRef(false)
  useEffect(() => {
    if (!shouldPreselect || preselectedRef.current) return
    if (!hasHydrated || !countries?.length || confirmed) return
    preselectedRef.current = true
    const known = countries.some((c) => c.code === residency)
    const guess = guessResidencyFromBrowser(countries)
    if (guess && guess !== residency) setResidency(guess, { auto: true })
    else if (!known) setResidency(countries[0].code, { auto: true })
  }, [shouldPreselect, hasHydrated, countries, confirmed, residency, setResidency])

  const name = countryName(countries, residency)
  const code = normalizeResidency(residency).toUpperCase()

  const results = useMemo(() => {
    const list = countries ?? []
    const q = foldForSearch(query)
    if (!q) return list
    return list.filter(
      (c) => foldForSearch(c.name).includes(q) || c.code === q,
    )
  }, [countries, query])

  // Close on outside click.
  useEffect(() => {
    if (!open) return
    function onDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  // Opening starts a fresh search on the current country.
  function toggle() {
    if (!open) {
      setQuery('')
      const idx = (countries ?? []).findIndex((c) => c.code === residency)
      setActive(Math.max(0, idx))
    }
    setOpen((o) => !o)
  }

  // On open: focus the search box.
  useEffect(() => {
    if (!open) return
    const t = setTimeout(() => inputRef.current?.focus(), 30)
    return () => clearTimeout(t)
  }, [open])

  // Keep the highlighted row in view.
  useEffect(() => {
    if (!open) return
    const el = listRef.current?.querySelector<HTMLElement>(
      `[data-index="${active}"]`,
    )
    el?.scrollIntoView({ block: 'nearest' })
  }, [active, open])

  function choose(next: string) {
    const changed = normalizeResidency(next) !== residency
    setResidency(next)
    setOpen(false)
    if (changed) onChanged?.(normalizeResidency(next))
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      e.preventDefault()
      setOpen(false)
      return
    }
    if (!results.length) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((i) => Math.min(results.length - 1, i + 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((i) => Math.max(0, i - 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const pick = results[Math.min(active, results.length - 1)]
      if (pick) choose(pick.code)
    }
  }

  // Until the country list arrives we don't know the name for the code, so
  // show a clear loading state rather than a bare code next to "Loading".
  const loadingName = !name && isLoading
  const display = name ?? (isLoading ? 'Loading countries…' : code || 'Select')
  const valueText = (extra: string) =>
    loadingName ? (
      <span className={cn('inline-flex items-center gap-1.5 font-normal', extra)}>
        <Loader2 className='size-3.5 shrink-0 animate-spin' />
        Loading countries…
      </span>
    ) : (
      display
    )

  const trigger =
    variant === 'strip' ? (
      <button
        type='button'
        onClick={toggle}
        aria-haspopup='listbox'
        aria-expanded={open}
        aria-describedby={error ? errorId : undefined}
        className={cn(
          'flex h-full w-full min-w-0 flex-col justify-center rounded-xl border border-border bg-muted px-3.5 py-2 text-left transition-colors hover:border-primary/50',
          open && 'border-brand-text',
          error && 'border-destructive',
        )}
      >
        <span className='font-mono text-[9px] uppercase tracking-[0.1em] text-muted-foreground'>
          {label}
        </span>
        <span className='flex min-w-0 items-center gap-2'>
          {!loadingName && <CodeBadge code={code} />}
          <span className='min-w-0 flex-1 truncate text-[13px] font-semibold text-foreground'>
            {valueText('text-muted-foreground')}
          </span>
          <ChevronDown
            className={cn(
              'size-3.5 shrink-0 text-muted-foreground transition-transform',
              open && 'rotate-180',
            )}
          />
        </span>
      </button>
    ) : variant === 'field' ? (
      <button
        type='button'
        onClick={toggle}
        aria-haspopup='listbox'
        aria-expanded={open}
        aria-describedby={error ? errorId : undefined}
        className={cn(
          'flex h-full w-full min-w-0 flex-col justify-center rounded-xl border px-4 text-left transition-colors',
          dark ? 'py-3' : 'py-2.5',
          dark
            ? 'border-white/10 bg-white/5 hover:border-white/25'
            : 'border-border bg-background/60 hover:border-brand-text/40',
          open && (dark ? 'border-white/30' : 'border-brand-text/60'),
          error && 'border-destructive',
        )}
      >
        <span
          className={cn(
            'flex items-center gap-1 font-mono text-[9px] uppercase tracking-[1.5px]',
            dark ? 'text-white/40' : 'text-muted-foreground',
          )}
        >
          <UserRound className='size-2.5' /> {label}
        </span>
        <span className='mt-0.5 flex min-w-0 items-center gap-2'>
          {!loadingName && <CodeBadge code={code} dark={dark} />}
          <span
            className={cn(
              'min-w-0 flex-1 truncate text-[13px] font-medium',
              dark ? 'text-white' : 'text-foreground',
            )}
          >
            {valueText(dark ? 'text-white/60' : 'text-muted-foreground')}
          </span>
          <ChevronDown
            className={cn(
              'size-3.5 shrink-0 transition-transform',
              dark ? 'text-white/50' : 'text-muted-foreground',
              open && 'rotate-180',
            )}
          />
        </span>
      </button>
    ) : (
      <button
        type='button'
        onClick={toggle}
        aria-haspopup='listbox'
        aria-expanded={open}
        aria-label={`${CITIZENSHIP_LABEL}: ${display}. Change`}
        className={cn(
          'inline-flex max-w-full items-center gap-1.5 rounded-full border px-3 py-1 text-left transition-colors',
          'border-border bg-card hover:border-brand-text/40',
          open && 'border-brand-text/60',
          error && 'border-destructive',
        )}
      >
        <UserRound className='size-3.5 shrink-0 text-brand-text' />
        <span className='font-mono text-[10px] uppercase tracking-wider text-muted-foreground'>
          Citizenship
        </span>
        {!loadingName && <CodeBadge code={code} />}
        <span className='min-w-0 truncate text-[12px] font-semibold text-foreground'>
          {valueText('text-muted-foreground')}
        </span>
        <ChevronDown
          className={cn(
            'size-3 shrink-0 text-muted-foreground transition-transform',
            open && 'rotate-180',
          )}
        />
      </button>
    )

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      {trigger}

      {error && (
        <p
          id={errorId}
          role='alert'
          className='mt-1.5 flex items-center gap-1.5 font-mono text-[11px] text-destructive'
        >
          <AlertCircle className='size-3.5 shrink-0' /> {error}
        </p>
      )}

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: side === 'top' ? 4 : -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: side === 'top' ? 4 : -4 }}
            transition={{ duration: 0.15 }}
            className={cn(
              'absolute z-[60] w-[min(22rem,calc(100vw-2.5rem))] overflow-hidden rounded-2xl border border-border bg-popover text-popover-foreground shadow-2xl',
              side === 'top' ? 'bottom-full mb-2' : 'top-full mt-2',
              align === 'end' ? 'right-0' : 'left-0',
            )}
            onKeyDown={onKeyDown}
          >
            <div className='border-b border-border p-3'>
              <p className='text-[13px] font-bold'>{CITIZENSHIP_LABEL}</p>
              <p className='mt-0.5 flex items-start gap-1.5 text-[11px] leading-snug text-muted-foreground'>
                <Info className='mt-px size-3 shrink-0' />
                {CITIZENSHIP_HINT}
              </p>
              <label className='mt-3 flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 focus-within:border-brand-text/60'>
                <Search className='size-3.5 shrink-0 text-muted-foreground' />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value)
                    setActive(0)
                  }}
                  placeholder='Search country'
                  aria-label='Search country'
                  aria-controls={listId}
                  aria-activedescendant={
                    results[active] ? `${listId}-${results[active].code}` : undefined
                  }
                  className='w-full bg-transparent text-[13px] text-foreground outline-none placeholder:text-muted-foreground/60'
                />
              </label>
            </div>

            {isLoading ? (
              <div className='flex items-center justify-center gap-2 py-8 font-mono text-[11px] text-muted-foreground'>
                <Loader2 className='size-3.5 animate-spin' /> Loading countries…
              </div>
            ) : isError && !countries?.length ? (
              <div className='px-4 py-6 text-center'>
                <p className='text-[12px] text-muted-foreground'>
                  We couldn&apos;t load the list of countries.
                </p>
                <button
                  type='button'
                  onClick={() => void refetch()}
                  className='mx-auto mt-3 flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 font-mono text-[11px] font-bold text-primary-foreground'
                >
                  <RefreshCcw className='size-3' /> Try again
                </button>
              </div>
            ) : results.length === 0 ? (
              <p className='px-4 py-6 text-center text-[12px] text-muted-foreground'>
                No country matches “{query}”.
              </p>
            ) : (
              <ul
                ref={listRef}
                id={listId}
                role='listbox'
                aria-label={CITIZENSHIP_LABEL}
                className='max-h-[min(18rem,50vh)] overflow-y-auto overscroll-contain p-1.5'
              >
                {results.map((c, i) => {
                  const selected = c.code === residency
                  return (
                    <li
                      key={c.code}
                      id={`${listId}-${c.code}`}
                      data-index={i}
                      role='option'
                      aria-selected={selected}
                      onMouseEnter={() => setActive(i)}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => choose(c.code)}
                      className={cn(
                        'flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px]',
                        i === active && 'bg-muted/70',
                        selected && 'font-semibold text-brand-text',
                      )}
                    >
                      <CodeBadge code={c.code.toUpperCase()} lazy />
                      <span className='min-w-0 flex-1 truncate'>{c.name}</span>
                      {selected && <Check className='size-3.5 shrink-0' strokeWidth={3} />}
                    </li>
                  )
                })}
              </ul>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/** The country's flag, or its two-letter code when we ship no flag for it. */
function CodeBadge({
  code,
  dark,
  lazy,
}: {
  code: string
  dark?: boolean
  lazy?: boolean
}) {
  if (!code) return null
  if (hasFlag(code)) {
    return (
      <Flag
        code={code}
        lazy={lazy}
        className='h-[15px] w-5 rounded-[3px] align-middle shadow-[0_0_0_1px_rgb(0_0_0/0.12)]'
      />
    )
  }
  return (
    <span
      aria-hidden
      className={cn(
        'grid h-5 w-7 shrink-0 place-items-center rounded-md font-mono text-[9px] font-bold tracking-wider',
        dark ? 'bg-white/10 text-white/80' : 'bg-primary/10 text-brand-text',
      )}
    >
      {code}
    </span>
  )
}

/**
 * Read-only citizenship line for the booking steps after search (guest
 * details, summaries). Not editable there: the price is tied to the search,
 * so the link goes back to change the search instead.
 */
export function CitizenshipSummary({
  changeHref = '/stays/search',
  className,
}: {
  changeHref?: string
  className?: string
}) {
  const residency = useStaysStore((s) => s.searchParams.residency)
  const { data: countries } = useStayCountries()
  const name =
    countryName(countries, residency) ?? normalizeResidency(residency).toUpperCase()

  return (
    <div className={cn('flex items-start justify-between gap-3', className)}>
      <div className='min-w-0'>
        <p className='font-mono text-[9px] uppercase tracking-wider text-muted-foreground'>
          {CITIZENSHIP_LABEL}
        </p>
        <p className='mt-0.5 text-[12px] font-medium text-foreground'>{name}</p>
      </div>
      <Link
        href={changeHref}
        className='shrink-0 font-mono text-[10px] font-bold text-brand-text hover:underline'
      >
        Change search
      </Link>
    </div>
  )
}
