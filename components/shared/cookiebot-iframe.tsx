'use client'

// Ported from travels/components/shared/cookiebot-iframe.tsx. Third-party
// embeds (YouTube etc.) set marketing cookies, so Cookiebot's auto-blocker
// would otherwise leave an empty box. This renders a clear placeholder with
// a "Manage cookie preferences" button until consent is given.

import { useEffect, useState, type IframeHTMLAttributes } from 'react'
import {
  hasCookiebotConsent,
  openCookiebotPreferences,
} from '@/components/shared/cookiebot-third-party-scripts'
import type { ConsentCategory } from '@/lib/consent'

interface CookiebotIframeProps extends Omit<IframeHTMLAttributes<HTMLIFrameElement>, 'src'> {
  src: string
  consentCategory: ConsentCategory
  consentMessage?: string
}

export function CookiebotIframe({
  src,
  consentCategory,
  consentMessage = 'This video needs your cookie consent to play.',
  ...props
}: CookiebotIframeProps) {
  const [allowed, setAllowed] = useState(false)

  useEffect(() => {
    const sync = () => setAllowed(hasCookiebotConsent(consentCategory))
    sync()
    const events = ['CookiebotOnConsentReady', 'CookiebotOnAccept', 'CookiebotOnDecline']
    events.forEach((e) => window.addEventListener(e, sync))
    return () => events.forEach((e) => window.removeEventListener(e, sync))
  }, [consentCategory])

  if (!allowed) {
    return (
      <div className='flex h-full min-h-48 w-full flex-col items-center justify-center gap-3 rounded-lg bg-muted px-6 text-center'>
        <p className='max-w-md text-sm text-muted-foreground'>{consentMessage}</p>
        <button
          type='button'
          onClick={openCookiebotPreferences}
          className='rounded-full border border-border px-4 py-2 text-xs font-semibold transition-colors hover:border-primary hover:bg-background'
        >
          Manage cookie preferences
        </button>
      </div>
    )
  }
  // eslint-disable-next-line jsx-a11y/iframe-has-title
  return <iframe src={src} {...props} />
}
