"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ShoppingCart, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCart } from "@/features/cart/context";
import { builderStepHref } from "@/features/builder/enter";
import { useResolvedMatch } from "@/features/builder/use-builder-match";
import { FreeEsimNote } from "@/components/free-esim/free-esim-note";
import { useCurrencyStore } from "@/store/currency";
import { formatMatchdayMoney } from "@/features/matchday/format";
import { PriceSummaryRows } from "@/components/price/price-rows";
import { GrandTotalRow } from "@/components/price/total-row";
import {
  itemProviderTotal,
  serverIdOf,
  summaryHasItemType,
} from "@/features/price-breakdown/helpers";
import { useSummaryWithMatchPromo } from "@/features/promo/use-promo-summary";

export function CartClient() {
  const {
    items,
    count,
    subtotal,
    removeItem,
    clear,
    hydrated,
    priceSummary,
    cartCurrency,
  } = useCart();
  const selectedCurrency = useCurrencyStore((s) => s.currency);
  // The server's currency is authoritative for the cart (this page used to
  // hardcode €, which was wrong for a GBP/USD cart).
  const currency = cartCurrency ?? selectedCurrency;
  const fmt = (n: number) => formatMatchdayMoney(n, currency);

  const realTicketItem = items.find(
    (i) => i.type === "tickets" && i.checkoutPayload?.isReal,
  );
  const realTicketMatchId = realTicketItem?.checkoutPayload?.matchId as
    | string
    | undefined;
  // Free eSIM message: only for a real match ticket, by its venue country.
  const ticketMatch = useResolvedMatch(realTicketMatchId ?? null);
  // Use the breakdown only when it really covers what is in the cart. A
  // real ticket that is not on the server cart yet (the pay screen adds it
  // as a fallback) would be missing from the lines, so fall back to the
  // existing display rather than show a total that leaves it out.
  const summaryBase =
    priceSummary &&
    (!realTicketItem || summaryHasItemType(priceSummary, "matchday"))
      ? priceSummary
      : null;
  const summary = useSummaryWithMatchPromo(summaryBase);
  const checkoutHref = realTicketMatchId
    ? builderStepHref("/builder/pay", realTicketMatchId)
    : "/builder/pay";

  return (
    <div className="min-h-screen bg-background">
      <div className="page-container py-12 sm:py-16">
        {/* Head */}
        <div className="mb-8">
          <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-primary">Checkout</p>
          <h1 className="font-heading text-3xl font-bold uppercase tracking-tight text-foreground sm:text-4xl">
            Your Cart
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {hydrated && count > 0
              ? `${count} item${count === 1 ? "" : "s"} ready to book`
              : "Review your matchday before checkout."}
          </p>
          <FreeEsimNote
            enabled={hydrated && !!realTicketMatchId}
            venueCountry={ticketMatch.venueCountry}
            className="mt-4 max-w-2xl"
          />
        </div>

        {hydrated && items.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-border bg-card/40 py-20 text-center">
            <div className="flex size-16 items-center justify-center rounded-full border border-border bg-muted/60">
              <ShoppingCart className="size-7 text-muted-foreground" strokeWidth={1.5} />
            </div>
            <div className="space-y-1">
              <p className="font-heading text-lg font-bold text-foreground">Your cart is empty</p>
              <p className="max-w-sm text-sm text-muted-foreground">
                Add stadium tours, matches or VIP hospitality and they&apos;ll show up here.
              </p>
            </div>
            <div className="mt-2 flex flex-wrap justify-center gap-3">
              <Link
                href="/"
                className="rounded-full bg-primary px-6 py-2.5 font-heading text-xs font-bold uppercase tracking-wide text-primary-foreground shadow-[0_0_16px_var(--brand-glow)] transition-transform hover:-translate-y-0.5"
              >
                Stadium Tours
              </Link>
              <Link
                href="/matches"
                className="rounded-full border border-border px-6 py-2.5 font-heading text-xs font-bold text-foreground transition-colors hover:border-primary/50 hover:text-primary"
              >
                Browse Matches
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px] lg:items-start">
            {/* Items */}
            <div className="space-y-3">
              <AnimatePresence initial={false}>
                {items.map((item) => (
                  <motion.article
                    key={item.key}
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0, marginTop: 0 }}
                    transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                    className="flex gap-4 rounded-2xl border border-border bg-card p-4"
                  >
                    {/* Thumb */}
                    <div className="size-20 shrink-0 overflow-hidden rounded-xl border border-border bg-muted sm:size-24">
                      {item.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.image} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center font-mono text-[10px] uppercase text-muted-foreground">
                          {item.type}
                        </div>
                      )}
                    </div>

                    {/* Body */}
                    <div className="flex min-w-0 flex-1 flex-col">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <span className="mb-1 inline-block rounded-full border border-border px-2 py-0.5 font-mono text-[9px] uppercase tracking-wide text-muted-foreground">
                            {item.type}
                          </span>
                          {item.href ? (
                            <Link
                              href={item.href}
                              className="block truncate font-heading text-sm font-bold text-foreground underline-offset-2 transition-all hover:text-primary hover:underline hover:[text-shadow:0_0_10px_var(--brand-glow)] sm:text-base"
                            >
                              {item.name}
                            </Link>
                          ) : (
                            <h3 className="truncate font-heading text-sm font-bold text-foreground sm:text-base">
                              {item.name}
                            </h3>
                          )}
                          <p className="mt-0.5 text-xs leading-snug text-muted-foreground">{item.detail}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeItem(item.key)}
                          aria-label={`Remove ${item.name}`}
                          className="shrink-0 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-destructive"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>

                      <div className="mt-auto flex items-center justify-between pt-3">
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
                                className="flex size-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground"
                              >
                                <Minus className="size-3.5" />
                              </button>
                              <span className="w-7 text-center font-mono text-xs font-bold text-foreground">{item.qty}</span>
                              <button
                                type="button"
                                onClick={() => updateQty(item.key, item.qty + 1)}
                                aria-label="Increase quantity"
                                className="flex size-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground"
                              >
                                <Plus className="size-3.5" />
                              </button>
                            </div>
                        */}
                        <span className="inline-flex items-center rounded-full border border-border px-3 py-1.5 font-mono text-xs font-bold text-foreground">
                          Qty {item.qty}
                        </span>
                        <div className="text-right">
                          {(() => {
                            // With a breakdown, an item shows its provider
                            // price only: the one Golafly fee is in the
                            // summary, never per item.
                            const provider = summary
                              ? itemProviderTotal(summary, serverIdOf(item))
                              : null;
                            if (provider) {
                              return (
                                <p
                                  translate="no"
                                  className="notranslate font-heading text-base font-bold text-primary"
                                >
                                  {formatMatchdayMoney(provider.amount, provider.currency)}
                                </p>
                              );
                            }
                            return (
                              <>
                                <p className="font-heading text-base font-bold text-primary">{fmt(item.price * item.qty)}</p>
                                {item.qty > 1 && (
                                  <p className="font-mono text-[10px] text-muted-foreground">{fmt(item.price)} each</p>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  </motion.article>
                ))}
              </AnimatePresence>

              <div className="flex items-center justify-between pt-2">
                <Link
                  href="/"
                  className="inline-flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground transition-colors hover:text-foreground"
                >
                  <ArrowLeft className="size-3.5" />
                  Continue browsing
                </Link>
                <button
                  type="button"
                  onClick={clear}
                  className="font-mono text-[11px] text-muted-foreground transition-colors hover:text-destructive"
                >
                  Clear cart
                </button>
              </div>
            </div>

            {/* Summary */}
            <aside className="lg:sticky lg:top-24">
              <div className="rounded-2xl border border-border bg-card p-5">
                <h2 className="mb-4 font-heading text-sm font-bold uppercase tracking-wide text-foreground">
                  Order Summary
                </h2>
                {summary ? (
                  <PriceSummaryRows summary={summary} showPromo />
                ) : (
                  <>
                    <dl className="space-y-2.5 border-b border-border pb-4 text-sm">
                      <div className="flex items-center justify-between">
                        <dt className="text-muted-foreground">Subtotal</dt>
                        <dd className="font-medium text-foreground">{fmt(subtotal)}</dd>
                      </div>
                      <div className="flex items-center justify-between">
                        <dt className="text-muted-foreground">Taxes &amp; fees</dt>
                        <dd className="font-mono text-xs text-muted-foreground">Calculated at checkout</dd>
                      </div>
                    </dl>
                    <GrandTotalRow
                      amount={subtotal}
                      currency={currency}
                      format={formatMatchdayMoney}
                    />
                  </>
                )}
                <Link
                  href={checkoutHref}
                  className={cn(
                    "flex items-center justify-center rounded-full bg-primary px-6 py-3.5 font-heading text-xs font-bold uppercase tracking-wide text-primary-foreground shadow-[0_0_20px_var(--brand-glow)] transition-transform hover:-translate-y-0.5",
                    items.length === 0 && "pointer-events-none opacity-50",
                  )}
                >
                  Checkout cart
                </Link>
                <p className="mt-3 text-center text-[10px] leading-relaxed text-muted-foreground">
                  One payment for every item in your cart · Secure checkout
                </p>
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
