'use client'

import { useEffect, useState } from 'react'
import { usePathname, useSelectedLayoutSegment } from 'next/navigation'
import { ArrowUp } from 'lucide-react'
import { cn } from '@/lib/utils'

/* "Back to top" button, shown on every marketing page once the visitor has
 * scrolled more than one screen down (window height, min 600px). Translucent
 * Golafly-brand pill with a blur behind it, solid on hover/focus.
 *
 * Hidden where the screen already has its own chrome: dashboards, Studio,
 * auth screens and landing sites — the same list ConditionalHeader uses.
 * Raised on pages with a fixed bottom bar on small screens (internship role
 * pages), so it never covers their buttons. */

const HIDDEN_PREFIXES = ['/studio', '/admin', '/scout', '/fan', '/player']
const HIDDEN_EXACT = ['/login', '/register', '/register/player', '/forgot-password', '/reset-password', '/scouting-camp', '/scouting-camp/thank-you']

export function ScrollToTop() {
  const pathname = usePathname() ?? '/'
  const segment = useSelectedLayoutSegment()
  const [show, setShow] = useState(false)

  useEffect(() => {
    let frame = 0
    const update = () => {
      frame = 0
      setShow(window.scrollY > Math.max(600, window.innerHeight))
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [])

  const hidden =
    segment === 'lp' ||
    HIDDEN_EXACT.includes(pathname) ||
    HIDDEN_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))
  if (hidden) return null

  // /internship/<role> has a fixed "Apply" bar below lg.
  const raised = /^\/internship\/[^/]+/.test(pathname)

  return (
    <button
      type='button'
      aria-label='Back to top'
      title='Back to top'
      tabIndex={show ? 0 : -1}
      aria-hidden={!show}
      onClick={() => {
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' })
      }}
      // Lifted above the "Matchday plans?" bar while it shows (exit-intent-popup.tsx).
      style={{ marginBottom: 'var(--bottom-bar-h, 0px)' }}
      className={cn(
        'fixed right-4 z-50 flex size-12 items-center justify-center rounded-full border border-brand-edge',
        'bg-primary/70 text-primary-foreground shadow-lg backdrop-blur-md',
        'transition-all duration-300 hover:bg-primary focus-visible:bg-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        'sm:right-6 sm:size-14',
        raised
          ? 'bottom-[calc(6.5rem+env(safe-area-inset-bottom))] lg:bottom-6'
          : 'bottom-[calc(1rem+env(safe-area-inset-bottom))] sm:bottom-6',
        show ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0',
      )}
    >
      <ArrowUp className='size-5 sm:size-6' strokeWidth={2.25} />
    </button>
  )
}
