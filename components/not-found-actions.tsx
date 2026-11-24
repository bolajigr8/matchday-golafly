'use client'

import Link from 'next/link'
import { ArrowLeft, Ticket } from 'lucide-react'
import { siteByKey } from '@/lib/sites'
import { useSiteKey } from '@/lib/site-runtime'

/* The buttons on the 404 page. They depend on which site the visitor is on,
   which only the browser knows (the page itself is built once for every
   address, see lib/sites.ts), so they live in their own small client piece.

   golafly.com       → home, matches, help
   a landing address → back to that competition's page, nothing else: the main
                       site's pages are not part of a landing page. */

const PRIMARY =
  'inline-flex h-12 items-center justify-center gap-2 rounded-full bg-primary px-7 text-[15px] font-semibold text-primary-foreground shadow-[inset_0_0_0_1px_var(--brand-edge)] transition-[filter,scale] duration-200 hover:brightness-95 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground'

const SECONDARY =
  'inline-flex h-12 items-center justify-center gap-2 rounded-full border border-foreground/15 px-7 text-[15px] font-semibold text-foreground transition-colors duration-200 hover:bg-foreground hover:text-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground'

export function NotFoundActions() {
  const site = siteByKey(useSiteKey())

  if (site) {
    return (
      <div className='mt-10 flex flex-wrap justify-center gap-3'>
        <Link href='/' className={PRIMARY}>
          <Ticket aria-hidden className='size-4' />
          Back to {site.name} matches
        </Link>
      </div>
    )
  }

  return (
    <div className='mt-10 flex flex-wrap justify-center gap-3'>
      <Link href='/' className={PRIMARY}>
        <ArrowLeft aria-hidden className='size-4' />
        Back to home
      </Link>
      <Link href='/matches' className={SECONDARY}>
        <Ticket aria-hidden className='size-4' />
        Browse matches
      </Link>
      <Link href='/help-faqs' className={SECONDARY}>
        Help &amp; FAQs
      </Link>
    </div>
  )
}
