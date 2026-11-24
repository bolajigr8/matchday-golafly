'use client'

import { Tag, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatMatchdayMoney } from '@/features/matchday/format'
import type { AppliedCoupon } from '@/features/discounts/types'

export function CouponField({
  code,
  onCodeChange,
  applied,
  error,
  isPending,
  onApply,
  onClear,
  currency = 'EUR',
}: {
  code: string
  onCodeChange: (value: string) => void
  applied: AppliedCoupon | null
  error: string | null
  isPending: boolean
  onApply: () => void
  onClear: () => void
  currency?: string
}) {
  if (applied) {
    return (
      <div className='rounded-xl border border-primary/30 bg-primary/5 px-3 py-2.5'>
        <div className='flex items-center justify-between gap-2'>
          <div className='min-w-0'>
            <p className='truncate text-[12px] font-bold text-foreground'>
              {applied.label}
            </p>
            <p className='font-mono text-[10px] text-muted-foreground'>
              {applied.code} · −{formatMatchdayMoney(applied.value, currency)}
            </p>
          </div>
          <button
            type='button'
            onClick={onClear}
            className='flex size-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
            aria-label='Remove coupon'
          >
            <X className='size-3.5' />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className='space-y-1.5'>
      <p className='font-mono text-[10px] uppercase tracking-widest text-muted-foreground'>
        Coupon code
      </p>
      <div className='flex gap-2'>
        <div className='relative flex-1'>
          <Tag className='pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground' />
          <input
            type='text'
            value={code}
            onChange={(e) => onCodeChange(e.target.value.toUpperCase())}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                onApply()
              }
            }}
            placeholder='Enter code'
            autoComplete='off'
            className={cn(
              'h-10 w-full rounded-xl border bg-muted/30 pl-9 pr-3 text-sm uppercase tracking-wide text-foreground placeholder:text-muted-foreground transition-all focus:outline-none focus:ring-2 focus:ring-primary/50',
              error ? 'border-destructive' : 'border-border',
            )}
          />
        </div>
        <button
          type='button'
          onClick={onApply}
          disabled={isPending || code.trim() === ''}
          className='h-10 rounded-xl bg-primary px-4 text-xs font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50'
        >
          {isPending ? '…' : 'Apply'}
        </button>
      </div>
      {error && (
        <p className='font-mono text-[10px] text-destructive'>{error}</p>
      )}
    </div>
  )
}
