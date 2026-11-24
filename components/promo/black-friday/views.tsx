// Black Friday 2026 banners on golafly.com (matchday) — markup copied from the
// designer's football package (golafly-com-football-bar.html, -hero.html,
// -card.html, "F1 · Match ticket"), with:
//   - "→" drawn as an icon (the site fonts have no arrow glyph);
//   - images from public/black-friday/;
//   - the offer the boss asked for ("Up to 40% discount" + "Free eSIM to
//     selected destinations") added to the bar and under the title, and
//     "Selected destinations only." added to the legal line for it.
// Presentation only: whether to show them, and where the button goes, is
// decided by the callers (index.tsx).

import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { PROMO_HEADLINE_PERCENT } from '@/features/promo/pricing'
import './black-friday.css'

const PHOTO = '/black-friday/golafly-com-bf2026-stadium.webp'
const LOGO = '/black-friday/golafly-matchday-horizontal-black.svg'
const ICON = '/black-friday/golafly-matchday-icon-black.svg'
const LEGAL = 'Terms and Conditions Apply. Offers subject to availability and eligibility. Selected destinations only.'

// The offer copy (boss, 19 Nov): a fixed "up to", not read from the promo bands.
const PERCENT = `${PROMO_HEADLINE_PERCENT}%`
const FALLBACK_DATES = 'Nov 23–30, 2026'

interface ViewProps {
  /** Absolute URL (other site) or a path on this site. */
  href: string
  /** The Match Promo dates, e.g. "Nov 23–30, 2026". */
  dates?: string | null
}

function BannerLink({ href, className, children }: { href: string; className: string; children: React.ReactNode }) {
  if (href.startsWith('/')) {
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    )
  }
  return (
    <a href={href} className={className}>
      {children}
    </a>
  )
}

/** Announcement bar: full width, above the site header. */
export function BlackFridayBarView({ href, dates }: ViewProps) {
  return (
    <aside className='gfbf gfbf--bar gfbf--bar-f1' aria-label='Black Friday 2026'>
      <BannerLink className='gfbfbar__link' href={href}>
        <span className='gfbf__in gfbfbar__in'>
          <span className='gfbfbar__row'>
            <span className='gfbfbar__tag'>Black Friday 2026</span>
            <span className='gfbfbar__msg'>
              <strong>Match tickets</strong> · Up to <strong>{PERCENT}</strong> discount + Free{' '}
              <span className='gfbf__case'>eSIM</span> to selected destinations
            </span>
            <span className='gfbf__date gfbfbar__date'>{dates || FALLBACK_DATES}</span>
            <span className='gfbfbar__cta'>
              <span className='gfbfbar__cta-text'>Find tickets</span>
              <ArrowRight aria-hidden className='size-[1em] shrink-0' strokeWidth={2.5} />
            </span>
          </span>
        </span>
      </BannerLink>
    </aside>
  )
}

/**
 * Match ticket banner. 'band' = full-width hero band between two page
 * sections; 'card' = inside a content column (300–600 px, takes its width).
 */
export function BlackFridayTicketView({ href, dates, variant }: ViewProps & { variant: 'band' | 'card' }) {
  return (
    <section
      className={`gfbf ${variant === 'band' ? 'gfbf--band' : 'gfbf--card'} gfbff1 gfbf-ph--matchday-stadium`}
      aria-label='Black Friday 2026'
    >
      <div className='gfbf__in'>
        <div className='gfbf__card'>
          <Image
            className='gfbf__photo'
            src={PHOTO}
            alt=''
            fill
            sizes={variant === 'band' ? '(min-width: 1264px) 1216px, 100vw' : '(min-width: 600px) 600px, 100vw'}
          />
          <div className='gfbff1__shade' aria-hidden='true' />
          <div className='gfbff1__layout'>
            <div className='gfbff1__lead'>
              <span className='gfbf__kicker'>Black Friday 2026</span>
              <h2 className='gfbff1__title'>
                <span>Black</span> <span>Friday</span>
              </h2>
              <p className='gfbff1__offer'>
                Up to <strong>{PERCENT}</strong> discount
              </p>
              <p className='gfbf__gift'>
                {/* one inline run, so the pill wraps as text when the banner is narrow */}
                <span>
                  + Free <span className='gfbf__case'>eSIM</span> to selected destinations
                </span>
              </p>
              <ul className='gfbff1__trust'>
                <li>150% order guarantee</li>
                <li>Verified sellers</li>
                <li>24/7 support</li>
              </ul>
              <BannerLink className='gfbf__cta' href={href}>
                Find tickets
              </BannerLink>
            </div>
            <div className='gfbff1__ticket'>
              <div className='gfbff1__main'>
                <Image
                  className='gfbf__logo gfbff1__logo'
                  src={LOGO}
                  alt='Golafly Matchday'
                  width={440}
                  height={112}
                  unoptimized
                />
                <p className='gfbff1__item'>Match tickets</p>
                <dl className='gfbff1__fields'>
                  <div>
                    <dt>Dates</dt>
                    <dd>{dates || FALLBACK_DATES}</dd>
                  </div>
                  <div>
                    <dt>At</dt>
                    <dd>golafly.com</dd>
                  </div>
                </dl>
              </div>
              <div className='gfbff1__stub'>
                <Image className='gfbff1__icon' src={ICON} alt='' width={150} height={112} unoptimized />
                <span className='gfbff1__code' aria-hidden='true' />
              </div>
            </div>
            <p className='gfbf__legal'>{LEGAL}</p>
          </div>
        </div>
      </div>
    </section>
  )
}
