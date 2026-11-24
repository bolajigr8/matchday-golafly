'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { Download, Share, X } from 'lucide-react'
import { currentSiteKey } from '@/lib/site-runtime'

/* "Install Golafly Matchday" banner.
 *
 * Android / desktop Chrome: uses the browser's own install prompt
 * (beforeinstallprompt). iOS Safari has no such event, so it gets a short
 * "Share → Add to Home Screen" hint instead.
 *
 * Kept out of the way on purpose:
 *   - only golafly.com (never a landing hostname);
 *   - never in the booking flow or a signed-in area;
 *   - waits 30 s, and for the cookie banner to be answered, so it does not
 *     pile on top of Cookiebot or the exit-intent popup;
 *   - never when the app is already installed;
 *   - once dismissed, it stays away for 30 days. */

const DISMISS_KEY = 'gf-pwa-dismissed'
const DISMISS_DAYS = 30
const DELAY_MS = 30_000

const HIDDEN_PREFIXES = [
  '/builder',
  '/cart',
  '/payment-',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/admin',
  '/fan',
  '/player',
  '/scout',
  '/studio',
  '/flights',
]

type InstallEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

function recentlyDismissed(): boolean {
  try {
    const at = Number(window.localStorage.getItem(DISMISS_KEY))
    return Boolean(at) && Date.now() - at < DISMISS_DAYS * 86_400_000
  } catch {
    return false
  }
}

function isInstalled(): boolean {
  const nav = window.navigator as Navigator & { standalone?: boolean }
  return window.matchMedia('(display-mode: standalone)').matches || nav.standalone === true
}

function isIos(): boolean {
  const ua = window.navigator.userAgent
  const iPadOs = window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1
  return /iphone|ipad|ipod/i.test(ua) || iPadOs
}

function cookieBannerOpen(): boolean {
  const el = document.getElementById('CybotCookiebotDialog')
  if (!el) return false
  const s = window.getComputedStyle(el)
  return s.display !== 'none' && s.visibility !== 'hidden'
}

export function PwaInstallPrompt() {
  const pathname = usePathname()
  const [mode, setMode] = useState<'native' | 'ios' | null>(null)
  const [visible, setVisible] = useState(false)
  const [deferred, setDeferred] = useState<InstallEvent | null>(null)

  useEffect(() => {
    if (currentSiteKey()) return
    if (isInstalled() || recentlyDismissed()) return

    const onPrompt = (e: Event) => {
      e.preventDefault() // we show our own banner, at a calmer moment
      setDeferred(e as InstallEvent)
      setMode('native')
    }
    const onInstalled = () => {
      setVisible(false)
      setDeferred(null)
      setMode(null)
    }

    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    // Deferred a tick: iOS has no install event, so we decide from the browser.
    const iosTimer = isIos() ? setTimeout(() => setMode('ios'), 0) : undefined

    return () => {
      if (iosTimer) clearTimeout(iosTimer)
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  useEffect(() => {
    if (!mode) return
    let poll: ReturnType<typeof setInterval> | undefined
    const timer = setTimeout(() => {
      const show = () => {
        if (cookieBannerOpen()) return false
        setVisible(true)
        return true
      }
      if (!show()) {
        poll = setInterval(() => {
          if (show() && poll) clearInterval(poll)
        }, 5_000)
      }
    }, DELAY_MS)
    return () => {
      clearTimeout(timer)
      if (poll) clearInterval(poll)
    }
  }, [mode])

  const hiddenHere = HIDDEN_PREFIXES.some((p) => pathname.startsWith(p))
  if (!mode || !visible || hiddenHere) return null

  const dismiss = () => {
    setVisible(false)
    try {
      window.localStorage.setItem(DISMISS_KEY, String(Date.now()))
    } catch {
      /* private mode: it simply may reappear next visit */
    }
  }

  const install = async () => {
    if (!deferred) return
    try {
      await deferred.prompt()
      await deferred.userChoice
    } catch {
      /* the browser refused; nothing to do */
    }
    setDeferred(null)
    setVisible(false)
  }

  return (
    <motion.aside
      aria-label='Install Golafly Matchday'
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      // Phones: stops short of the back-to-top button (right-4, 48px wide) so the two never overlap.
      className='fixed bottom-3 left-3 right-[4.5rem] z-40 max-w-[400px] sm:inset-x-auto sm:bottom-5 sm:left-5 sm:w-[380px]'
      // Lifted above the "Matchday plans?" bar while it shows (exit-intent-popup.tsx).
      style={{ marginBottom: 'calc(env(safe-area-inset-bottom) + var(--bottom-bar-h, 0px))' }}
    >
      <div className='flex items-center gap-3 rounded-2xl border border-border/70 bg-background/90 py-2.5 pl-2.5 pr-1.5 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.25)] backdrop-blur-xl'>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src='/brand/golafly-matchday-icon-192.png'
          alt=''
          width={36}
          height={36}
          className='size-9 shrink-0 rounded-[10px]'
        />
        <div className='min-w-0 flex-1'>
          <p className='text-[13.5px] font-semibold leading-tight text-foreground'>
            Get the Golafly app
          </p>
          {mode === 'native' ? (
            <p className='mt-0.5 text-[12px] leading-snug text-muted-foreground'>
              Your tickets, one tap away
            </p>
          ) : (
            <p className='mt-0.5 text-[12px] leading-snug text-muted-foreground'>
              Tap <Share aria-label='Share' className='mx-px inline size-3.5 -translate-y-px' /> then{' '}
              <span className='font-medium text-foreground'>Add to Home Screen</span>
            </p>
          )}
        </div>

        {mode === 'native' && (
          <button
            type='button'
            onClick={install}
            className='inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full bg-primary px-3.5 text-[12.5px] font-semibold text-primary-foreground shadow-[inset_0_0_0_1px_var(--brand-edge)] transition-[filter,scale] duration-200 hover:brightness-95 active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground'
          >
            <Download aria-hidden className='size-3.5' />
            Install
          </button>
        )}
        <button
          type='button'
          onClick={dismiss}
          aria-label='Not now'
          className='inline-flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground'
        >
          <X aria-hidden className='size-4' />
        </button>
      </div>
    </motion.aside>
  )
}
