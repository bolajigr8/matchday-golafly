'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface DateOfBirthPickerProps {
  value: string // ISO 'YYYY-MM-DD' or ''
  onChange: (iso: string) => void
  /** Earliest allowed date of birth (ISO), inclusive. */
  min?: string
  /** Latest allowed date of birth (ISO), inclusive — usually today. */
  max?: string
  disabled?: boolean
  dark?: boolean
  /** 'vip': VIP Hospitality's 48px boxes (VIP colour variables, so light and
   *  dark both work) with a gold focus ring and
   *  mono caps labels (used on /vip/<match>/checkout). */
  tone?: 'default' | 'vip'
}

const MONTHS = [
  { value: 1, label: 'Jan' },
  { value: 2, label: 'Feb' },
  { value: 3, label: 'Mar' },
  { value: 4, label: 'Apr' },
  { value: 5, label: 'May' },
  { value: 6, label: 'Jun' },
  { value: 7, label: 'Jul' },
  { value: 8, label: 'Aug' },
  { value: 9, label: 'Sep' },
  { value: 10, label: 'Oct' },
  { value: 11, label: 'Nov' },
  { value: 12, label: 'Dec' },
]

function parseISO(iso: string): { y: number; m: number; d: number } | null {
  if (!iso) return null
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return null
  return { y, m, d }
}

function daysInMonth(year: number, month: number): number {
  // month is 1-indexed here
  return new Date(year, month, 0).getDate()
}

function toISO(y: number, m: number, d: number): string {
  return `${String(y).padStart(4, '0')}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

/**
 * Booking-flow date-of-birth input: three independent Day / Month / Year
 * selects instead of a calendar popover — mirrors the passport-style DOB
 * UI pattern (each field its own dropdown, no need to page through a
 * calendar grid to reach a birth year decades back).
 *
 * Same drop-in contract as `DatePicker`: `value`/`onChange` are ISO
 * 'YYYY-MM-DD' strings. Emits a new ISO value only once day, month and
 * year all have a value — an incomplete date is never emitted.
 */
export function DateOfBirthPicker({
  value,
  onChange,
  min,
  max,
  disabled = false,
  dark = false,
  tone = 'default',
}: DateOfBirthPickerProps) {
  const minParsed = parseISO(min ?? '')
  const maxParsed = parseISO(max ?? '')

  const today = new Date()
  const maxYear = maxParsed?.y ?? today.getFullYear()
  const minYear = minParsed?.y ?? maxYear - 120

  // BUG FIX: these three selects used to be driven directly off `value`
  // (parsed back into day/month/year on every render). Since the parent
  // only ever receives a new `value` once ALL THREE are picked (an
  // incomplete date is never emitted — see `commit` below), picking just
  // the day left `value` unchanged, so the Day select's derived state
  // snapped right back to the placeholder on the next render — it looked
  // like the click did nothing. Each field now keeps its own local state
  // that updates immediately on selection, independent of whether the
  // parent's `value` has changed yet. We still sync from `value` when it
  // changes from *outside* (e.g. the form resets), and still only ever
  // emit `onChange` once day, month and year are all set.
  const parsed = parseISO(value)
  const [day, setDay] = useState<number | ''>(parsed?.d ?? '')
  const [month, setMonth] = useState<number | ''>(parsed?.m ?? '')
  const [year, setYear] = useState<number | ''>(parsed?.y ?? '')

  useEffect(() => {
    const next = parseISO(value)
    setDay(next?.d ?? '')
    setMonth(next?.m ?? '')
    setYear(next?.y ?? '')
    // Only re-sync when the external value actually changes (e.g. reset
    // or prefill) — not on every local keystroke, which is handled below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  const monthDayCount =
    year && month ? daysInMonth(Number(year), Number(month)) : 31
  const days = Array.from({ length: monthDayCount }, (_, i) => i + 1)
  const years = Array.from(
    { length: maxYear - minYear + 1 },
    (_, i) => maxYear - i,
  )

  function commit(
    nextDay: number | '',
    nextMonth: number | '',
    nextYear: number | '',
  ) {
    setDay(nextDay)
    setMonth(nextMonth)
    setYear(nextYear)
    if (nextDay === '' || nextMonth === '' || nextYear === '') return
    // Clamp the day if switching to a shorter month (e.g. was 31, month
    // becomes Feb) so we never emit an invalid calendar date.
    const clampedDay = Math.min(nextDay, daysInMonth(nextYear, nextMonth))
    onChange(toISO(nextYear, nextMonth, clampedDay))
  }
  const vip = tone === 'vip'
  const selectCls = vip
    ? cn(
        'h-12 w-full cursor-pointer appearance-none rounded-xl border border-vip-line/10 bg-vip-tint/3 px-4 text-[14.5px] leading-[normal] text-vip-chalk outline-none transition-colors focus:border-vip-gold/60 focus:bg-vip-tint/5 [&>option]:bg-vip-popover [&>option]:text-vip-chalk',
        disabled && 'cursor-not-allowed opacity-50',
      )
    : cn(
        'w-full cursor-pointer appearance-none rounded-xl border px-3 py-2.5 text-[13px] font-medium outline-none transition-colors',
        'focus:border-primary focus:ring-1 focus:ring-primary/40',
        disabled && 'cursor-not-allowed opacity-50',
        dark
          ? 'border-white/10 bg-white/5 text-white [&>option]:bg-zinc-900 [&>option]:text-white'
          : 'border-border bg-muted/60 text-foreground [&>option]:bg-card [&>option]:text-foreground',
      )
  const labelCls = vip
    ? 'sr-only'
    : cn(
        'mb-1 block font-mono text-[9px] font-bold uppercase tracking-[1.5px]',
        dark ? 'text-white/40' : 'text-muted-foreground',
      )

  return (
    <div className='grid grid-cols-3 gap-2'>
      <div>
        <label className={labelCls}>Day</label>
        <select
          value={day}
          disabled={disabled}
          onChange={(e) =>
            commit(
              e.target.value ? Number(e.target.value) : '',
              month || '',
              year || '',
            )
          }
          className={selectCls}
        >
          <option value=''>Day</option>
          {days.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={labelCls}>Month</label>
        <select
          value={month}
          disabled={disabled}
          onChange={(e) =>
            commit(
              day || '',
              e.target.value ? Number(e.target.value) : '',
              year || '',
            )
          }
          className={selectCls}
        >
          <option value=''>Month</option>
          {MONTHS.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={labelCls}>Year</label>
        <select
          value={year}
          disabled={disabled}
          onChange={(e) =>
            commit(
              day || '',
              month || '',
              e.target.value ? Number(e.target.value) : '',
            )
          }
          className={selectCls}
        >
          <option value=''>Year</option>
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
