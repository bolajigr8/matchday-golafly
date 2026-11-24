'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import type { MetapolicyStruct, MetapolicyPriceItem } from '@/features/stays/types'

interface Props {
  metapolicy: MetapolicyStruct | null | undefined
  extraInfo: string | null | undefined
}

const COLLAPSED_COUNT = 6

const CATEGORY_LABELS: Record<string, string> = {
  cot: 'Cot',
  meal: 'Meals',
  pets: 'Pets',
  visa: 'Visa support',
  add_fee: 'Additional fees',
  deposit: 'Deposit',
  no_show: 'No-show policy',
  parking: 'Parking',
  shuttle: 'Shuttle',
  children: 'Extra bed for children',
  internet: 'Internet / WiFi',
  extra_bed: 'Extra bed',
  children_meal: "Children's meals",
  check_in_check_out: 'Early / late check-in & check-out',
}

function humanize(value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim()) return null
  if (value === 'unspecified') return null
  return value
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

function sym(code?: string | null): string {
  if (!code) return ''
  const M: Record<string, string> = {
    EUR: '€',
    USD: '$',
    GBP: '£',
    JPY: '¥',
    CHF: 'CHF ',
    AED: 'AED ',
    SAR: 'SAR ',
    AUD: 'A$',
    CAD: 'C$',
  }
  return M[code] ?? `${code} `
}

/** Formats a price/currency pair defensively. `currency` has been
 * observed null on real responses even when `price` is set — in that
 * case, show the number with no currency symbol rather than guessing
 * one or crashing. `price` arrives as a string ("3.00"), not a number. */
function formatPrice(item: MetapolicyPriceItem): string | null {
  const raw = item.price
  if (raw === null || raw === undefined || raw === '') return null
  const n = Number(raw)
  if (!Number.isFinite(n)) return null
  if (item.inclusion === 'included' || n === 0) {
    return item.inclusion === 'not_included' ? null : 'Included'
  }
  const amount = n.toFixed(2)
  return item.currency ? `${sym(item.currency)}${amount}` : amount
}

function formatUnit(unit?: string | null): string {
  const h = humanize(unit)
  if (!h) return ''
  return ` / ${h.toLowerCase().replace(/^per /, 'per ')}`
}

/** Builds one readable line for a single line-item, combining whatever
 * fields are actually present. Never assumes a field exists — every
 * category has a different set, and any of them can be missing. */
function describeItem(
  category: string,
  item: Record<string, unknown>,
): string | null {
  const priceLabel = formatPrice(item as MetapolicyPriceItem)
  const unitLabel = formatUnit(item.price_unit as string | undefined)

  const typeField =
    (item.meal_type as string) ??
    (item.pets_type as string) ??
    (item.fee_type as string) ??
    (item.deposit_type as string) ??
    (item.shuttle_type as string) ??
    (item.territory_type as string) ??
    (item.work_area as string) ??
    (item.internet_type as string) ??
    (item.check_in_check_out_type as string) ??
    null
  const typeLabel = humanize(typeField)

  const destinationLabel = humanize(item.destination_type as string)
  const ageStart = item.age_start
  const ageEnd = item.age_end
  const ageLabel =
    typeof ageStart === 'number' && typeof ageEnd === 'number'
      ? `Ages ${ageStart}–${ageEnd}`
      : null

  const parts: string[] = []
  if (typeLabel) parts.push(typeLabel)
  if (destinationLabel && category === 'shuttle')
    parts.push(`to ${destinationLabel.toLowerCase()}`)
  if (ageLabel) parts.push(ageLabel)
  if (!typeLabel && !ageLabel) parts.push(CATEGORY_LABELS[category] ?? category)

  const label = parts.join(' — ')
  if (priceLabel === null) return `${label}${unitLabel ? ' — price on request' : ''}`
  return `${label}: ${priceLabel}${unitLabel}`
}

export function HotelMetapolicySection({ metapolicy, extraInfo }: Props) {
  const [expanded, setExpanded] = useState(false)

  // Defensive at every level — the source data has already been wrong
  // once (an array-shaped type for what's actually an object), so this
  // never trusts anything beyond "is it the type of thing I expect
  // right now" before touching it.
  const isValidObject =
    !!metapolicy && typeof metapolicy === 'object' && !Array.isArray(metapolicy)

  const lines: { category: string; text: string }[] = []

  if (isValidObject) {
    for (const [category, value] of Object.entries(metapolicy)) {
      if (value === null || value === undefined) continue

      if (category === 'visa') {
        const support = (value as { visa_support?: string | null })
          ?.visa_support
        const label = humanize(support)
        if (label) {
          lines.push({
            category,
            text: `${label.replace(/^Support /, '').replace(/^Enable$/, 'Available')}`,
          })
        }
        continue
      }

      if (category === 'no_show') {
        const v = value as {
          time?: string | null
          day_period?: string | null
          availability?: string | null
        }
        if (v.availability === 'available') {
          const time = v.time ?? null
          const period = humanize(v.day_period)
          const bits = [period, time].filter(Boolean).join(' · ')
          lines.push({
            category,
            text: bits
              ? `Rooms may be released to other guests ${bits}`
              : 'This property has a no-show policy',
          })
        }
        continue
      }

      if (!Array.isArray(value)) continue // unexpected shape — skip, don't crash

      for (const item of value) {
        if (!item || typeof item !== 'object') continue
        const text = describeItem(category, item as Record<string, unknown>)
        if (text) lines.push({ category, text })
      }
    }
  }

  const hasContent = lines.length > 0 || !!extraInfo
  if (!hasContent) return null

  const visibleLines = expanded ? lines : lines.slice(0, COLLAPSED_COUNT)
  const hiddenCount = lines.length - visibleLines.length

  return (
    <section>
      <h2 className='mb-2 font-heading text-lg font-bold text-foreground'>
        What you&apos;ll pay at the property
      </h2>
      {lines.length > 0 && (
        <div className='mb-3 grid gap-2 sm:grid-cols-2'>
          {visibleLines.map((line, i) => (
            <div
              key={`${line.category}-${i}`}
              className='rounded-lg border border-border bg-card px-3 py-2 text-[12px] text-muted-foreground'
            >
              {line.text}
            </div>
          ))}
        </div>
      )}

      {lines.length > COLLAPSED_COUNT && (
        <button
          type='button'
          onClick={() => setExpanded((e) => !e)}
          className='flex items-center gap-1 font-mono text-[11px] font-bold text-primary hover:underline'
        >
          {expanded ? 'Show less' : `Show ${hiddenCount} more`}
          <ChevronDown
            className={`size-3 transition-transform ${expanded ? 'rotate-180' : ''}`}
          />
        </button>
      )}

      {extraInfo && (
        <div className='mt-3 rounded-xl border border-border bg-card p-4'>
          <p className='text-[12px] leading-relaxed text-muted-foreground'>
            {extraInfo}
          </p>
        </div>
      )}
    </section>
  )
}
