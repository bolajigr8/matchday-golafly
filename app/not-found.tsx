import type { Metadata } from 'next'
import { NO_INDEX } from '@/lib/seo'
import { NotFoundActions } from '@/components/not-found-actions'

/* The site-wide 404. Next serves it, with a real 404 status, for any address
 * that matches no page, and whenever a page calls notFound() (an unknown
 * team, tournament or match, an unknown /lp/<x>).
 *
 * It renders inside the normal layout, so the header and footer around it are
 * the usual ones (the landing header on a landing address). Only the buttons
 * differ by site: see components/not-found-actions.tsx.
 *
 * Design: the "404" is a quiet watermark, not the message. The message is the
 * headline; one clear button; the rest is shortcuts. */

export const metadata: Metadata = {
  title: 'Page not found | Golafly',
  description: 'The page you were looking for could not be found.',
  robots: NO_INDEX,
}

export default function NotFound() {
  return (
    <main className='relative isolate flex min-h-[68vh] items-center justify-center overflow-hidden bg-background px-5 py-12 sm:py-14'>
      <div aria-hidden className='pointer-events-none absolute inset-0 -z-10'>
        <div className='absolute inset-0 bg-grid-fine grid-fade opacity-60' />
      </div>

      <div className='relative w-full text-center'>
        {/* The watermark. Decorative: the real heading is the h1 below. */}
        <p
          aria-hidden
          className='pointer-events-none absolute inset-x-0 -top-[0.32em] select-none font-display text-[clamp(150px,36vw,400px)] leading-none text-foreground/[0.045]'
        >
          404
        </p>

        <div className='relative'>
          <p className='font-mono text-xs font-medium uppercase tracking-[0.2em] text-brand-text'>
            Error 404
          </p>

          <h1 className='mt-4 font-display text-[clamp(34px,6vw,64px)] font-semibold leading-[1.05] tracking-tight text-foreground'>
            Page not found
          </h1>

          <p className='mx-auto mt-5 max-w-md text-[15px] leading-relaxed text-muted-foreground sm:text-base'>
            Sorry, we couldn’t find the page you’re looking for. It may have
            been moved or deleted, or the address may be incorrect.
          </p>

          <NotFoundActions />
        </div>
      </div>
    </main>
  )
}
