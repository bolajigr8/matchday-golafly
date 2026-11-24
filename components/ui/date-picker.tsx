'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
} from 'lucide-react'
import { useHydrated } from '@/hooks/use-hydrated'
import { cn } from '@/lib/utils'
import { isValidISODate } from '@/lib/date'

interface DatePickerProps {
  value: string // ISO 'YYYY-MM-DD' or ''
  onChange: (iso: string) => void
  min?: string
  max?: string
  placeholder?: string
  dark?: boolean
  disabled?: boolean
  /**
   * How many months to show side by side. Defaults to 1, so every existing
   * call site keeps the panel it had. Two months collapses back to one on a
   * narrow viewport — see `effectiveMonths` below.
   */
  months?: 1 | 2
  /**
   * Month the calendar opens on while nothing is selected (ISO date). For a
   * date of birth, where opening on today means paging back through decades.
   */
  defaultMonth?: string
  /** id for the trigger button, so a <label htmlFor> can point at it. */
  id?: string
  /** Extra classes for the trigger button and its calendar icon — lets a
   *  search bar size the trigger like its other fields. Optional: every
   *  existing call site keeps the compact trigger it had. */
  triggerClassName?: string
  iconClassName?: string
  /** Accessible name when there is no visible label. */
  ariaLabel?: string
  /** 'vip': the same calendar in VIP Hospitality's gold, light or dark (used on
   *  /vip/<match>/extras). Default keeps the site look. */
  tone?: 'default' | 'vip'
}

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]
const MONTH_SHORT = MONTH_NAMES.map((m) => m.slice(0, 3))
const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

/** One month grid, and the paddings/gap the panel adds around them. */
const MONTH_WIDTH = 256
const PANEL_GAP = 16
const PANEL_PADDING = 24

function popoverWidth(months: number): number {
  return months * MONTH_WIDTH + (months - 1) * PANEL_GAP + PANEL_PADDING
}

/**
 * Below this, two months side by side do not fit and would be clamped
 * against the viewport edge. One month is the honest answer on a phone.
 */
const TWO_MONTH_MIN_VIEWPORT = 640

const POPOVER_EST_HEIGHT = 360

function parseISO(iso: string): Date | null {
  if (!isValidISODate(iso)) return null
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}
function toISO(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
function fmtDisplay(d: Date): string {
  return `${MONTH_SHORT[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`
}
function isBeforeDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() < b.getFullYear() ||
    (a.getFullYear() === b.getFullYear() &&
      (a.getMonth() < b.getMonth() ||
        (a.getMonth() === b.getMonth() && a.getDate() < b.getDate())))
  )
}
function isAfterDay(a: Date, b: Date): boolean {
  return isBeforeDay(b, a)
}
function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}
/** Months since year 0, so two months can be compared as one number. */
function monthIndex(d: Date): number {
  return d.getFullYear() * 12 + d.getMonth()
}
function addMonths(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + n, 1)
}

type View = 'days' | 'months' | 'years'

/**
 * Drop-in replacement for `<input type="date">`.
 * Same contract: `value` is an ISO 'YYYY-MM-DD' string (or ''),
 * `onChange` receives the new ISO string. `min` disables earlier days,
 * `max` disables later days (both optional, both inclusive).
 *
 * The popover is rendered through a portal into `document.body` and
 * positioned with `position: fixed` from the trigger's real bounding
 * box. This is the fix for the "calendar gets covered by other UI"
 * bug — an absolutely-positioned popover can be clipped or out-painted
 * by any sibling/ancestor that establishes its own stacking context
 * (grid cells, `backdrop-blur`, `sticky` sidebars, etc). Portaling to
 * body removes it from that DOM subtree entirely, so no ancestor's
 * stacking context can ever cover it again.
 */
export function DatePicker({
  value,
  onChange,
  min,
  max,
  placeholder = 'date',
  dark = false,
  disabled = false,
  months = 1,
  defaultMonth,
  id,
  triggerClassName,
  iconClassName,
  ariaLabel,
  tone = 'default',
}: DatePickerProps) {
  const vip = tone === 'vip'
  const selected = parseISO(value)
  const minDate = parseISO(min ?? '')
  const maxDate = parseISO(max ?? '')
  const opensOn = parseISO(defaultMonth ?? '')
  const [open, setOpen] = useState(false)
  const [view, setView] = useState<View>('days')
  const [cursor, setCursor] = useState<Date>(selected ?? opensOn ?? minDate ?? new Date())
  const [decadeStart, setDecadeStart] = useState<number>(
    Math.floor((selected ?? opensOn ?? minDate ?? new Date()).getFullYear() / 12) * 12,
  )
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(
    null,
  )
  /**
   * Resolved against the real viewport rather than a media query, because the
   * panel is portaled to <body> and positioned in pixels — the width has to
   * be a number before it can be clamped. Safe to measure here: the popover
   * only renders once `coords` is set, which already happens client-side.
   */
  const [effectiveMonths, setEffectiveMonths] = useState<1 | 2>(1)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)

  const mounted = useHydrated()

  function computePosition() {
    const rect = triggerRef.current?.getBoundingClientRect()
    if (!rect) return
    const visibleMonths: 1 | 2 =
      months === 2 && window.innerWidth >= TWO_MONTH_MIN_VIEWPORT ? 2 : 1
    setEffectiveMonths(visibleMonths)

    const width = popoverWidth(visibleMonths)
    let left = rect.left
    let top = rect.bottom + 8
    if (left + width > window.innerWidth - 8) {
      left = Math.max(8, window.innerWidth - width - 8)
    }
    if (top + POPOVER_EST_HEIGHT > window.innerHeight - 8) {
      // not enough room below — flip above the trigger
      top = Math.max(8, rect.top - POPOVER_EST_HEIGHT - 8)
    }
    setCoords({ top, left })
  }

  useLayoutEffect(() => {
    if (!open) return
    computePosition()
    function onScrollOrResize() {
      computePosition()
    }
    window.addEventListener('scroll', onScrollOrResize, true)
    window.addEventListener('resize', onScrollOrResize)
    return () => {
      window.removeEventListener('scroll', onScrollOrResize, true)
      window.removeEventListener('resize', onScrollOrResize)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, months])

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      const target = e.target as Node
      if (
        triggerRef.current &&
        !triggerRef.current.contains(target) &&
        popoverRef.current &&
        !popoverRef.current.contains(target)
      ) {
        setOpen(false)
        setView('days')
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  useEffect(() => {
    if (open) {
      const base = selected ?? opensOn ?? minDate ?? new Date()
      setCursor(base)
      setDecadeStart(Math.floor(base.getFullYear() / 12) * 12)
      setView('days')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  function disabledDay(d: Date): boolean {
    if (minDate && isBeforeDay(d, minDate) && !isSameDay(d, minDate)) {
      return true
    }
    if (maxDate && isAfterDay(d, maxDate) && !isSameDay(d, maxDate)) {
      return true
    }
    return false
  }

  function selectDay(d: Date) {
    if (disabledDay(d)) return
    onChange(toISO(d))
    setOpen(false)
    setView('days')
  }

  function gridDays(month: Date): { date: Date; inMonth: boolean }[] {
    const year = month.getFullYear()
    const m = month.getMonth()
    const first = new Date(year, m, 1)
    const startOffset = first.getDay()
    const cells: { date: Date; inMonth: boolean }[] = []
    for (let i = 0; i < 42; i++) {
      const d = new Date(year, m, 1 - startOffset + i)
      cells.push({ date: d, inMonth: d.getMonth() === m })
    }
    return cells
  }

  /* Stepping is always one month, even with two panels on screen: jumping
     two at a time skips the pairing someone just looked at. */
  const visibleMonths = Array.from({ length: effectiveMonths }, (_, i) =>
    addMonths(cursor, i),
  )
  /* Nothing selectable to the left/right means the arrow only ever produces
     an empty grid, which reads as the picker being broken. */
  const canGoPrev =
    !minDate || monthIndex(visibleMonths[0]) > monthIndex(minDate)
  const canGoNext =
    !maxDate ||
    monthIndex(visibleMonths[visibleMonths.length - 1]) < monthIndex(maxDate)

  // `dark` describes the FIELD's backdrop (it can sit on a hero photo), not
  // the site theme. The calendar panel floats above the page, so it always
  // uses popover tokens — styling it dark because the field sits on a photo
  // is what made it render black in light mode. (matchday doesn't define
  // `on-media`/`brand-ink` outside the fan-dashboard scope, so the dark
  // field variant uses plain white/opacity instead of those tokens.)
  const s = vip
    ? {
        field: 'text-vip-chalk',
        placeholderColor: 'text-[#7c857a]',
        icon: 'text-vip-mist',
        popover: 'border-vip-gold/35 bg-vip-popover text-vip-chalk shadow-[0_16px_40px_rgba(0,0,0,0.18)] dark:shadow-[0_16px_40px_rgba(0,0,0,0.6)]',
        cellHover: 'hover:bg-vip-gold/10',
        muted: 'text-vip-mist/70',
        chip: 'hover:bg-vip-line/5 text-vip-mist',
        divider: 'border-vip-line/10',
      }
    : {
        field: dark ? 'text-white' : 'text-foreground',
        placeholderColor: dark ? 'text-white/70' : 'text-muted-foreground',
        icon: dark ? 'text-white/60' : 'text-muted-foreground',
        popover: 'border-border bg-popover text-popover-foreground shadow-xl',
        cellHover: 'hover:bg-accent',
        muted: 'text-muted-foreground/50',
        chip: 'hover:bg-muted text-muted-foreground',
        divider: 'border-border',
      }
  /* Selected day / month / year, today's ring, label hover and the
     "Today" link: brand green on the site, gold on VIP. */
  const picked = vip
    ? 'bg-linear-to-r from-vip-gold-light to-vip-gold text-[#111111] shadow-[0_0_10px_rgba(212,178,106,0.45)]'
    : 'bg-primary text-primary-foreground shadow-[0_0_10px_var(--brand-glow)]'
  const todayRing = vip ? 'ring-1 ring-vip-gold/50' : 'ring-1 ring-primary/50'
  const labelHover = vip ? 'hover:bg-vip-gold/10' : 'hover:bg-primary/10'
  const accentText = vip ? 'text-vip-gold-text' : 'text-primary'

  const navButton = cn('grid size-7 place-items-center rounded-full', s.chip)

  const popoverContent = open && coords && (
    <div
      ref={popoverRef}
      style={{
        position: 'fixed',
        top: coords.top,
        left: coords.left,
        width: popoverWidth(effectiveMonths),
      }}
      className={cn('z-[9999] rounded-2xl border p-3', s.popover)}
    >
      {view === 'days' && (
        <div className='flex' style={{ gap: PANEL_GAP }}>
          {visibleMonths.map((month, panel) => {
            const isFirst = panel === 0
            const isLast = panel === visibleMonths.length - 1
            return (
              <div key={monthIndex(month)} style={{ width: MONTH_WIDTH }}>
                <div className='mb-2 flex items-center justify-between'>
                  {isFirst ? (
                    <button
                      type='button'
                      disabled={!canGoPrev}
                      onClick={() => setCursor(addMonths(cursor, -1))}
                      className={cn(
                        navButton,
                        !canGoPrev && 'cursor-not-allowed opacity-30',
                      )}
                      aria-label='Previous month'
                    >
                      <ChevronLeft className='size-3.5' />
                    </button>
                  ) : (
                    /* Keeps the label optically centred over its own grid
                       rather than shifting left on the second panel. */
                    <span aria-hidden className='size-7' />
                  )}
                  <button
                    type='button'
                    onClick={() => {
                      setCursor(month)
                      setView('months')
                    }}
                    className={cn('rounded-lg px-2 py-1 font-mono text-[12px] font-bold', labelHover)}
                  >
                    {MONTH_NAMES[month.getMonth()]} {month.getFullYear()}
                  </button>
                  {isLast ? (
                    <button
                      type='button'
                      disabled={!canGoNext}
                      onClick={() => setCursor(addMonths(cursor, 1))}
                      className={cn(
                        navButton,
                        !canGoNext && 'cursor-not-allowed opacity-30',
                      )}
                      aria-label='Next month'
                    >
                      <ChevronRight className='size-3.5' />
                    </button>
                  ) : (
                    <span aria-hidden className='size-7' />
                  )}
                </div>
                <div className='grid grid-cols-7 gap-1 pb-1'>
                  {WEEKDAYS.map((w) => (
                    <div
                      key={w}
                      className={cn(
                        'grid h-6 place-items-center font-mono text-[9px]',
                        s.muted,
                      )}
                    >
                      {w}
                    </div>
                  ))}
                </div>
                <div className='grid grid-cols-7 gap-1'>
                  {gridDays(month).map(({ date, inMonth }, i) => {
                    const isSel = selected && isSameDay(date, selected)
                    const isToday = isSameDay(date, new Date())
                    const isDisabled = disabledDay(date)
                    return (
                      <button
                        key={i}
                        type='button'
                        disabled={isDisabled}
                        onClick={() => selectDay(date)}
                        className={cn(
                          'grid h-7 place-items-center rounded-full font-mono text-[11px] transition-colors',
                          !inMonth && 'opacity-30',
                          isDisabled && 'cursor-not-allowed opacity-20',
                          !isDisabled && !isSel && s.cellHover,
                          isSel && cn('font-bold', picked),
                          !isSel && isToday && todayRing,
                        )}
                      >
                        {date.getDate()}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* The month and year pickers stay one panel wide and centred: stretched
          across two months' worth of width they read as a different control. */}
      {view === 'months' && (
        <div className='mx-auto' style={{ maxWidth: MONTH_WIDTH }}>
          <div className='mb-2 flex items-center justify-between'>
            <button
              type='button'
              onClick={() =>
                setCursor(
                  new Date(cursor.getFullYear() - 1, cursor.getMonth(), 1),
                )
              }
              className={navButton}
            >
              <ChevronLeft className='size-3.5' />
            </button>
            <button
              type='button'
              onClick={() => setView('years')}
              className={cn('rounded-lg px-2 py-1 font-mono text-[12px] font-bold', labelHover)}
            >
              {cursor.getFullYear()}
            </button>
            <button
              type='button'
              onClick={() =>
                setCursor(
                  new Date(cursor.getFullYear() + 1, cursor.getMonth(), 1),
                )
              }
              className={navButton}
            >
              <ChevronRight className='size-3.5' />
            </button>
          </div>
          <div className='grid grid-cols-3 gap-1.5'>
            {MONTH_SHORT.map((m, i) => {
              const isSel =
                selected &&
                selected.getFullYear() === cursor.getFullYear() &&
                selected.getMonth() === i
              return (
                <button
                  key={m}
                  type='button'
                  onClick={() => {
                    setCursor(new Date(cursor.getFullYear(), i, 1))
                    setView('days')
                  }}
                  className={cn(
                    'rounded-lg py-2 font-mono text-[11px] font-bold transition-colors',
                    isSel
                      ? picked
                      : s.cellHover,
                  )}
                >
                  {m}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {view === 'years' && (
        <div className='mx-auto' style={{ maxWidth: MONTH_WIDTH }}>
          <div className='mb-2 flex items-center justify-between'>
            <button
              type='button'
              onClick={() => setDecadeStart((d) => d - 12)}
              className={navButton}
            >
              <ChevronLeft className='size-3.5' />
            </button>
            <span className='font-mono text-[12px] font-bold'>
              {decadeStart} – {decadeStart + 11}
            </span>
            <button
              type='button'
              onClick={() => setDecadeStart((d) => d + 12)}
              className={navButton}
            >
              <ChevronRight className='size-3.5' />
            </button>
          </div>
          <div className='grid grid-cols-3 gap-1.5'>
            {Array.from({ length: 12 }, (_, i) => decadeStart + i).map((y) => {
              const isSel = selected && selected.getFullYear() === y
              return (
                <button
                  key={y}
                  type='button'
                  onClick={() => {
                    setCursor(new Date(y, cursor.getMonth(), 1))
                    setView('months')
                  }}
                  className={cn(
                    'rounded-lg py-2 font-mono text-[11px] font-bold transition-colors',
                    isSel
                      ? picked
                      : s.cellHover,
                  )}
                >
                  {y}
                </button>
              )
            })}
          </div>
        </div>
      )}

      <div
        className={cn(
          'mt-2 flex items-center justify-between border-t pt-2',
          s.divider,
        )}
      >
        <button
          type='button'
          onClick={() => selectDay(new Date())}
          className={cn('font-mono text-[10px] font-bold hover:underline', accentText)}
        >
          Today
        </button>
        {selected && (
          <button
            type='button'
            onClick={() => {
              onChange('')
              setOpen(false)
            }}
            className={cn('font-mono text-[10px]', s.muted)}
          >
            Clear
          </button>
        )}
      </div>
    </div>
  )

  return (
    <div className='relative w-full'>
      <button
        ref={triggerRef}
        id={id}
        type='button'
        disabled={disabled}
        aria-label={ariaLabel}
        aria-haspopup='dialog'
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'flex w-full items-center gap-1.5 bg-transparent text-left text-[13px] font-medium outline-none disabled:cursor-not-allowed disabled:opacity-50',
          s.field,
          triggerClassName,
        )}
      >
        <CalendarIcon className={cn('size-3.5 shrink-0', s.icon, iconClassName)} />
        <span className={cn('truncate', !selected && s.placeholderColor)}>
          {selected ? fmtDisplay(selected) : placeholder}
        </span>
      </button>

      {mounted && popoverContent && createPortal(popoverContent, document.body)}
    </div>
  )
}
