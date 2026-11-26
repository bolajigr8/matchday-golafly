'use client'

import { useVipAvailable } from '@/features/vip/use-available'
import Link from 'next/link'
import { useEffect, useRef, useState, type RefObject } from 'react'
import { createPortal } from 'react-dom'
import { usePathname } from 'next/navigation'
import { useTheme } from 'next-themes'
import { toast } from 'sonner'
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  Globe,
  Menu,
  Moon,
  ShoppingCart,
  Star,
  Sun,
  X,
} from 'lucide-react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'

import { cn } from '@/lib/utils'
import { Flag } from '@/components/ui/flag'
import {
  useCurrencyStore,
  SUPPORTED_CURRENCIES,
  CURRENCY_SYMBOLS,
  DEFAULT_CURRENCY,
  type SupportedCurrency,
} from '@/store/currency'
import { syncCartCurrency } from '@/features/cart/currency-sync'
import { CurrencySwitchDialog } from '@/components/shared/currency-switch-dialog'
import type { ServerCartItem } from '@/features/cart/types'
import { useQueryClient } from '@tanstack/react-query'
import {
  LANGS,
  setGoogleTranslateLanguage,
  getActiveLang,
  type LangCode,
} from '@/components/google-translate'
import {
  NAV_LINKS,
  CONTACT,
  type NavChild,
  type NavGroup,
  type NavItem,
} from '@/store/data'
import { GOLAFLY_PRODUCTS, type GolaflyProduct } from '@/store/ecosystem'
import { MatchdayLogo } from '@/components/brand/matchday-logo'
import { SummitGolaflyLogo } from '@/components/summit/logo'
import { IconWhatsApp } from '@/components/social-icons'
import { CartButton } from '@/components/cart/cart-button'
import { useCart } from '@/features/cart/context'
import { useFanAuth } from '@/store/fan-auth'
import { useHydrated } from '@/hooks/use-hydrated'
import { Routes } from '@/routes'
import {
  useMatchdayTournaments,
  useMatchdayTeams,
} from '@/features/matchday/hooks'
import {
  findTournamentIdByName,
  findTeamIdByName,
} from '@/features/matchday/resolve'
import { useCatalogueSlugs } from '@/features/matchday/use-catalogue-slugs'
import { CompetitionsPanel } from '@/components/navbar-competitions'

/* The one dropdown with its own layout (a competitions column plus that
   competition's teams) — components/navbar-competitions.tsx. */
const COMPETITIONS_LABEL = 'Competitions'

// Currency options — wired to the real useCurrencyStore (store/currency.ts)
// which injects X-Currency on every axios request. Mirrors golafly's
// € EUR selector but now actually drives pricing (Multi-Currency Checkout
// Contract: "One selector, in the header or settings").
/** A nav item's text, opted out of machine translation when the item says so
 *  (see `noTranslate` on NavItem). Google Translate honours
 *  `class="notranslate"` most reliably; `translate="no"` is the standard. */
function NavLabel({ link }: { link: NavItem }) {
  if (!link.noTranslate) return <>{link.label}</>
  return (
    <span translate='no' className='notranslate'>
      {link.label}
    </span>
  )
}

const CURRENCIES = SUPPORTED_CURRENCIES.map((code) => ({
  code,
  symbol: CURRENCY_SYMBOLS[code],
}))

/* ── Shared class recipes ─────────────────────────────────────────── */
const FOCUS_RING =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'

const ICON_BUTTON = cn(
  'inline-flex size-9 shrink-0 items-center justify-center rounded-full text-foreground/75 transition-colors duration-200 hover:bg-muted hover:text-foreground',
  FOCUS_RING,
)

const PICKER_BUTTON = cn(
  'inline-flex h-9 items-center gap-1.5 rounded-full border border-border px-2.5 sm:px-3 text-[13px] font-medium text-foreground/80 transition-colors duration-200 hover:border-foreground/25 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50',
  FOCUS_RING,
)

const POPOVER =
  'rounded-2xl border border-border bg-popover p-1.5 text-popover-foreground shadow-[var(--lift-3)]'

const POPOVER_ITEM =
  'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13.5px] transition-colors duration-150 hover:bg-muted hover:text-foreground focus-visible:bg-muted focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50'

const PRIMARY_PILL =
  'inline-flex items-center justify-center gap-2 rounded-full bg-primary font-semibold text-primary-foreground shadow-[inset_0_0_0_1px_var(--brand-edge)] transition-[filter,scale] duration-200 hover:brightness-95 active:scale-[0.98]'

const SECONDARY_PILL =
  'inline-flex items-center justify-center gap-2 rounded-full border border-foreground/15 font-semibold text-foreground transition-colors duration-200 hover:bg-foreground hover:text-background'

// Human-readable label for a blocked-currency-switch toast. `ServerCartItem`
// is a discriminated union (flight/esim/stays/matchday) with no shared
// "name" field, so this switches on `type` instead of reading a property
// that not every member has.
function cartItemLabel(item?: ServerCartItem): string {
  if (!item) return 'an item'
  switch (item.type) {
    case 'matchday':
      return item.eventName ?? 'a ticket'
    case 'stays':
      return item.hotelName ?? 'a hotel booking'
    case 'flight':
      return 'a flight'
    case 'esim':
      return 'an eSIM'
    default:
      return 'an item'
  }
}

/** The section a route belongs to: its own href, plus any extra prefixes
 *  (Competitions also lights up on /tournament/123 and /international). */
function isActiveLink(pathname: string, link: NavItem): boolean {
  const prefixes = [link.href, ...(link.activePrefixes ?? [])].filter(
    (p): p is string => Boolean(p),
  )
  return prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`))
}

/** Dropdown columns in the order their first child appears; CTAs excluded
 *  (they render in the panel's footer row). */
function groupChildren(items: NavChild[]) {
  const groups: { group?: NavGroup; list: NavChild[] }[] = []
  for (const item of items) {
    if (item.cta) continue
    const existing = groups.find((g) => g.group === item.group)
    if (existing) existing.list.push(item)
    else groups.push({ group: item.group, list: [item] })
  }
  return groups
}

/** Close a small popover on an outside press or Escape (Escape also hands
 *  focus back to its trigger, the first button inside `ref`). A document
 *  listener rather than a full-screen click-catcher: the sticky header uses
 *  backdrop-filter, which makes it the containing block for `fixed`
 *  children, so a `fixed inset-0` overlay would only cover the header. */
function useDismiss(
  open: boolean,
  setOpen: (open: boolean) => void,
  ref: RefObject<HTMLElement | null>,
) {
  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      setOpen(false)
      ref.current?.querySelector('button')?.focus()
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open, setOpen, ref])
}

/* Body-level nodes the open mobile menu never silences: live regions
   (toasts, Next's route announcer), scripts, and the cookie-consent dialog,
   which has to stay answerable whatever else is on screen. */
function staysLive(el: Element) {
  return (
    el.hasAttribute('aria-live') ||
    el.tagName === 'SCRIPT' ||
    el.tagName === 'NEXT-ROUTE-ANNOUNCER' ||
    el.id.startsWith('CybotCookiebot')
  )
}

/** Make the page `inert` everywhere except `keep` (and the path down to each
 *  of them), returning an undo. While the mobile menu is open, the content
 *  under its backdrop drops out of the Tab order and the accessibility tree,
 *  so Tab runs header → menu → header instead of wandering through a page
 *  nobody can see. Nodes added afterwards (the cart drawer, a toast) are
 *  left alone. */
function inertOutside(keep: (Element | null | undefined)[]): () => void {
  const kept = keep.filter((el): el is Element => el != null)
  const changed: Element[] = []
  const walk = (parent: Element) => {
    for (const child of Array.from(parent.children)) {
      if (kept.includes(child)) continue
      if (kept.some((el) => child.contains(el))) walk(child)
      else if (!child.hasAttribute('inert') && !staysLive(child)) {
        child.setAttribute('inert', '')
        changed.push(child)
      }
    }
  }
  walk(document.body)
  return () => {
    for (const el of changed) el.removeAttribute('inert')
  }
}

/** variant='landing' is the landing sites' header (components/landing): the same
 *  logo, language picker, currency picker, theme toggle and cart, but no page
 *  links or menu, and no Sign in button. The default, 'main', is the site's navbar exactly as it was. */
/* variant='summit' is the World Football Summit header (Figma "Summit ·
   Header"): the same navbar with the summit's own menu and the partner
   lockup beside the logo. */
const SUMMIT_NAV_LINKS: NavItem[] = [
  { label: 'Events', href: '/world-football-summit#events' },
  { label: 'Tickets', href: '/world-football-summit#tickets' },
  { label: 'Travel', href: '/world-football-summit#trip' },
  { label: 'Why attend', href: '/world-football-summit#why' },
  { label: 'Help', href: '/help-faqs' },
]

export function Navbar({ variant = 'main' }: { variant?: 'main' | 'landing' | 'summit' } = {}) {
  const landing = variant === 'landing'
  /* The VIP pill shows only while VIP packages are switched on (backend
     flag, features/vip/use-available.ts). */
  const vipOn = useVipAvailable()
  const summit = variant === 'summit'
  const navLinks = landing
    ? []
    : summit
      ? SUMMIT_NAV_LINKS
      : vipOn
        ? NAV_LINKS
        : NAV_LINKS.filter((l) => !l.vip)
  const { resolvedTheme, setTheme } = useTheme()
  const { count, openCart, items, applyServerCart } = useCart()
  const mounted = useHydrated()
  const reduceMotion = useReducedMotion()
  const pathname = usePathname()

  const [menuOpen, setMenuOpen] = useState(false)
  /* Any route change closes the mobile menu, including one started outside
     the panel (the logo, a link in the cart drawer) that the panel's own tap
     handler never sees. Adjusted while rendering, React's pattern for
     resetting state when a value changes: no effect, and nothing left behind
     that could reopen the menu when the visitor later returns to a route. */
  const [menuPath, setMenuPath] = useState(pathname)
  if (menuPath !== pathname) {
    setMenuPath(pathname)
    setMenuOpen(false)
  }
  const [mobileSection, setMobileSection] = useState<string | null>(null)

  /* Mobile-menu focus management (see the effect below): the header stays
     live above the backdrop, the panel takes focus, the hamburger gets it
     back. */
  const navRef = useRef<HTMLElement>(null)
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const menuBackdropRef = useRef<HTMLDivElement>(null)
  const menuPanelRef = useRef<HTMLDivElement>(null)

  /* A desktop dropdown that was just used (link clicked, Escape pressed)
     stays shut until the pointer leaves it or focus moves away, even though
     the pointer is still hovering it. */
  const [closedMenu, setClosedMenu] = useState<string | null>(null)
  /* The desktop dropdown opened from its chevron button. Hover still opens
     a panel on its own; this is the state keyboard and screen-reader users
     drive and hear (aria-expanded). Focus or the pointer leaving the item,
     or Escape, closes it. */
  const [kbdMenu, setKbdMenu] = useState<string | null>(null)
  /* Set the first time the Competitions menu is hovered or focused; its
     teams column only fetches after that. */
  const [competitionsArmed, setCompetitionsArmed] = useState(false)

  const [langOpen, setLangOpen] = useState(false)
  const [currOpen, setCurrOpen] = useState(false)
  const langRef = useRef<HTMLDivElement>(null)
  const currRef = useRef<HTMLDivElement>(null)
  useDismiss(langOpen, setLangOpen, langRef)
  useDismiss(currOpen, setCurrOpen, currRef)

  // Currency to switch to once the confirm dialog (below) is accepted —
  // only set while that dialog is open.
  const [pendingCurrency, setPendingCurrency] =
    useState<SupportedCurrency | null>(null)
  /* Language: whatever the visitor picked this session, else the
     googtrans cookie — read only after hydration so the server and the
     first client render agree on "EN". */
  const [pickedLang, setPickedLang] = useState<LangCode | null>(null)
  const activeLang: LangCode = pickedLang ?? (mounted ? getActiveLang() : 'en')
  const activeLangEntry = LANGS.find((l) => l.code === activeLang)
  // ── Real currency store ─────────────────────────────────────────────
  // Previously this was `useState('EUR')` with a "Display-only for now"
  // comment. Now wired to the persisted useCurrencyStore so:
  //   • The X-Currency header (injected by lib/axios.ts) always reflects
  //     the buyer's choice.
  //   • Switching invalidates React Query cache so every mounted screen
  //     re-fetches prices in the new currency.
  //   • PATCH /api/v1/cart/currency is called when the cart holds items.
  const {
    currency,
    switching: currSwitching,
    setCurrency,
    setSwitching,
  } = useCurrencyStore()
  const queryClient = useQueryClient()

  /* Backs the Competitions/Teams dropdown links (see resolveChildHref
     below). These are the same catalogue calls LiveFixturesSection makes
     for its own filter pills, so react-query serves this from cache
     rather than firing new requests on top of it. */
  const { data: tournaments } = useMatchdayTournaments()
  const { data: teams } = useMatchdayTeams()
  const slugs = useCatalogueSlugs()

  /* A nav child either has a static `href`, or a `matchdayFilter` that
     needs resolving against the live catalogue into a real
     tour_id/team_id, routed to that tournament's or team's page. Falls
     back to the full directory if the catalogue hasn't loaded yet or the
     name doesn't match anything, rather than a dead link. */
  /** Real catalogue id for a matchdayFilter child, or undefined. */
  function resolveChildId(child: NavChild): number | undefined {
    // National teams must match exactly — "England" must not land on
    // "New England Revolution".
    if (child.group === 'National teams' && child.matchdayFilter) {
      const want = child.matchdayFilter.name.toLowerCase()
      return teams?.find((t) => t.name.toLowerCase() === want)?.team_id
    }
    if (child.matchdayFilter?.type === 'tournament')
      return findTournamentIdByName(tournaments, child.matchdayFilter.name)
    if (child.matchdayFilter?.type === 'team')
      return findTeamIdByName(teams, child.matchdayFilter.name)
    return undefined
  }
  /** International links only show when the catalogue really has them. */
  function visibleChildren(children: NavChild[]): NavChild[] {
    const seen = new Set<string>()
    return children.filter((c) => {
      if (!c.hideIfMissing) return true
      const id = resolveChildId(c)
      if (id == null) return false
      const key = `${c.matchdayFilter?.type}:${id}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }

  function resolveChildHref(child: NavChild): string {
    if (child.href) return child.href
    if (child.matchdayFilter?.type === 'tournament') {
      const id = resolveChildId(child)
      // Fall back to the full tournament directory (not a bare, unfiltered
      // /matches) so a name that doesn't match today's live catalogue still
      // lands somewhere useful instead of a dead end.
      return id ? slugs.tournamentPath(id) : '/tournaments'
    }
    if (child.matchdayFilter?.type === 'team') {
      const id = resolveChildId(child)
      return id ? slugs.teamPath(id) : '/teams'
    }
    return '/matches'
  }

  /* One pass per render for both the desktop dropdowns and the mobile
     accordion. */
  const visibleByLabel: Record<string, NavChild[]> = {}
  for (const link of navLinks)
    visibleByLabel[link.label] = link.children
      ? visibleChildren(link.children)
      : []

  /* Gated on `mounted` for the same reason the theme toggle is: the fan
     session lives in a cookie, and reading it during render would have the
     server emit "Sign in" while the client emits "My Golafly" — a hydration
     mismatch on the one component present on every marketing page. */
  const { isAuthenticated, hydrate } = useFanAuth()
  useEffect(() => {
    hydrate()
  }, [hydrate])
  const fanSignedIn = mounted && isAuthenticated
  const accountHref = fanSignedIn ? Routes.dashboard : Routes.login
  const accountLabel = fanSignedIn ? 'My Golafly' : 'Sign in'

  /* Mobile menu open: lock page scroll, make the page under the backdrop
     inert, move focus to the menu's first link, close on Escape or
     back/forward (even between two URLs of the same path), and close if the
     viewport grows into the desktop layout (the panel is lg:hidden).
     The header is kept live on purpose: it sits above the backdrop and its
     X is the menu's close button, so Tab cycles header → menu. On close,
     focus returns to the hamburger, unless the visitor already moved it
     somewhere outside the menu (the logo, the header's cart button). */
  useEffect(() => {
    if (!menuOpen) return
    const panel = menuPanelRef.current
    const trigger = menuButtonRef.current
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const restoreInert = inertOutside([
      navRef.current?.closest('header') ?? navRef.current,
      menuBackdropRef.current,
      panel,
    ])
    panel
      ?.querySelector<HTMLElement>('a[href], button:not([disabled])')
      ?.focus({ preventScroll: true })

    const close = () => setMenuOpen(false)
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    const desktop = window.matchMedia('(min-width: 1024px)')
    const onViewport = () => {
      if (desktop.matches) close()
    }
    document.addEventListener('keydown', onKeyDown)
    window.addEventListener('popstate', close)
    desktop.addEventListener('change', onViewport)
    return () => {
      document.body.style.overflow = previousOverflow
      restoreInert()
      document.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('popstate', close)
      desktop.removeEventListener('change', onViewport)
      // The panel is still mounted here (it animates out), so a link or
      // button inside it can still hold focus.
      const active = document.activeElement
      if (!active || active === document.body || panel?.contains(active))
        trigger?.focus({ preventScroll: true })
    }
  }, [menuOpen])

  const isDark = mounted && resolvedTheme === 'dark'
  const toggleTheme = () => {
    if (!mounted) return
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
  }
  /* The store is persisted in localStorage, which the server can't see:
     show the default until hydrated so both renders agree. */
  const shownCurrency = mounted ? currency : DEFAULT_CURRENCY
  const activeCurrency =
    CURRENCIES.find((c) => c.code === shownCurrency) ?? CURRENCIES[0]
  // Multi-Currency Checkout Contract: "Absent from checkout onwards.
  // Once they're filling the form, the currency is settled." Covers the
  // shared-cart pay screen and the direct-ticket checkout, plus their
  // confirmation pages — anywhere a form is mid-fill or a payment has
  // already been kicked off.
  const hideCurrencyPicker = Boolean(
    pathname &&
    /^\/builder\/(pay|checkout|checkout-tickets|confirmed)(\/|$)/.test(
      pathname,
    ),
  )

  // ── Currency switch handler ──────────────────────────────────────────
  // Backend dev's rules (this supersedes the earlier fire-and-forget
  // version, which switched the store immediately and swallowed any
  // 422 — the cart could silently sit stale in the old currency):
  //   1. Confirm first if the cart has items, since prices are re-quoted
  //      per item and one may move. This used to be a native
  //      `window.confirm`; it's now the CurrencySwitchDialog below so it
  //      matches the rest of the app instead of a browser-chrome popup.
  //   2. PATCH /cart/currency; on success re-render from the response.
  //   3. On 422 (all-or-nothing — cart untouched), surface which item(s)
  //      blocked it rather than pretending the switch worked.
  function handleCurrencyChange(next: SupportedCurrency) {
    if (next === currency || currSwitching) return

    setCurrOpen(false)

    if (items.length > 0) {
      setPendingCurrency(next)
      return
    }

    void performCurrencyChange(next)
  }

  async function performCurrencyChange(next: SupportedCurrency) {
    setSwitching(true)
    setCurrency(next)

    try {
      const result = await syncCartCurrency(next)
      if (result.status === 'ok') {
        applyServerCart(result.cart)
      } else if (result.status === 'blocked') {
        // Cart stayed in its previous currency — only the header/browsing
        // prices reflect `next` until the blocking item is removed.
        applyServerCart(result.cart)
        const names =
          result.blockedItems.map((b) => cartItemLabel(b.item)).join(', ') ||
          'an item'
        toast.error(
          `Couldn't move ${names} to ${next}. Remove it from your cart to switch currency, or check out in the current currency.`,
        )
      } else if (result.status === 'error') {
        toast.error(result.message)
      }
      // 'noop' — empty cart, nothing further to reconcile.
    } finally {
      // Invalidate every cached MatchDay query so the new prices are
      // fetched. We invalidate broadly: events, listings, tournaments,
      // teams, venues — any screen the buyer has open will re-fetch.
      await queryClient.invalidateQueries()
      setSwitching(false)
    }
  }

  /** After a dropdown link is used: close the panel, drop focus (it would
   *  otherwise sit on a link in the now-hidden panel) and keep the panel
   *  shut while the pointer is still on it. */
  function dismissDropdown(label: string) {
    const el = document.activeElement
    if (el instanceof HTMLElement) el.blur()
    setKbdMenu(null)
    setClosedMenu(label)
  }

  const popoverMotion = reduceMotion
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        initial: { opacity: 0, y: -6, scale: 0.98 },
        animate: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, y: -4, scale: 0.98 },
      }

  return (
    <>
      <nav
        ref={navRef}
        aria-label='Main'
        className='flex h-16 w-full items-center gap-3'
      >
        {/* ── Brand ── full lockup; the ticket alone on very narrow phones
            so it never crowds the cart and menu buttons. Tapping it closes
            the mobile menu even when it's a tap to the page you're on. */}
        <Link
          href='/'
          aria-label='Golafly Matchday — home'
          onClick={() => setMenuOpen(false)}
          className={cn(
            'flex shrink-0 items-center rounded-md transition-opacity duration-200 hover:opacity-80',
            FOCUS_RING,
            'focus-visible:outline-offset-4',
          )}
        >
          {summit ? (
            <SummitGolaflyLogo className='h-10 lg:h-12' />
          ) : (
            <>
              {/* 30 px tall (not 34) below 400 px: at 34 px the logo plus the
                  currency, language, cart and menu buttons needed 372 px, so
                  360 px phones scrolled sideways. */}
              <MatchdayLogo
                size='sm'
                className='max-[359px]:hidden max-[399px]:[--md-h:30px] lg:[--md-h:40px]'
              />
              <MatchdayLogo
                variant='icon'
                size='sm'
                className='hidden max-[359px]:inline-flex'
              />
            </>
          )}
        </Link>

        {summit && (
          <span className='ml-3 hidden items-center gap-3 sm:flex'>
            <span aria-hidden className='h-7 w-px bg-border' />
            <span className='flex flex-col gap-0.5 leading-[normal]'>
              <span className='font-mono text-[9.5px] font-medium uppercase tracking-[1.14px] text-muted-foreground'>
                Official travel partner
              </span>
              <span translate='no' className='notranslate font-heading text-[14px] font-bold text-foreground'>
                World Football Summit
              </span>
            </span>
          </span>
        )}

        {/* ── Desktop links ── */}
        <ul className='ml-4 hidden h-full items-center gap-0.5 lg:flex xl:ml-8'>
          {/* topBar links (Help) live in the EcosystemBar on desktop. */}
          {navLinks.filter((link) => !link.topBar).map((link) => {
            const active = isActiveLink(pathname, link)
            const linkClass = cn(
              'relative inline-flex h-9 items-center gap-1 whitespace-nowrap rounded-full px-2.5 text-[14px] font-medium transition-colors duration-200 xl:px-3.5',
              FOCUS_RING,
              // 2px neon bar resting on the navbar's bottom hairline
              'after:pointer-events-none after:absolute after:inset-x-2.5 after:-bottom-3.5 after:h-0.5 after:rounded-full after:bg-primary after:transition-transform after:duration-200 xl:after:inset-x-3.5',
              active
                ? 'text-foreground after:scale-x-100'
                : 'text-foreground/75 after:scale-x-0 hover:text-foreground',
            )

            /* Figma "Nav · VIP": 36px gold-tinted pill, 13px crown, 14px
               semibold gold label. Light theme gets a darker gold label —
               the Figma gold (#f0d79b) is unreadable on a white navbar. */
            if (link.vip) {
              return (
                <li key={link.label} className='flex h-full items-center pl-1'>
                  <Link
                    href={link.href ?? '/'}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'inline-flex h-9 items-center gap-1.5 whitespace-nowrap rounded-full border border-[rgba(212,178,106,0.55)] bg-[rgba(212,178,106,0.12)] px-3 text-[14px] font-semibold leading-[normal] text-[#7a5a14] transition-colors duration-200 hover:bg-[rgba(212,178,106,0.2)] dark:text-[#f0d79b]',
                      FOCUS_RING,
                    )}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src='/figma/vip/crown.svg' alt='' width={13} height={13} className='size-[13px] shrink-0' />
                    <NavLabel link={link} />
                  </Link>
                </li>
              )
            }

            if (!link.children) {
              return (
                <li key={link.label} className='flex h-full items-center'>
                  <Link
                    href={link.href ?? '/'}
                    aria-current={active ? 'page' : undefined}
                    className={linkClass}
                  >
                    <NavLabel link={link} />
                  </Link>
                </li>
              )
            }

            // `open`: hover may show the panel. `expanded`: the chevron
            // button opened it (the only way in from the keyboard, so Tab
            // walks past a closed menu instead of through every link).
            const open = closedMenu !== link.label
            const expanded = kbdMenu === link.label
            const menuId = `nav-menu-${link.label.toLowerCase().replace(/\s+/g, '-')}`
            const children = visibleByLabel[link.label] ?? []
            return (
              <li
                key={link.label}
                className='group relative flex h-full items-center'
                onMouseEnter={() => {
                  if (link.label === COMPETITIONS_LABEL) setCompetitionsArmed(true)
                }}
                onFocus={() => {
                  if (link.label === COMPETITIONS_LABEL) setCompetitionsArmed(true)
                }}
                onMouseLeave={() => {
                  if (closedMenu === link.label) setClosedMenu(null)
                  if (expanded) setKbdMenu(null)
                }}
                onBlur={(e) => {
                  if (e.currentTarget.contains(e.relatedTarget as Node | null))
                    return
                  if (closedMenu === link.label) setClosedMenu(null)
                  if (expanded) setKbdMenu(null)
                }}
                onKeyDown={(e) => {
                  if (e.key !== 'Escape') return
                  setClosedMenu(link.label)
                  setKbdMenu(null)
                  // Focus inside the panel would be left on a hidden link.
                  if (
                    document
                      .getElementById(menuId)
                      ?.contains(e.target as Node | null)
                  )
                    e.currentTarget.querySelector('button')?.focus()
                }}
              >
                {/* Tighter right padding (and underline inset): the chevron
                    button below sits right after the label. */}
                <Link
                  href={link.href ?? '/'}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    linkClass,
                    'pr-1 after:right-1 xl:pr-1.5 xl:after:right-1.5',
                  )}
                  onClick={() => dismissDropdown(link.label)}
                >
                  <NavLabel link={link} />
                </Link>
                <button
                  type='button'
                  aria-expanded={expanded}
                  aria-controls={menuId}
                  aria-label={`${expanded ? 'Hide' : 'Show'} ${link.label.toLowerCase()} menu`}
                  onClick={() => {
                    setKbdMenu(expanded ? null : link.label)
                    // Closing with the pointer still on the item: keep hover
                    // from holding the panel open.
                    setClosedMenu(expanded ? link.label : null)
                  }}
                  className={cn(
                    'inline-flex h-9 w-5 shrink-0 items-center justify-center rounded-full transition-colors duration-200',
                    FOCUS_RING,
                    active
                      ? 'text-foreground'
                      : 'text-foreground/75 hover:text-foreground',
                  )}
                >
                  <ChevronDown
                    aria-hidden
                    className={cn(
                      'size-3.5 opacity-60 transition-transform duration-200',
                      expanded ? 'rotate-180' : open && 'group-hover:rotate-180',
                    )}
                    strokeWidth={2}
                  />
                </button>

                {/* pt-2 is a transparent hover bridge between the bar and
                    the panel, so moving the pointer down never drops it. */}
                <div
                  id={menuId}
                  className={cn(
                    'invisible absolute top-full z-50 translate-y-1 pt-2 opacity-0 transition-[opacity,translate,visibility] duration-200 motion-reduce:transition-none',
                    // Competitions is ~36rem wide: open it from the left edge
                    // of its label so it can't clip on narrow windows.
                    link.label === COMPETITIONS_LABEL
                      ? 'left-0'
                      : 'left-1/2 -translate-x-1/2',
                    expanded
                      ? 'visible translate-y-0 opacity-100'
                      : open &&
                          'group-hover:visible group-hover:translate-y-0 group-hover:opacity-100',
                  )}
                >
                  {link.label === COMPETITIONS_LABEL ? (
                    <CompetitionsPanel
                      items={children}
                      hrefOf={resolveChildHref}
                      idOf={resolveChildId}
                      armed={competitionsArmed}
                      onNavigate={() => dismissDropdown(link.label)}
                    />
                  ) : (
                    <DropdownPanel
                      items={children}
                      hrefOf={resolveChildHref}
                      onNavigate={() => dismissDropdown(link.label)}
                    />
                  )}
                </div>
              </li>
            )
          })}
        </ul>

        {/* ── Right section ── */}
        <div className='ml-auto flex shrink-0 items-center gap-1 xl:gap-1.5'>
          {/* Currency selector — every breakpoint (symbol only on phones).
              Disabled while a switch is in flight (currSwitching) to prevent
              rapid switching producing interleaved stale results.
              Multi-Currency Checkout Contract: "Absent from checkout onwards"
              is enforced by hiding the selector on /builder/checkout, /builder/pay,
              etc. — add a pathname guard here if you add those routes. */}
          {!hideCurrencyPicker && (
            <div ref={currRef} className='relative shrink-0'>
              <button
                type='button'
                onClick={() => {
                  if (currSwitching) return
                  setCurrOpen((o) => !o)
                  setLangOpen(false)
                }}
                disabled={currSwitching}
                aria-label={`Select currency (current: ${activeCurrency.code})`}
                aria-expanded={currOpen}
                aria-controls='navbar-currency-menu'
                className={cn(PICKER_BUTTON, 'shrink-0 whitespace-nowrap px-2.5 sm:px-3')}
              >
                <span
                  translate='no'
                  className='notranslate hidden tabular-nums sm:inline'
                >
                  {activeCurrency.symbol} {activeCurrency.code}
                </span>
                <span translate='no' className='notranslate sm:hidden'>
                  {activeCurrency.symbol}
                </span>
                <ChevronDown
                  aria-hidden
                  className={cn(
                    'size-3.5 opacity-60 transition-transform duration-200',
                    currOpen && 'rotate-180',
                  )}
                  strokeWidth={2}
                />
              </button>
              <AnimatePresence>
                {currOpen && (
                  <motion.div
                    id='navbar-currency-menu'
                    className={cn(
                      POPOVER,
                      'notranslate absolute right-0 top-full z-50 mt-2 w-40 origin-top-right',
                    )}
                    translate='no'
                    {...popoverMotion}
                    transition={{ duration: 0.16 }}
                  >
                    {CURRENCIES.map((c) => {
                      const selected = shownCurrency === c.code
                      return (
                        <button
                          key={c.code}
                          type='button'
                          onClick={() => handleCurrencyChange(c.code)}
                          disabled={currSwitching}
                          aria-current={selected ? 'true' : undefined}
                          className={cn(
                            POPOVER_ITEM,
                            selected
                              ? 'font-semibold text-foreground'
                              : 'text-foreground/80',
                          )}
                        >
                          <span className='w-4 text-muted-foreground'>
                            {c.symbol}
                          </span>
                          <span>{c.code}</span>
                          {currSwitching && selected ? (
                            <span className='ml-auto text-[11px] text-muted-foreground'>
                              …
                            </span>
                          ) : selected ? (
                            <Check
                              aria-hidden
                              className='ml-auto size-4 text-brand-text'
                              strokeWidth={2.25}
                            />
                          ) : null}
                        </button>
                      )
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Currency switch confirmation — replaces the old window.confirm() */}
          <CurrencySwitchDialog
            open={pendingCurrency !== null}
            fromLabel={currency}
            toLabel={pendingCurrency ?? currency}
            itemCount={items.length}
            onOpenChange={(open) => {
              if (!open) setPendingCurrency(null)
            }}
            onConfirm={() => {
              if (pendingCurrency) void performCurrencyChange(pendingCurrency)
              setPendingCurrency(null)
            }}
          />

          {/* Language selector — every breakpoint, main site and landing sites
              (flag only on phones). */}
          <div
            ref={langRef}
            className='relative shrink-0'
          >
            <button
              type='button'
              onClick={() => {
                setLangOpen((o) => !o)
                setCurrOpen(false)
              }}
              aria-label={`Select language (current: ${activeLangEntry?.label ?? 'English'})`}
              aria-expanded={langOpen}
              aria-controls='navbar-language-menu'
              className={cn(PICKER_BUTTON, 'shrink-0 whitespace-nowrap')}
            >
              <span aria-hidden className='flex items-center text-[14px] leading-none'>
                {activeLangEntry ? (
                  <Flag code={activeLangEntry.flag} />
                ) : (
                  <Globe className='size-3.5' />
                )}
              </span>
              <span translate='no' className='notranslate max-sm:hidden'>
                {activeLang === 'zh-CN' ? 'ZH' : activeLang.toUpperCase()}
              </span>
              <ChevronDown
                aria-hidden
                className={cn(
                  'size-3.5 opacity-60 transition-transform duration-200',
                  langOpen && 'rotate-180',
                )}
                strokeWidth={2}
              />
            </button>

            <AnimatePresence>
              {langOpen && (
                <motion.div
                  id='navbar-language-menu'
                  className={cn(
                    POPOVER,
                    'notranslate absolute right-0 top-full z-50 mt-2 w-52 origin-top-right',
                  )}
                  {...popoverMotion}
                  transition={{ duration: 0.16 }}
                >
                  <div
                    translate='no'
                    className='max-h-80 overflow-y-auto overscroll-contain'
                  >
                    {LANGS.map((lang) => {
                      const selected = activeLang === lang.code
                      return (
                        <button
                          key={lang.code}
                          type='button'
                          onClick={() => {
                            setPickedLang(lang.code)
                            setGoogleTranslateLanguage(lang.code)
                            setLangOpen(false)
                          }}
                          aria-current={selected ? 'true' : undefined}
                          className={cn(
                            POPOVER_ITEM,
                            selected
                              ? 'font-semibold text-foreground'
                              : 'text-foreground/80',
                          )}
                        >
                          <Flag code={lang.flag} />
                          <span>{lang.label}</span>
                          {selected && (
                            <Check
                              aria-hidden
                              className='ml-auto size-4 text-brand-text'
                              strokeWidth={2.25}
                            />
                          )}
                        </button>
                      )
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Theme toggle — from sm up; phones get it in the menu */}
          <button
            type='button'
            onClick={toggleTheme}
            className={cn(ICON_BUTTON, 'hidden sm:inline-flex')}
            aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
          >
            {isDark ? (
              <Sun aria-hidden className='size-[18px]' strokeWidth={1.75} />
            ) : (
              <Moon aria-hidden className='size-[18px]' strokeWidth={1.75} />
            )}
          </button>

          {/* Cart */}
          <CartButton
            className={cn(
              'size-9 border-transparent p-0 text-foreground/75 hover:bg-muted hover:text-foreground dark:hover:bg-muted',
              FOCUS_RING,
            )}
          />

          {/* Account — desktop. Real now: /login for a visitor, /dashboard for
              a signed-in fan. The label is decided AFTER mount, because the
              session lives in a cookie and reading it during render makes the
              server say "Sign in" while the client says "My Golafly". */}
          {!landing && (
            <span aria-hidden className='mx-1.5 hidden h-5 w-px bg-border lg:block' />
          )}
          {!landing && (
            <Link
              href={accountHref}
              className={cn(
                PRIMARY_PILL,
                'hidden h-10 shrink-0 whitespace-nowrap px-4 text-[14px] lg:inline-flex xl:px-5',
                FOCUS_RING,
              )}
            >
              {accountLabel}
            </Link>
          )}

          {/* Hamburger — below lg */}
          <button
            ref={menuButtonRef}
            type='button'
            onClick={() => setMenuOpen(!menuOpen)}
            className={cn(ICON_BUTTON, 'text-foreground lg:hidden', landing && 'hidden')}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-haspopup='dialog'
            aria-expanded={menuOpen}
            aria-controls='mobile-menu'
          >
            {menuOpen ? (
              <X aria-hidden className='size-5' strokeWidth={1.75} />
            ) : (
              <Menu aria-hidden className='size-5' strokeWidth={1.75} />
            )}
          </button>
        </div>
      </nav>

      {/* ── Mobile menu ──
          Portalled to <body>: the sticky header's backdrop-filter would
          otherwise turn it into the containing block of these `fixed`
          layers, shrinking the backdrop to the header's own box. */}
      {mounted &&
        createPortal(
          <AnimatePresence>
            {menuOpen && (
              <>
                {/* Backdrop — under the header (z-50), so the X stays usable */}
                <motion.div
                  ref={menuBackdropRef}
                  aria-hidden
                  className='fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] lg:hidden'
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => setMenuOpen(false)}
                />

                {/* Panel — a dialog, but deliberately not aria-modal: the
                    header above the backdrop stays operable (its X closes
                    the menu), and everything else is made inert instead. */}
                <motion.div
                  ref={menuPanelRef}
                  id='mobile-menu'
                  role='dialog'
                  aria-label='Menu'
                  className='fixed inset-x-3 top-[72px] z-50 max-h-[calc(100dvh-84px)] overflow-y-auto overscroll-contain rounded-2xl border border-border bg-popover text-popover-foreground shadow-[var(--lift-3)] lg:hidden'
                  initial={
                    reduceMotion
                      ? { opacity: 0 }
                      : { opacity: 0, y: -12, scale: 0.98 }
                  }
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={
                    reduceMotion
                      ? { opacity: 0 }
                      : { opacity: 0, y: -8, scale: 0.98 }
                  }
                  transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                  /* Any link tap closes the menu — including one to the
                     page you're already on, which changes no route. */
                  onClick={(e) => {
                    if ((e.target as HTMLElement).closest('a')) setMenuOpen(false)
                  }}
                >
                  {/* Close row: the panel can sit over the header (taller now with
                      the reseller notice / Black Friday bar) and hide its X, so
                      the panel carries its own way out. */}
                  <div className='flex items-center justify-between border-b border-border py-1.5 pl-5 pr-2'>
                    <span className='font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground'>
                      Menu
                    </span>
                    <button
                      type='button'
                      onClick={() => {
                        setMenuOpen(false)
                        menuButtonRef.current?.focus()
                      }}
                      aria-label='Close menu'
                      className={cn(ICON_BUTTON, 'text-foreground')}
                    >
                      <X aria-hidden className='size-5' strokeWidth={1.75} />
                    </button>
                  </div>

                  {/* Main links */}
                  <nav aria-label='Site' className='p-2'>
                    <ul className='flex flex-col'>
                      {navLinks.map((link) => {
                        const active = isActiveLink(pathname, link)
                        const rowClass = cn(
                          'flex h-12 flex-1 items-center gap-2.5 rounded-xl px-3 text-[15px] font-medium transition-colors duration-150 hover:bg-muted',
                          FOCUS_RING,
                          'focus-visible:-outline-offset-2',
                          active ? 'text-foreground' : 'text-foreground/80',
                        )
                        const activeDot = active && (
                          <span
                            aria-hidden
                            className='size-1.5 rounded-full bg-primary ring-1 ring-brand-edge'
                          />
                        )

                        if (!link.children) {
                          return (
                            <li key={link.label} className='flex'>
                              <Link
                                href={link.href ?? '/'}
                                aria-current={active ? 'page' : undefined}
                                className={cn(
                                  rowClass,
                                  link.vip && 'font-semibold text-[#7a5a14] dark:text-[#f0d79b]',
                                )}
                              >
                                {link.vip && (
                                  /* eslint-disable-next-line @next/next/no-img-element */
                                  <img src='/figma/vip/crown.svg' alt='' width={13} height={13} className='size-[13px] shrink-0' />
                                )}
                                <NavLabel link={link} />
                                {activeDot}
                              </Link>
                            </li>
                          )
                        }

                        const expanded = mobileSection === link.label
                        const panelId = `mobile-menu-${link.label.toLowerCase().replace(/\s+/g, '-')}`
                        const children = visibleByLabel[link.label] ?? []
                        const groups = groupChildren(children)
                        const ctas = children.filter((c) => c.cta)
                        return (
                          <li key={link.label}>
                            <div className='flex items-center gap-1'>
                              <Link
                                href={link.href ?? '/'}
                                aria-current={active ? 'page' : undefined}
                                className={rowClass}
                              >
                                <NavLabel link={link} />
                                {activeDot}
                              </Link>
                              <button
                                type='button'
                                onClick={() =>
                                  setMobileSection(expanded ? null : link.label)
                                }
                                aria-expanded={expanded}
                                aria-controls={panelId}
                                aria-label={`${expanded ? 'Hide' : 'Show'} ${link.label.toLowerCase()}`}
                                className={cn(
                                  'inline-flex size-12 shrink-0 items-center justify-center rounded-xl text-foreground/70 transition-colors duration-150 hover:bg-muted hover:text-foreground',
                                  FOCUS_RING,
                                  'focus-visible:-outline-offset-2',
                                )}
                              >
                                <ChevronDown
                                  aria-hidden
                                  className={cn(
                                    'size-4 transition-transform duration-200',
                                    expanded && 'rotate-180',
                                  )}
                                  strokeWidth={2}
                                />
                              </button>
                            </div>

                            <AnimatePresence initial={false}>
                              {expanded && (
                                <motion.div
                                  id={panelId}
                                  className='overflow-hidden'
                                  initial={
                                    reduceMotion
                                      ? { opacity: 0 }
                                      : { height: 0, opacity: 0 }
                                  }
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={
                                    reduceMotion
                                      ? { opacity: 0 }
                                      : { height: 0, opacity: 0 }
                                  }
                                  transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                                >
                                  <div className='space-y-4 px-3 pb-4 pt-1'>
                                    {groups.map(({ group, list }) => (
                                      <div key={group ?? 'links'}>
                                        {group && (
                                          <p className='mb-1 font-mono text-[10.5px] font-medium uppercase tracking-[0.2em] text-muted-foreground'>
                                            {group}
                                          </p>
                                        )}
                                        <ul className='grid grid-cols-2 gap-x-4'>
                                          {list.map((child) => (
                                            <li key={child.label} className='min-w-0'>
                                              <Link
                                                href={resolveChildHref(child)}
                                                className={cn(
                                                  'flex min-h-10 items-center gap-2 rounded-md py-2 text-[14px] text-foreground/80 transition-colors hover:text-foreground',
                                                  FOCUS_RING,
                                                )}
                                              >
                                                {child.star && (
                                                  <Star
                                                    aria-hidden
                                                    className='size-3.5 shrink-0 fill-primary text-brand-text'
                                                  />
                                                )}
                                                <span className='truncate'>{child.label}</span>
                                              </Link>
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                    ))}
                                    {ctas.length > 0 && (
                                      <div className='flex flex-wrap gap-2 pt-1'>
                                        {ctas.map((cta) => (
                                          <Link
                                            key={cta.label}
                                            href={resolveChildHref(cta)}
                                            className={cn(
                                              SECONDARY_PILL,
                                              'h-9 px-4 text-[13px]',
                                              FOCUS_RING,
                                            )}
                                          >
                                            {cta.label}
                                            <ArrowRight aria-hidden className='size-3.5' />
                                          </Link>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </li>
                        )
                      })}
                    </ul>
                  </nav>

                  {/* Account, cart, theme */}
                  <div className='grid grid-cols-2 gap-2 border-t border-border p-4'>
                    <Link
                      href={accountHref}
                      className={cn(
                        PRIMARY_PILL,
                        'col-span-2 h-12 text-[15px]',
                        FOCUS_RING,
                      )}
                    >
                      {accountLabel}
                    </Link>
                    <button
                      type='button'
                      className={cn(SECONDARY_PILL, 'h-11 text-[14px]', FOCUS_RING)}
                      onClick={() => {
                        setMenuOpen(false)
                        openCart()
                      }}
                    >
                      <ShoppingCart aria-hidden className='size-4' strokeWidth={1.75} />
                      Cart{count > 0 ? ` (${count})` : ''}
                    </button>
                    <button
                      type='button'
                      onClick={toggleTheme}
                      className={cn(SECONDARY_PILL, 'h-11 text-[14px]', FOCUS_RING)}
                      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
                    >
                      {isDark ? (
                        <>
                          <Sun aria-hidden className='size-4' strokeWidth={1.75} />
                          Light
                        </>
                      ) : (
                        <>
                          <Moon aria-hidden className='size-4' strokeWidth={1.75} />
                          Dark
                        </>
                      )}
                    </button>
                  </div>

                  {/* Golafly family */}
                  <section
                    aria-labelledby='mobile-menu-family'
                    className='mx-3 mb-3 rounded-2xl bg-band-ink p-4 text-band-ink-fg ring-1 ring-band-ink-border'
                  >
                    <p
                      id='mobile-menu-family'
                      className='flex items-center gap-2 font-mono text-[10.5px] font-medium uppercase tracking-[0.22em] text-primary'
                    >
                      <span aria-hidden className='size-1.5 rounded-full bg-primary' />
                      Golafly family
                    </p>
                    <ul className='mt-2 space-y-0.5'>
                      {GOLAFLY_PRODUCTS.map((product) => (
                        <li key={product.key}>
                          <FamilyRow product={product} />
                        </li>
                      ))}
                    </ul>
                    <a
                      href={CONTACT.whatsapp}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='mt-3 flex items-center gap-3 rounded-xl border border-band-ink-border px-3.5 py-3 transition-colors duration-150 hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary'
                    >
                      <IconWhatsApp className='size-5 text-primary' />
                      <span className='min-w-0 flex-1'>
                        <span className='block text-[14px] font-medium text-band-ink-fg'>
                          Chat on WhatsApp
                        </span>
                        <span className='block text-[12.5px] tabular-nums text-band-ink-muted'>
                          {CONTACT.phone}
                        </span>
                      </span>
                      <ArrowUpRight aria-hidden className='size-4 text-band-ink-muted' />
                      <span className='sr-only'>(opens in a new tab)</span>
                    </a>
                  </section>
                </motion.div>
              </>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  )
}

/* Desktop dropdown: mono-labelled columns (a group with more than seven
   links splits into two), then a footer row with the "All …" links. */
function DropdownPanel({
  items,
  hrefOf,
  onNavigate,
}: {
  items: NavChild[]
  hrefOf: (c: NavChild) => string
  onNavigate: () => void
}) {
  const groups = groupChildren(items)
  const ctas = items.filter((c) => c.cta)

  return (
    <div className='overflow-hidden rounded-2xl border border-border bg-popover text-popover-foreground shadow-[var(--lift-3)]'>
      <div className='flex divide-x divide-border p-2'>
        {groups.map(({ group, list }) => {
          const twoColumns = list.length > 7
          return (
            <div key={group ?? 'links'} className='px-2 first:pl-0 last:pr-0'>
              {group && (
                <p className='px-3 pb-1 pt-2 font-mono text-[10.5px] font-medium uppercase tracking-[0.2em] text-muted-foreground'>
                  {group}
                </p>
              )}
              <ul
                className={cn(
                  'grid',
                  twoColumns ? 'w-[21rem] grid-cols-2' : 'w-48',
                )}
              >
                {list.map((child) => (
                  <li key={child.label} className='min-w-0'>
                    <Link
                      href={hrefOf(child)}
                      onClick={onNavigate}
                      className={cn(POPOVER_ITEM, 'text-[14px] text-foreground/80')}
                    >
                      {child.star && (
                        <Star
                          aria-hidden
                          className='size-3.5 shrink-0 fill-primary text-brand-text'
                        />
                      )}
                      <span className='truncate'>{child.label}</span>
                      {child.badge && (
                        <span className='ml-auto rounded-full bg-primary px-1.5 py-px text-[9.5px] font-bold uppercase tracking-[0.12em] text-primary-foreground shadow-[inset_0_0_0_1px_var(--brand-edge)]'>
                          {child.badge}
                        </span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </div>

      {ctas.length > 0 && (
        <div className='flex items-center gap-1 border-t border-border bg-muted/50 px-2 py-1.5'>
          {ctas.map((cta) => (
            <Link
              key={cta.label}
              href={hrefOf(cta)}
              onClick={onNavigate}
              className={cn(
                'group/cta inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-[13.5px] font-semibold text-foreground transition-colors duration-200 hover:bg-foreground hover:text-background',
                FOCUS_RING,
                'focus-visible:-outline-offset-2',
              )}
            >
              {cta.label}
              <ArrowRight
                aria-hidden
                className='size-3.5 transition-transform duration-200 group-hover/cta:translate-x-0.5'
              />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

/* One Golafly product in the mobile menu's ink block. Matchday is where
   you are; Academy isn't live yet (chip, no link); Travel opens its own
   site. */
function FamilyRow({ product }: { product: GolaflyProduct }) {
  const rowClass =
    'flex items-center gap-3 rounded-xl px-2 py-2.5 transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary'
  const text = (
    <span className='min-w-0 flex-1'>
      <span className='block text-[14px] font-medium text-band-ink-fg'>
        {product.fullName}
      </span>
      <span className='mt-0.5 block truncate text-[12.5px] text-band-ink-muted'>
        {product.tagline}
      </span>
    </span>
  )

  if (product.key === 'matchday') {
    return (
      <Link href='/' aria-current='true' className={cn(rowClass, 'hover:bg-white/5')}>
        {text}
        <span className='shrink-0 rounded-full bg-primary px-2 py-0.5 font-mono text-[9.5px] font-semibold uppercase tracking-[0.14em] text-primary-foreground'>
          You&rsquo;re here
        </span>
      </Link>
    )
  }

  if (!product.href) {
    return (
      <div className={rowClass}>
        {text}
        <span className='shrink-0 rounded-full bg-primary/10 px-2 py-0.5 font-mono text-[9.5px] font-medium uppercase tracking-[0.14em] text-primary ring-1 ring-primary/25'>
          Soon
        </span>
      </div>
    )
  }

  if (product.external) {
    return (
      <a
        href={product.href}
        target='_blank'
        rel='noopener noreferrer'
        className={cn(rowClass, 'hover:bg-white/5')}
      >
        {text}
        <ArrowUpRight aria-hidden className='size-4 shrink-0 text-band-ink-muted' />
        <span className='sr-only'>(opens in a new tab)</span>
      </a>
    )
  }

  return (
    <Link href={product.href} className={cn(rowClass, 'hover:bg-white/5')}>
      {text}
      {product.badge === 'new' && (
        <span className='shrink-0 rounded-full bg-primary px-2 py-0.5 font-mono text-[9.5px] font-semibold uppercase tracking-[0.14em] text-primary-foreground'>
          New
        </span>
      )}
      <ArrowRight aria-hidden className='size-4 shrink-0 text-band-ink-muted' />
    </Link>
  )
}
