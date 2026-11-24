'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { syncLandingReturn } from '@/lib/landing-return'
import { useSiteKey } from '@/lib/site-runtime'

/* Landing addresses only (does nothing on golafly.com). Keeps the two small
   cookies in lib/landing-return.ts up to date while a booking is in progress,
   so golafly.com can recognise the buyer when Stripe sends them back there.
   Renders nothing. */
export function LandingReturnSync() {
  const site = useSiteKey()
  const pathname = usePathname()

  useEffect(() => {
    if (!site) return
    syncLandingReturn()

    // The page is about to be left for Stripe: refresh the cookies one last time.
    const sync = () => syncLandingReturn()
    window.addEventListener('pagehide', sync)
    document.addEventListener('visibilitychange', sync)
    // Consent given after the booking started.
    window.addEventListener('CookiebotOnAccept', sync)
    return () => {
      window.removeEventListener('pagehide', sync)
      document.removeEventListener('visibilitychange', sync)
      window.removeEventListener('CookiebotOnAccept', sync)
    }
  }, [site, pathname])

  return null
}
