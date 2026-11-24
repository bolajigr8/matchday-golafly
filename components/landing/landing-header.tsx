'use client'

import { useSyncExternalStore } from 'react'
import { Navbar } from '@/components/navbar'
import { cn } from '@/lib/utils'

/* The landing sites' header: the main site's navbar (same logo, currency
   picker, language picker, theme toggle and cart), in its 'landing' variant: no
   page links, no menu and no Sign in button. No search here: it lives in the hero.

   Same sticky shell as PublicHeader in components/conditional-header.tsx,
   minus the Golafly-family strip (that is a row of links to other sites). */

function subscribeScroll(onChange: () => void) {
  window.addEventListener('scroll', onChange, { passive: true })
  return () => window.removeEventListener('scroll', onChange)
}
const isScrolled = () => window.scrollY > 8
const notScrolled = () => false

export function LandingHeader() {
  const scrolled = useSyncExternalStore(subscribeScroll, isScrolled, notScrolled)

  return (
    <header
      className={cn(
        'sticky top-0 z-50 border-b border-navbar-border bg-navbar/95 backdrop-blur-md transition-shadow duration-300 supports-[backdrop-filter]:bg-navbar/92',
        scrolled && 'shadow-[var(--lift-2)]',
      )}
    >
      <div className='page-container'>
        <Navbar variant='landing' />
      </div>
    </header>
  )
}
