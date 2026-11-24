'use client'

import { create } from 'zustand'

/* The "How many tickets do you need?" step, shown between a fixture's
   price button and the seats page (partner-marketplace flow). One dialog
   is mounted app-wide (components/providers.tsx); every "book this match"
   entry point reaches it through enterBuilder() in features/builder/enter.ts,
   so no caller has to know the dialog exists. */

export interface QuantityChoice {
  /** null = "Any" (skip filtering by quantity). */
  qty: number | null
  /** true when "7+" was picked: qty is the floor, not an exact count. */
  qtyPlus: boolean
  seatedTogether: boolean
}

interface QuantityRequest {
  matchId: string
  /** e.g. "Arsenal vs Everton" — shown under the dialog title when known. */
  title?: string
  initial?: Partial<QuantityChoice>
  onContinue: (choice: QuantityChoice) => void
}

interface TicketQuantityState {
  /** Set by the mounted dialog; enterBuilder() falls back to direct
   *  navigation when nothing is mounted to answer the request. */
  mounted: boolean
  request: QuantityRequest | null
  setMounted: (v: boolean) => void
  open: (req: QuantityRequest) => void
  close: () => void
}

export const useTicketQuantity = create<TicketQuantityState>((set) => ({
  mounted: false,
  request: null,
  setMounted: (mounted) => set({ mounted }),
  open: (request) => set({ request }),
  close: () => set({ request: null }),
}))

export const ANY_QUANTITY: QuantityChoice = {
  qty: null,
  qtyPlus: false,
  seatedTogether: false,
}

/** URL params the seats page reads back (see app/builder/seats/client.tsx). */
export function quantityToParams(c: QuantityChoice): Record<string, string> {
  const p: Record<string, string> = {}
  if (c.qty !== null) p.qty = c.qtyPlus ? `${c.qty}+` : String(c.qty)
  if (c.seatedTogether && c.qty !== null && c.qty > 1) p.together = '1'
  return p
}

export function quantityFromParams(params: {
  get: (k: string) => string | null
}): QuantityChoice {
  const raw = params.get('qty')
  const m = raw?.match(/^(\d{1,2})(\+)?$/)
  const qty = m ? Number(m[1]) : null
  return {
    qty: qty && qty > 0 ? qty : null,
    qtyPlus: Boolean(m?.[2]),
    seatedTogether: params.get('together') === '1' && !!qty && qty > 1,
  }
}

export function quantityLabel(c: QuantityChoice): string {
  if (c.qty === null) return 'Any quantity'
  const n = c.qtyPlus ? `${c.qty}+` : String(c.qty)
  return `${n} ticket${c.qty === 1 && !c.qtyPlus ? '' : 's'}`
}
