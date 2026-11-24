'use client'

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  useEffect,
} from 'react'
import { toast } from 'sonner'
import { CART_UPDATED_EVENT, getCartApi, removeCartItemApi } from './api'
import type { CartSummary, ServerCartItem } from './types'
import { normalizePriceSummary } from '@/features/price-breakdown/helpers'
import type { PriceSummary } from '@/features/price-breakdown/types'

/* ─── Cart item ───────────────────────────────────────────────────
   One canonical shape reused by every add-to-cart surface (tours,
   tiers, matches, VIP, and the builder's tickets/hotel/flight/eSIM).
   `key` is a stable de-dupe id, e.g. "tour:camp-nou", "match:cl3".   */
export type CartItemType =
  | 'tour'
  | 'tier'
  | 'match'
  | 'vip'
  | 'tickets'
  | 'hotel'
  | 'flight'
  | 'esim'

/** Raw data each real product's checkout endpoint needs. Shape depends on `type`:
 *   - flight → { offerId: string, serverId?: string }
 *   - hotel  → { bookHash, hotelId, hotelName, checkin, checkout, adults, children, serverId?: string }
 *   - esim   → { packageId, esimType, country, serverId?: string }
 *   - tickets (real) → { isReal: true, eventId, listingId, quantity, serverId?: string }
 *  `serverId` is the golafly cart item UUID after a successful add-to-cart. */
export type CartCheckoutPayload = Record<string, unknown>

export interface CartItem {
  key: string
  type: CartItemType
  name: string
  /** " · "-separated facts; rendered as a ✓ list in the summary. */
  detail: string
  price: number
  qty: number
  image?: string
  /** Optional "resume" link — where clicking the item title navigates
      (e.g. back into the builder to finish an unfinished booking). */
  href?: string
  /** Raw payload needed to actually check this item out for real via its
   *  product's own API (see CartCheckoutPayload above). Undefined for
   *  mocked items (tour/tier/match/vip/tickets) that have no real order. */
  checkoutPayload?: CartCheckoutPayload
}

/** Input to addItem — qty defaults to 1. */
export type NewCartItem = Omit<CartItem, 'qty'> & { qty?: number }

const STORAGE_KEY = 'gf-cart'

/* ─── External store ──────────────────────────────────────────────
   The item list lives in a module-level store read via
   useSyncExternalStore, so localStorage hydration is SSR-safe and
   needs no set-state-in-effect.                                      */
const EMPTY: CartItem[] = []
let store: CartItem[] = EMPTY
let hydrated = false
const listeners = new Set<() => void>()

function emit() {
  listeners.forEach((l) => l())
}

function persist() {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
  } catch {
    /* quota / private mode — ignore */
  }
}

function setStore(next: CartItem[]) {
  store = next
  persist()
  emit()
}

function subscribe(onChange: () => void): () => void {
  /* Hydrate from localStorage the first time anything subscribes (client only). */
  if (!hydrated) {
    hydrated = true
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      const parsed = raw ? JSON.parse(raw) : null
      if (Array.isArray(parsed) && parsed.length) store = parsed as CartItem[]
    } catch {
      /* corrupt storage — start empty */
    }
  }
  listeners.add(onChange)
  return () => listeners.delete(onChange)
}

const getSnapshot = () => store
const getServerSnapshot = () => EMPTY
const subscribeTrue = subscribe
const getHydratedClient = () => true
const getHydratedServer = () => false

function serverItemMatchesLocal(
  local: CartItem,
  server: ServerCartItem,
): boolean {
  const payload = local.checkoutPayload ?? {}
  const serverId = typeof payload.serverId === 'string' ? payload.serverId : ''
  if (serverId && serverId === server.id) return true

  if (local.type === 'flight' && server.type === 'flight') {
    return payload.offerId === server.offerId
  }
  if (local.type === 'hotel' && server.type === 'stays') {
    return (
      (typeof payload.bookHash === 'string' &&
        payload.bookHash === server.bookHash) ||
      String(payload.hotelId ?? '') === String(server.hotelId)
    )
  }
  if (local.type === 'esim' && server.type === 'esim') {
    return payload.packageId === server.packageId
  }
  if (local.type === 'tickets' && server.type === 'matchday') {
    return (
      String(payload.eventId ?? '') === String(server.eventId) &&
      String(payload.listingId ?? '') === String(server.listingId)
    )
  }
  return false
}

function localMatchesServer(local: CartItem, server: ServerCartItem): boolean {
  return serverItemMatchesLocal(local, server)
}

function serverPrice(server: ServerCartItem): number | null {
  // Flight is intentionally not handled here. server.offer.total_amount
  // is the bare Duffel fare with no services/add-ons breakdown — the
  // CartFlightItem type the backend returns has no field for that at
  // all right now. Using it as this item's per-line price would silently
  // drop whatever bags/seats the customer added. Flight price is handled
  // as a special case in reconcileLocalStore below, which preserves the
  // locally computed value (fare + bags + seats) until the backend adds
  // a real per-item breakdown field. The grand Total shown on the Pay
  // screen does NOT depend on this function at all — it reads
  // CartSummary.subtotal directly via `serverSubtotal`, see below.
  if (server.type === 'esim')
    return Number.isFinite(server.package.price) ? server.package.price : null
  if (server.type === 'stays') {
    const n = Number(server.prebookedRate?.total_price)
    return Number.isFinite(n) ? n : null
  }
  if (server.type === 'matchday') return server.unitAmount
  return null
}

function reconcileLocalStore(
  current: CartItem[],
  serverCart: CartSummary,
): CartItem[] {
  const serverItems = serverCart.items ?? []
  const next: CartItem[] = []

  for (const local of current) {
    const isLive = ['tickets', 'flight', 'hotel', 'esim'].includes(local.type)
    if (!isLive) {
      next.push(local)
      continue
    }

    // A real MatchDay ticket bought through the dedicated direct-checkout
    // flow is intentionally not in the cart API. Preserve that local item
    // until its own order confirmation page removes it.
    const localServerId =
      typeof local.checkoutPayload?.serverId === 'string'
        ? local.checkoutPayload.serverId
        : ''
    if (local.type === 'tickets' && !localServerId) {
      next.push(local)
      continue
    }

    const match = serverItems.find((server) =>
      localMatchesServer(local, server),
    )
    if (!match) {
      // The server is authoritative for live checkout products. If it no
      // longer contains this item, remove the stale browser copy.
      continue
    }

    const payload = { ...(local.checkoutPayload ?? {}), serverId: match.id }

    // Flight: keep the locally computed price (fare + bags + seats) as-is.
    // serverPrice() deliberately returns null for 'flight' — see comment
    // there — so falling through to `local.price` here is correct, not a
    // fallback-of-last-resort. Once the backend adds a services/add-ons
    // total to CartFlightItem, replace this branch with
    // fare + that field, the same way stays/esim/matchday already trust
    // the server outright.
    if (match.type === 'flight') {
      next.push({
        ...local,
        checkoutPayload: payload,
      })
      continue
    }

    const price = serverPrice(match)
    next.push({
      ...local,
      qty:
        match.type === 'matchday'
          ? match.quantity
          : match.type === 'esim'
            ? match.quantity
            : local.qty,
      price: price ?? local.price,
      checkoutPayload: payload,
    })
  }

  return next
}

/** The ids of the SERVER cart items this browser's cart is showing. */
function liveServerIds(items: CartItem[]): { ids: Set<string>; complete: boolean } {
  const ids = new Set<string>()
  let complete = true
  for (const i of items) {
    const payable =
      i.type === 'flight' ||
      i.type === 'hotel' ||
      i.type === 'esim' ||
      (i.type === 'tickets' && i.checkoutPayload?.isReal === true)
    if (!payable) continue
    const id =
      typeof i.checkoutPayload?.serverId === 'string'
        ? i.checkoutPayload.serverId
        : ''
    if (id) ids.add(id)
    else complete = false
  }
  return { ids, complete }
}

/**
 * Does a server price summary describe exactly the (payable) items on
 * screen? A summary that is missing an item that was just added — or still
 * contains one that was just removed — would show a wrong fee and total, so
 * it must not be used (screens then show what they showed before).
 */
export function summaryCoversItems(
  summary: PriceSummary | null | undefined,
  items: CartItem[],
): boolean {
  if (!summary) return false
  const { ids, complete } = liveServerIds(items)
  if (!complete || ids.size === 0) return false
  const inSummary = new Set(summary.lines.map((l) => l.item_id))
  if (inSummary.size !== ids.size) return false
  for (const id of ids) if (!inSummary.has(id)) return false
  return true
}

interface CartValue {
  items: CartItem[]
  count: number
  subtotal: number
  hydrated: boolean
  /** Key of the item most recently added — drives the "just added" flash. */
  justAddedKey: string | null
  /**
   * The currency the SERVER cart is actually priced in, as last reported
   * by GET/PATCH /cart (`CartSummary.currency`). Null until the first
   * successful fetch. This is deliberately separate from
   * `useCurrencyStore().currency` (the buyer's selection driving the
   * X-Currency header) — the two can disagree, e.g. right after the
   * buyer switches currency elsewhere but before the cart has been
   * re-priced. Screens compare the two to detect that mismatch.
   */
  cartCurrency: string | null
  /**
   * The server cart's own computed subtotal (CartSummary.subtotal), as
   * last reported by GET/PATCH /cart. This already includes flight
   * services (bags/seats) once the backend has stored them against the
   * item — it is the number Stripe/checkout will ultimately charge, so
   * it's what the Pay screen's Total and Pay-button amount should
   * always show, instead of the locally-summed `subtotal` below (which
   * is a client-side approximation used for per-item display and as a
   * fallback before the first successful fetch resolves).
   */
  serverSubtotal: number | null
  /**
   * The server cart's price breakdown (CartSummary.price_summary): provider
   * lines → ONE Golafly booking fee → total, validated. This is the
   * no-coupon summary (the 15s poll never sends a coupon); the pay screen
   * previews coupons itself. null before the first fetch, for an empty
   * cart, or whenever the backend's summary is missing/unreadable — in all
   * of those cases screens keep showing `serverSubtotal`/`subtotal` exactly
   * as they did before this feature.
   */
  priceSummary: PriceSummary | null
  addItem: (item: NewCartItem, opts?: { silent?: boolean }) => void
  updateQty: (key: string, qty: number) => void
  removeItem: (key: string) => void
  /** Remove every item of a given type (used by the builder). Local-only —
   *  deliberately does NOT touch the server. Kept exactly as-is because
   *  app/builder/checkout-tickets/confirm/client.tsx already deletes the
   *  server-side item itself (it needs finer control — sometimes by
   *  serverId, sometimes by looking the matching item up first) and then
   *  calls this purely to clear the local copy afterwards; making this
   *  function also hit the server would fire a redundant/duplicate DELETE
   *  right after that flow's own one. Callers that need the server item(s)
   *  removed too should use removeTypeAndServer below instead. */
  removeType: (type: CartItemType) => void
  /**
   * Same as removeType, but first deletes the server-side cart item(s) of
   * this type too (best-effort — a failed delete doesn't block the local
   * removal, since we're about to overwrite this type's item anyway).
   *
   * Bug fix: builder screens that let someone change a hotel/flight/eSIM
   * choice used to call the local-only removeType before re-adding the new
   * pick. That deleted the OLD choice from the browser's cart view, but its
   * server-side cart item was never deleted — so switching a selection
   * multiple times before ever reaching checkout could leave several stale,
   * still-payable duplicates sitting in the server cart, invisible in the
   * UI. Use this wherever a builder selection is being replaced.
   */
  removeTypeAndServer: (type: CartItemType) => Promise<void>
  clear: () => void
  /** Re-fetch the backend cart and reconcile live checkout items. */
  refreshFromServer: () => Promise<void>
  /**
   * Merge an already-fetched CartSummary (e.g. the response of a PATCH
   * /cart/currency call a caller just made) into local state immediately,
   * without waiting for the next poll. Also updates `cartCurrency` and
   * `serverSubtotal`.
   */
  applyServerCart: (serverCart: CartSummary) => void
  isOpen: boolean
  openCart: () => void
  closeCart: () => void
}

const CartContext = createContext<CartValue | null>(null)

/** Parse a price that may arrive as a number or a string like "From €4,500/pp". */
export function priceToNumber(
  value: string | number | null | undefined,
): number {
  if (typeof value === 'number') return value
  if (!value) return 0
  const digits = value.replace(/[^0-9.]/g, '')
  const n = parseFloat(digits)
  return Number.isFinite(n) ? n : 0
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const items = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  const isHydrated = useSyncExternalStore(
    subscribeTrue,
    getHydratedClient,
    getHydratedServer,
  )

  const [isOpen, setIsOpen] = useState(false)
  const [justAddedKey, setJustAddedKey] = useState<string | null>(null)
  const [cartCurrency, setCartCurrency] = useState<string | null>(null)
  const [serverSubtotal, setServerSubtotal] = useState<number | null>(null)
  const [rawPriceSummary, setPriceSummary] = useState<PriceSummary | null>(null)
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const addItem = useCallback(
    (item: NewCartItem, opts?: { silent?: boolean }) => {
      const qty = item.qty ?? 1
      const idx = store.findIndex((i) => i.key === item.key)
      if (idx === -1) {
        setStore([...store, { ...item, qty }])
      } else {
        const next = [...store]
        // Merge: re-adding the same key replaces its fields but keeps a
        // running quantity — except silent syncs (builder) set an absolute qty.
        next[idx] = {
          ...next[idx],
          ...item,
          qty: opts?.silent ? qty : next[idx].qty + qty,
        }
        setStore(next)
      }

      if (opts?.silent) return
      setJustAddedKey(item.key)
      setIsOpen(true)
      if (flashTimer.current) clearTimeout(flashTimer.current)
      flashTimer.current = setTimeout(() => setJustAddedKey(null), 1600)
    },
    [],
  )

  const refreshFromServer = useCallback(async () => {
    try {
      const response = await getCartApi()
      if (!response.success) return
      setCartCurrency(response.data.currency ?? null)
      // Trust the server's own subtotal for the Total/Pay amount — see
      // serverSubtotal doc comment above. Captured independently of
      // reconcileLocalStore, which only ever adjusts individual line
      // items, never the grand total.
      setServerSubtotal(
        typeof response.data.subtotal === 'number'
          ? response.data.subtotal
          : null,
      )
      setPriceSummary(normalizePriceSummary(response.data.price_summary))
      const reconciled = reconcileLocalStore(store, response.data)
      if (JSON.stringify(reconciled) !== JSON.stringify(store)) {
        setStore(reconciled)
      }
    } catch {
      // A cart refresh must never break checkout just because the network is
      // temporarily unavailable. The next focus/interval refresh will retry.
    }
  }, [])

  // Bug fix: this used to only touch the local/localStorage copy. For a
  // live checkout item (flight/hotel/esim/matchday) that has a serverId
  // — i.e. it's actually sitting in the backend cart — that left the
  // server cart holding the item forever. The 15s poll's reconcile only
  // removes local items the server no longer has; it never re-adds items
  // the server still has but local doesn't, so the "deleted" item stayed
  // invisible in the UI while still being present (and payable) on the
  // server. Removing it now deletes server-side first, and only drops it
  // locally once that call has actually gone through.
  const removeItem = useCallback((key: string) => {
    const target = store.find((i) => i.key === key)
    const serverId =
      typeof target?.checkoutPayload?.serverId === 'string'
        ? target.checkoutPayload.serverId
        : null

    // Optimistic UI: remove immediately so the drawer feels instant.
    const previous = store
    setStore(store.filter((i) => i.key !== key))

    if (!serverId) return

    void removeCartItemApi(serverId)
      .then(() => {
        // Re-sync so price_summary (lines, the single Golafly fee, the
        // total) no longer includes the item we just deleted.
        void refreshFromServer()
      })
      .catch(() => {
        // The server never dropped it — put the item back rather than
        // leave the UI showing an empty slot for something that will
        // still show up (and still be payable) at checkout.
        setStore([...previous])
        toast.error('Could not remove that item. Please try again.')
      })
  }, [refreshFromServer])

  // Bug fix: dropping the qty stepper to 0 used to go through this plain
  // `setStore` filter, which — same as the old removeItem — only ever
  // touched the local/localStorage copy. For a live checkout item
  // (flight/hotel/esim/matchday) with a serverId, that meant clicking "-"
  // down to zero emptied the drawer visually while the item stayed in the
  // backend cart (still returned by GET /cart, still payable at checkout).
  // Delegate to removeItem so a decrement-to-zero gets the exact same
  // server-delete-then-reconcile handling as the trash icon.
  const updateQty = useCallback(
    (key: string, qty: number) => {
      if (qty <= 0) {
        removeItem(key)
        return
      }
      setStore(store.map((i) => (i.key === key ? { ...i, qty } : i)))
    },
    [removeItem],
  )

  const removeType = useCallback((type: CartItemType) => {
    setStore(store.filter((i) => i.type !== type))
  }, [])

  const removeTypeAndServer = useCallback(async (type: CartItemType) => {
    const targets = store.filter((i) => i.type === type)
    const serverIds = targets
      .map((i) =>
        typeof i.checkoutPayload?.serverId === 'string'
          ? i.checkoutPayload.serverId
          : null,
      )
      .filter((id): id is string => !!id)

    if (serverIds.length) {
      // Best-effort: even if a delete fails (already gone, network hiccup),
      // still proceed to drop the local copy below — the caller is about
      // to add a replacement item of this same type regardless, and the
      // periodic server reconciliation will clean up anything that
      // genuinely failed to delete.
      await Promise.allSettled(serverIds.map((id) => removeCartItemApi(id)))
    }

    setStore(store.filter((i) => i.type !== type))
    // The caller is about to add a replacement; re-sync now so the
    // price_summary never shows the item that was just removed.
    if (serverIds.length) void refreshFromServer()
  }, [refreshFromServer])

  const applyServerCart = useCallback((serverCart: CartSummary) => {
    setCartCurrency(serverCart.currency ?? null)
    setServerSubtotal(
      typeof serverCart.subtotal === 'number' ? serverCart.subtotal : null,
    )
    setPriceSummary(normalizePriceSummary(serverCart.price_summary))
    const reconciled = reconcileLocalStore(store, serverCart)
    if (JSON.stringify(reconciled) !== JSON.stringify(store)) {
      setStore(reconciled)
    }
  }, [])

  const clear = useCallback(() => setStore([]), [])

  // The server cart is authoritative for real checkout products. Refresh on
  // mount, tab focus, visibility changes, and periodically while the app is
  // open so stale localStorage cannot survive a completed/abandoned booking.
  // Preview-only catalogue items are intentionally preserved locally.
  useEffect(() => {
    if (!isHydrated) return

    void refreshFromServer()

    const refresh = () => void refreshFromServer()
    const onVisibility = () => {
      if (document.visibilityState === 'visible') refresh()
    }
    const interval = window.setInterval(refresh, 15_000)
    window.addEventListener('focus', refresh)
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      window.clearInterval(interval)
      window.removeEventListener('focus', refresh)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [isHydrated, refreshFromServer])
  // An add/remove just returned a fresh cart: take its price breakdown (and
  // subtotal) straight away instead of waiting for the next 15s refresh.
  // Items are NOT reconciled here — only the money, which is the backend's.
  useEffect(() => {
    const onUpdated = (e: Event) => {
      const cart = (e as CustomEvent<CartSummary>).detail
      if (!cart || typeof cart !== 'object') return
      setPriceSummary(normalizePriceSummary(cart.price_summary))
      setServerSubtotal(
        typeof cart.subtotal === 'number' ? cart.subtotal : null,
      )
    }
    window.addEventListener(CART_UPDATED_EVENT, onUpdated)
    return () => window.removeEventListener(CART_UPDATED_EVENT, onUpdated)
  }, [])
  const openCart = useCallback(() => setIsOpen(true), [])
  const closeCart = useCallback(() => setIsOpen(false), [])

  // Only expose the server's breakdown while it describes exactly the
  // payable items shown (see summaryCoversItems).
  const priceSummary = useMemo(
    () => (summaryCoversItems(rawPriceSummary, items) ? rawPriceSummary : null),
    [rawPriceSummary, items],
  )

  const count = useMemo(() => items.reduce((s, i) => s + i.qty, 0), [items])
  const subtotal = useMemo(
    () => items.reduce((s, i) => s + i.price * i.qty, 0),
    [items],
  )

  const value = useMemo<CartValue>(
    () => ({
      items,
      count,
      subtotal,
      hydrated: isHydrated,
      justAddedKey,
      cartCurrency,
      serverSubtotal,
      priceSummary,
      addItem,
      updateQty,
      removeItem,
      removeType,
      removeTypeAndServer,
      clear,
      refreshFromServer,
      applyServerCart,
      isOpen,
      openCart,
      closeCart,
    }),
    [
      items,
      count,
      subtotal,
      isHydrated,
      justAddedKey,
      cartCurrency,
      serverSubtotal,
      priceSummary,
      addItem,
      updateQty,
      removeItem,
      removeType,
      removeTypeAndServer,
      clear,
      refreshFromServer,
      applyServerCart,
      isOpen,
      openCart,
      closeCart,
    ],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart(): CartValue {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within a CartProvider')
  return ctx
}
