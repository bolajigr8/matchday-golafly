'use client'

import * as React from 'react'
import { ArrowRight } from 'lucide-react'
import { FIXTURES_ANCHOR, useLandingScope } from '@/features/landing/scope'

/* A "Get tickets" bar pinned to the bottom of phones. It appears once the
   visitor has scrolled past the first screen and goes away again when the
   fixtures list itself is on screen, so it never covers the thing it points
   to. Hidden from sm up. */

const subscribeScroll = (cb: () => void) => {
  window.addEventListener('scroll', cb, { passive: true })
  return () => window.removeEventListener('scroll', cb)
}
const pastFirstScreen = () => window.scrollY > window.innerHeight * 0.8

export function LandingStickyCta() {
  const scope = useLandingScope()
  const past = React.useSyncExternalStore(subscribeScroll, pastFirstScreen, () => false)
  const [fixturesInView, setFixturesInView] = React.useState(false)

  React.useEffect(() => {
    const el = document.getElementById(FIXTURES_ANCHOR)
    if (!el || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(([e]) => setFixturesInView(e.isIntersecting), {
      threshold: 0.15,
    })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  if (!scope) return null
  const show = past && !fixturesInView

  return (
    <div
      aria-hidden={!show}
      className={
        'fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 p-3 backdrop-blur-md transition-transform duration-300 sm:hidden ' +
        (show ? 'translate-y-0' : 'pointer-events-none translate-y-full')
      }
    >
      <a
        href={`#${FIXTURES_ANCHOR}`}
        tabIndex={show ? 0 : -1}
        className='flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary text-[15px] font-semibold text-primary-foreground shadow-[inset_0_0_0_1px_var(--brand-edge)]'
      >
        Get {scope.site.name} tickets
        <ArrowRight aria-hidden className='size-4' />
      </a>
    </div>
  )
}
