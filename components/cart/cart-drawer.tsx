'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown, ShoppingCart, Trash2, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCart } from '@/features/cart/context'
import { VipCartNotice } from '@/components/vip/cart-notice'
import { useVipSession } from '@/features/vip/session'
import { builderStepHref } from '@/features/builder/enter'
import { useCurrencyStore } from '@/store/currency'
import { formatMatchdayMoney } from '@/features/matchday/format'
import { PriceSummaryRows } from '@/components/price/price-rows'
import { GrandTotalRow } from '@/components/price/total-row'
import {
  formatPriceAmount,
  itemProviderTotal,
  serverIdOf,
  summaryHasItemType,
} from '@/features/price-breakdown/helpers'
import type { PriceSummary } from '@/features/price-breakdown/types'
import { useSummaryWithMatchPromo } from '@/features/promo/use-promo-summary'

/* Collapsible price breakdown + total for the drawer footer. Open on
   desktop, collapsed on phones, where a long list of lines (tickets, fees,
   flight, eSIM…) would squeeze the items above. It mounts with the drawer,
   so each opening starts from that default. The total, with the promo,
   always stays visible. */
function DrawerPriceDetails({
  summary,
  itemCount,
}: {
  summary: PriceSummary
  itemCount: number
}) {
  const [open, setOpen] = useState(
    () => window.matchMedia('(min-width: 640px)').matches,
  )
  return (
    <>
      <button
        type='button'
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls='cart-drawer-price-details'
        className='flex w-full items-center justify-between py-2 font-mono text-[11px] uppercase tracking-wide text-muted-foreground transition-colors hover:text-foreground'
      >
        <span>
          Price details
          <span className='ml-1.5 normal-case tracking-normal text-muted-foreground/70'>
            · {itemCount} {itemCount === 1 ? 'item' : 'items'}
          </span>
        </span>
        <span className='flex items-center gap-1 normal-case tracking-normal'>
          {open ? 'Hide' : 'Show'}
          <ChevronDown
            className={cn(
              'size-3.5 transition-transform duration-200',
              open && 'rotate-180',
            )}
          />
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id='cart-drawer-price-details'
            key='details'
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className='overflow-hidden'
          >
            <div className='max-h-[34vh] overflow-y-auto pt-1 pr-1'>
              <PriceSummaryRows summary={summary} showTotal={false} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <GrandTotalRow
        amount={summary.total.amount}
        currency={summary.currency}
        format={formatPriceAmount}
        size='md'
      />
    </>
  )
}

/* Global slide-out cart. Rendered once (in Providers). Reads all state
   from the cart context, so any add-to-cart anywhere reflects here. */
export function CartDrawer() {
  const vipSession = useVipSession()
  const {
    items,
    count,
    subtotal,
    isOpen,
    closeCart,
    removeItem,
    justAddedKey,
    cartCurrency,
    priceSummary,
  } = useCart()
  // `cartCurrency` is the server's authoritative currency for this cart
  // (CartSummary.currency) — falls back to the buyer's current selection
  // only for the brief window before the first GET/PATCH /cart response
  // has come back, so the drawer never has to guess/hardcode a symbol.
  const selectedCurrency = useCurrencyStore((s) => s.currency)
  const currency = cartCurrency ?? selectedCurrency

  const realTicketItem = items.find(
    (i) => i.type === 'tickets' && i.checkoutPayload?.isReal,
  )
  const realTicketMatchId = realTicketItem?.checkoutPayload?.matchId as
    | string
    | undefined
  // Only use the breakdown when it covers what is in the cart (a real
  // ticket not yet on the server cart would be missing from it).
  const summaryBase =
    priceSummary &&
    (!realTicketItem || summaryHasItemType(priceSummary, 'matchday'))
      ? priceSummary
      : null
  const summary = useSummaryWithMatchPromo(summaryBase)
  const checkoutHref = realTicketMatchId
    ? builderStepHref('/builder/pay', realTicketMatchId)
    : '/builder/pay'

  /* Lock body scroll while open. */
  useEffect(() => {
    if (!isOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [isOpen])

  /* Close on Escape. */
  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closeCart()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, closeCart])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className='fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={closeCart}
          />

          {/* Panel */}
          <motion.aside
            className='fixed inset-y-0 right-0 z-[61] flex w-full max-w-[420px] flex-col border-l border-border bg-background shadow-2xl'
            role='dialog'
            aria-label='Shopping cart'
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 34 }}
          >
            {/* Header */}
            <div className='flex items-center justify-between border-b border-border px-5 py-4'>
              <div className='flex items-center gap-2.5'>
                <ShoppingCart className='size-4 text-primary' strokeWidth={2} />
                <h2 className='font-heading text-sm font-bold uppercase tracking-wide text-foreground'>
                  Your Cart
                </h2>
                {count > 0 && (
                  <span className='rounded-full bg-primary/10 px-2 py-0.5 font-mono text-[10px] font-bold text-primary'>
                    {count}
                  </span>
                )}
              </div>
              <button
                type='button'
                onClick={closeCart}
                aria-label='Close cart'
                className='rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
              >
                <X className='size-4' />
              </button>
            </div>

            {/* VIP package in the basket (built on the VIP pages) */}
            <VipCartNotice onNavigate={closeCart} />

            {/* Items */}
            {/* With a VIP package in the basket the notice above is the cart:
                no "Your cart is empty" under it. */}
            {items.length === 0 && vipSession ? null : items.length === 0 ? (
              <div className='flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center'>
                <div className='flex size-14 items-center justify-center rounded-full border border-border bg-muted/60'>
                  <ShoppingCart
                    className='size-6 text-muted-foreground'
                    strokeWidth={1.5}
                  />
                </div>
                <p className='font-heading text-sm font-bold text-foreground'>
                  Your cart is empty
                </p>
                <p className='max-w-[240px] text-xs text-muted-foreground'>
                  Add stadium tours, matches or hospitality to build your
                  matchday.
                </p>
                <button
                  type='button'
                  onClick={closeCart}
                  className='mt-1 rounded-full border border-border px-5 py-2 font-heading text-xs font-bold text-foreground transition-colors hover:border-primary/50 hover:text-primary'
                >
                  Continue browsing
                </button>
              </div>
            ) : (
              <div className='flex-1 overflow-y-auto px-4 py-4'>
                <ul className='space-y-3'>
                  <AnimatePresence initial={false}>
                    {items.map((item) => (
                      <motion.li
                        key={item.key}
                        layout
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, height: 0, marginTop: 0 }}
                        transition={{
                          duration: 0.22,
                          ease: [0.22, 1, 0.36, 1],
                        }}
                        className={cn(
                          'flex gap-3 rounded-xl border p-3 transition-colors',
                          justAddedKey === item.key
                            ? 'border-primary/60 bg-primary/5'
                            : 'border-border bg-card',
                        )}
                      >
                        {/* Thumb */}
                        <div className='size-14 shrink-0 overflow-hidden rounded-lg border border-border bg-muted'>
                          {item.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={item.image}
                              alt=''
                              className='h-full w-full object-cover'
                            />
                          ) : (
                            <div className='flex h-full w-full items-center justify-center font-mono text-[9px] uppercase text-muted-foreground'>
                              {item.type}
                            </div>
                          )}
                        </div>

                        {/* Body */}
                        <div className='min-w-0 flex-1'>
                          <div className='flex items-start justify-between gap-2'>
                            {item.href ? (
                              <Link
                                href={item.href}
                                onClick={closeCart}
                                className='block truncate text-[13px] font-semibold text-foreground underline-offset-2 transition-all hover:text-primary hover:underline hover:[text-shadow:0_0_10px_var(--brand-glow)]'
                              >
                                {item.name}
                              </Link>
                            ) : (
                              <p className='truncate text-[13px] font-semibold text-foreground'>
                                {item.name}
                              </p>
                            )}
                            <button
                              type='button'
                              onClick={() => removeItem(item.key)}
                              aria-label={`Remove ${item.name}`}
                              className='shrink-0 rounded p-0.5 text-muted-foreground transition-colors hover:text-destructive'
                            >
                              <Trash2 className='size-3.5' />
                            </button>
                          </div>
                          <p className='mt-0.5 line-clamp-2 text-[11px] leading-snug text-muted-foreground'>
                            {item.detail}
                          </p>

                          <div className='mt-2 flex items-center justify-between'>
                            {/* Quantity is decided earlier in the booking flow (seat/
                                package picker) and there's no partial-update endpoint
                                for a cart line — only add and delete. A +/- stepper
                                here only ever touched local state, so incrementing did
                                nothing server-side and any drift silently snapped back
                                on the next 15s cart refresh. Read-only until the API
                                supports updating an item's quantity in place.
                                <div className="inline-flex items-center rounded-full border border-border">
                                  <button
                                    type="button"
                                    onClick={() => updateQty(item.key, item.qty - 1)}
                                    aria-label="Decrease quantity"
                                    className="flex size-6 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground"
                                  >
                                    <Minus className="size-3" />
                                  </button>
                                  <span className="w-6 text-center font-mono text-[11px] font-bold text-foreground">
                                    {item.qty}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => updateQty(item.key, item.qty + 1)}
                                    aria-label="Increase quantity"
                                    className="flex size-6 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground"
                                  >
                                    <Plus className="size-3" />
                                  </button>
                                </div>
                            */}
                            <span className='inline-flex items-center rounded-full border border-border px-2.5 py-1 font-mono text-[11px] font-bold text-foreground'>
                              Qty {item.qty}
                            </span>
                            <span
                              translate='no'
                              className='notranslate font-heading text-[13px] font-bold text-primary'
                            >
                              {(() => {
                                // Provider price only per item; the single
                                // Golafly fee is in the footer summary.
                                const provider = summary
                                  ? itemProviderTotal(summary, serverIdOf(item))
                                  : null
                                return provider
                                  ? formatMatchdayMoney(
                                      provider.amount,
                                      provider.currency,
                                    )
                                  : formatMatchdayMoney(
                                      item.price * item.qty,
                                      currency,
                                    )
                              })()}
                            </span>
                          </div>
                        </div>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
              </div>
            )}

            {/* Footer */}
            {items.length > 0 && (
              <div className='border-t border-border px-5 pt-2 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-[0_-8px_24px_rgba(0,0,0,0.06)]'>
                {summary ? (
                  <DrawerPriceDetails
                    summary={summary}
                    itemCount={items.length}
                  />
                ) : (
                  <>
                    <GrandTotalRow
                      label='Subtotal'
                      amount={subtotal}
                      currency={currency}
                      format={formatMatchdayMoney}
                      size='md'
                      className='pt-2'
                    />
                    <p className='mb-3 text-[10px] leading-relaxed text-muted-foreground'>
                      Taxes calculated at checkout.
                    </p>
                  </>
                )}
                <div className='flex flex-col gap-2'>
                  <Link
                    href={checkoutHref}
                    onClick={closeCart}
                    className='flex items-center justify-center rounded-full bg-primary px-6 py-3 font-heading text-xs font-bold uppercase tracking-wide text-primary-foreground shadow-[0_0_20px_var(--brand-glow)] transition-all hover:-translate-y-0.5'
                  >
                    Checkout cart —{' '}
                    {summary
                      ? formatMatchdayMoney(summary.total.amount, summary.currency)
                      : formatMatchdayMoney(subtotal, currency)}
                  </Link>
                  <Link
                    href='/cart'
                    onClick={closeCart}
                    className='flex items-center justify-center rounded-full border border-border px-6 py-2.5 font-heading text-xs font-bold text-foreground transition-colors hover:border-primary/50 hover:text-primary'
                  >
                    View full cart
                  </Link>
                </div>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
