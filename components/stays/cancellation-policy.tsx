import { Check } from 'lucide-react'
import type { PrebookRate } from '@/features/stays/types'
import {
  getFreeCancellationLabel,
  formatPolicyBoundary,
  isStayRateRefundable,
} from '@/features/stays/format'

function sym(code: string): string {
  const M: Record<string, string> = {
    EUR: '€',
    USD: '$',
    GBP: '£',
    JPY: '¥',
    CHF: 'CHF',
    AED: 'AED',
    SAR: 'SAR',
    AUD: 'A$',
    CAD: 'C$',
  }
  return M[code] ?? code
}

/**
 * Displays the cancellation terms returned by /prebook.
 *
 * Safety rule: only an explicit `is_refundable === true` permits any
 * refundable/cancellation promise. false, null, and an omitted field are
 * treated as non-refundable. Missing cancellation fields are also safe.
 */
export function StayCancellationPolicy({
  rate,
  className = '',
}: {
  rate: PrebookRate
  className?: string
}) {
  const refundable = isStayRateRefundable(rate)

  if (!refundable) {
    return (
      <div
        className={`rounded-xl border border-destructive/30 bg-destructive/5 p-4 ${className}`}
      >
        <p className='font-mono text-[10px] font-bold uppercase tracking-wider text-destructive'>
          Cancellation
        </p>
        <p className='mt-1 text-[12px] font-medium text-destructive'>
          This booking is not cancellable.
        </p>
      </div>
    )
  }

  const deadline = getFreeCancellationLabel(rate)
  const policy = Array.isArray(rate.cancellation_policy)
    ? rate.cancellation_policy
    : []

  return (
    <div className={`space-y-3 ${className}`}>
      {deadline ? (
        <p className='flex items-center gap-1.5 text-[12px] text-emerald-500'>
          <Check className='size-3.5' />
          Free cancellation before {deadline}
          {rate.hotel_timezone === 'UTC'
            ? ' (UTC)'
            : rate.hotel_timezone
              ? ` (${rate.hotel_timezone} time)`
              : ''}
        </p>
      ) : (
        <p className='flex items-center gap-1.5 text-[12px] text-emerald-500'>
          <Check className='size-3.5' />
          Refundable booking
        </p>
      )}

      {policy.length > 0 && (
        <div className='rounded-xl border border-border bg-background p-4'>
          <p className='mb-2 font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground'>
            Cancellation policy
          </p>
          <div className='space-y-1.5'>
            {policy.map((tier, i) => {
              const isAlwaysOn = !tier.start_at && !tier.end_at
              const isFree = tier.amount === 0
              const boundary = tier.start_at
                ? formatPolicyBoundary(tier.start_at, rate.hotel_timezone)
                : formatPolicyBoundary(tier.end_at, rate.hotel_timezone)

              // Reads as a plain-language rule rather than a raw
              // from/until timestamp: "Free to cancel until <date>" /
              // "Fee applies from <date>", instead of just "Until <date>".
              const label = isAlwaysOn
                ? isFree
                  ? 'Free to cancel'
                  : 'Cancellation fee applies'
                : tier.start_at
                  ? isFree
                    ? `Free to cancel from ${boundary}`
                    : `Fee applies from ${boundary}`
                  : isFree
                    ? `Free to cancel until ${boundary}`
                    : `Fee applies until ${boundary}`

              return (
                <div
                  key={i}
                  className='flex items-center justify-between gap-4 text-[12px]'
                >
                  <span className='text-muted-foreground'>{label}</span>
                  <span
                    className={
                      tier.amount > 0
                        ? 'font-medium text-foreground'
                        : 'font-medium text-emerald-500'
                    }
                  >
                    {sym(tier.currency)}
                    {tier.amount.toFixed(2)}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
