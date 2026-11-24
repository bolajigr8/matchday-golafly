'use client'

import { MatchdayLogo } from '@/components/brand/matchday-logo'
import { openCookiebotPreferences } from '@/components/shared/cookiebot-third-party-scripts'
import { CONTACT, BRAND } from '@/store/data'
import { cookiebotEnabled } from '@/lib/consent'
import { mainUrl, siteByKey } from '@/lib/sites'
import { useConsentOpen, useSiteKey } from '@/lib/site-runtime'
import { NewsletterForm, landingPrivacyHref } from '@/components/shared/newsletter-form'

/* The short footer for landing hostnames: the legal links that must always be
   reachable, support contact, and the cookie settings. No site navigation
   (About, Blog …) so there is nowhere to wander off to. The legal pages live
   on the main site, so these are normal links out.

   Used inside the landing page AND by components/conditional-footer.tsx on
   the booking pages of a landing hostname. */

const LEGAL = [
  { label: 'Terms & Conditions', path: '/legal/terms' },
  { label: 'Privacy Policy', path: '/legal/privacy' },
  { label: 'Refund Policy', path: '/legal/refund' },
]

export function LandingFooter() {
  // In an 'open' testing build there is no cookie banner to reopen.
  const consentOpen = useConsentOpen()
  const siteKey = useSiteKey()
  const site = siteByKey(siteKey)

  return (
    <footer className='bg-band-ink text-band-ink-muted'>
      <div className='page-container py-10'>
        {/* Ticket alerts: for the visitors who are not ready to book today. */}
        <section
          aria-labelledby='landing-newsletter-title'
          className='mb-10 grid grid-cols-1 gap-6 border-b border-band-ink-border pb-10 md:grid-cols-[minmax(0,1fr)_minmax(0,440px)] md:items-center md:gap-10'
        >
          <div>
            <p className='flex items-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-primary'>
              <span aria-hidden className='size-1.5 rounded-full bg-primary shadow-[0_0_8px_var(--brand-glow)]' />
              Ticket alerts
            </p>
            <h2
              id='landing-newsletter-title'
              className='mt-3 font-heading text-[24px] font-bold uppercase leading-[1.05] tracking-[-0.01em] text-band-ink-fg sm:text-[28px]'
            >
              Never miss a {site ? site.name : 'big'}{' '}
              <span className='text-primary'>ticket drop</span>
            </h2>
            <p className='mt-2 max-w-md text-[14px] leading-relaxed'>
              New fixtures and ticket releases, straight to your inbox.
            </p>
          </div>
          <NewsletterForm
            source='landing-footer'
            site={siteKey ?? undefined}
            size='sm'
            privacyHref={landingPrivacyHref()}
          />
        </section>

        <div className='flex flex-col gap-8 md:flex-row md:items-start md:justify-between'>
          <div className='max-w-sm'>
            <MatchdayLogo tone='onDark' size='md' />
            <p className='mt-4 text-[13px] leading-relaxed'>
              Match tickets from verified sellers, with a 150% order
              guarantee.
            </p>
            <p className='mt-3 text-[13px]'>
              Questions?{' '}
              <a
                href={`mailto:${CONTACT.email}`}
                className='text-band-ink-fg underline-offset-4 hover:underline'
              >
                {CONTACT.email}
              </a>
            </p>
          </div>

          <ul aria-label='Legal' className='flex flex-col gap-2.5 text-[13px]'>
            {LEGAL.map((l) => (
              <li key={l.path}>
                <a
                  href={mainUrl(l.path)}
                  className='transition-colors duration-200 hover:text-primary'
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className='mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-band-ink-border pt-6 font-mono text-[11px] tracking-[0.08em]'>
          <p>{BRAND.legal}</p>
          {cookiebotEnabled && !consentOpen && (
            <button
              type='button'
              onClick={openCookiebotPreferences}
              className='rounded-sm uppercase tracking-[0.16em] transition-colors duration-200 hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary'
            >
              Cookie settings
            </button>
          )}
        </div>
      </div>
    </footer>
  )
}
