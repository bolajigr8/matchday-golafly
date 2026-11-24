'use client'

import Script from 'next/script'
import { useSyncExternalStore } from 'react'
import { isConsentCarried, isConsentOpen } from '@/lib/site-runtime'

/* Loads Cookiebot (the cookie banner) exactly as app/layout.tsx used to, with
   one exception: on a landing hostname built with
   NEXT_PUBLIC_LANDING_CONSENT=open (testing only) it is not loaded at all.

   On golafly.com, and on every landing hostname in the default 'banner' mode,
   this renders the same <Script> with the same attributes, a moment after
   hydration. The server snapshot is 'pending' so nothing is rendered until
   the browser has said which site this is. */

type Mode = 'pending' | 'banner' | 'open'

const subscribe = () => () => {}
const clientMode = (): Mode =>
  isConsentOpen() || isConsentCarried() ? 'open' : 'banner'
const serverMode = (): Mode => 'pending'

export function CookiebotLoader({ cbid }: { cbid: string }) {
  const mode = useSyncExternalStore(subscribe, clientMode, serverMode)
  if (mode !== 'banner') return null

  return (
    <Script
      id='Cookiebot'
      src='https://consent.cookiebot.com/uc.js'
      data-cbid={cbid}
      data-blockingmode='manual'
      type='text/javascript'
      strategy='afterInteractive'
    />
  )
}
