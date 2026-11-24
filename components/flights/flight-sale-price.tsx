'use client'

// The flight promo on a result: badge, crossed-out fare, sale price.
// The charged amount is untouched here; checkout applies the same band.

import { currencySymbol } from '@/lib/currency'
import { PromoBadge } from '@/components/promo/promo-badge'
import { useFlightOfferQuote } from '@/features/promo/use-flight-promo'
import type { FlightOffer } from '@/features/flights/types'
import { cn } from '@/lib/utils'

function money(amount: number, currency: string): string {
  return `${currencySymbol(currency)}${amount.toLocaleString('en-GB', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

export function FlightSalePrice({
  offer,
  amountClassName,
  className,
}: {
  offer: FlightOffer
  amountClassName: string
  className?: string
}) {
  const { promo, percent, shown, saleAmount } = useFlightOfferQuote(offer)
  const onSale = percent > 0 && promo != null

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      {onSale && (
        <>
          <PromoBadge label={promo.label} percent={percent} />
          <s translate='no' className='notranslate text-xs leading-none text-muted-foreground'>
            {money(shown.amount, shown.currency)}
          </s>
        </>
      )}
      <p translate='no' className={cn('notranslate', amountClassName)}>
        {money(onSale ? saleAmount : shown.amount, shown.currency)}
      </p>
    </div>
  )
}
