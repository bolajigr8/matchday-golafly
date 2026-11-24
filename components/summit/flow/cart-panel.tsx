import { Fragment, type ReactNode } from 'react'
import { approxOtherCurrencies, formatGbp } from '@/features/summit/pricing'
import type { SummitCart } from '@/features/summit/types'
import { WfsChip } from '../ui'

/* Figma "Your cart" (Ticket, Trip) / "Order summary" (Pay): the lines the
   customer has chosen, the total in GBP with the rough EUR / USD value, then
   the step's own buttons and a one-line reassurance. */
export function SummitCartPanel({
  title,
  eyebrow,
  cart,
  children,
  note,
}: {
  title: string
  eyebrow?: string
  cart: SummitCart
  children: ReactNode
  note?: ReactNode
}) {
  return (
    <aside aria-label={title} className='flex flex-col gap-3.5 rounded-[22px] border border-wfs-line bg-wfs-surface p-6 shadow-[var(--wfs-card-shadow)]'>
      <div className='flex items-center justify-between gap-3'>
        <h2 className='font-heading text-[20px] font-bold leading-[normal] text-wfs-text'>{title}</h2>
        <WfsChip className='text-[11px]'>{cart.count}</WfsChip>
      </div>
      {eyebrow && <p className='font-mono text-[10.5px] font-medium leading-[normal] tracking-[1.26px] text-wfs-lime-ink'>{eyebrow}</p>}
      <ul className='flex flex-col gap-3.5'>
        {cart.lines.map((l, i) => (
          <Fragment key={l.key}>
            {i > 0 && <li aria-hidden className='h-px bg-wfs-hair' />}
            <li className='flex items-start justify-between gap-3'>
              <span className='flex min-w-0 flex-col gap-[3px]'>
                <span className='text-[14px] font-medium leading-[normal] text-wfs-text'>{l.title}</span>
                <span className='text-[12px] leading-[normal] text-wfs-muted'>{l.detail}</span>
              </span>
              <span className='shrink-0 text-[14px] font-semibold leading-[normal] tabular-nums text-wfs-text'>{formatGbp(l.amount)}</span>
            </li>
          </Fragment>
        ))}
      </ul>
      <span aria-hidden className='h-px bg-wfs-hair' />
      <div className='flex items-end justify-between gap-3'>
        <span className='flex flex-col gap-0.5 pb-1.5'>
          <span className='font-mono text-[10.5px] font-medium leading-[normal] tracking-[1.26px] text-wfs-muted'>TOTAL · VAT INCLUDED</span>
          <span className='text-[12.5px] leading-[normal] text-wfs-muted'>{approxOtherCurrencies(cart.total)}</span>
        </span>
        <span aria-live='polite' className='font-display text-[44px] leading-[1.2] tabular-nums text-wfs-text'>
          {formatGbp(cart.total)}
        </span>
      </div>
      {children}
      {note && <p className='flex items-center gap-2 text-[12.5px] leading-[normal] text-wfs-muted'>{note}</p>}
    </aside>
  )
}
