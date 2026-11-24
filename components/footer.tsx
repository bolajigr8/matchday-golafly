'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { type CSSProperties, type ReactNode } from 'react'
import { ArrowRight, ArrowUpRight, Mail, MapPin, Phone } from 'lucide-react'
import { GolaflyWordmark, MatchdayLogo } from '@/components/brand/matchday-logo'
import { openCookiebotPreferences } from '@/components/shared/cookiebot-third-party-scripts'
import { NewsletterForm } from '@/components/shared/newsletter-form'
import { IconWhatsApp, SOCIAL_ICON_MAP } from '@/components/social-icons'
import { cookiebotEnabled } from '@/lib/consent'
import { cn } from '@/lib/utils'
import { BRAND, CONTACT, OFFICES, SOCIAL_LINKS } from '@/store/data'
import { GOLAFLY_PROGRAMS, TRAVEL_URL, golaflyProduct } from '@/store/ecosystem'

/* ─── Footer ─────────────────────────────────────────────────────
   An ink band in both themes, so it anchors every page the same way.
   Inside the band neon may be type (eyebrows, hovers); everything else
   reads in the band's white / mist pair. */

const FOCUS_RING =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary'

const TRAVEL_DOMAIN = TRAVEL_URL.replace(/^https?:\/\//, '')

const travel = golaflyProduct('travel')
const academy = golaflyProduct('academy')
const camp = golaflyProduct('camp')

/* ─── Link columns ───────────────────────────────────────────────
   A link without `href` is not live yet: it renders with a "Soon" chip,
   never as a dead link. Every internal href has a route under app/. */

interface FooterLinkItem {
  label: string
  href?: string
  external?: boolean
}

const FOOTER_NAV: { heading: string; links: FooterLinkItem[] }[] = [
  {
    heading: 'Matchday',
    links: [
      { label: 'Matches', href: '/matches' },
      { label: 'Competitions', href: '/tournaments' },
      { label: 'Teams', href: '/teams' },
      { label: 'International', href: '/international' },
      { label: 'Help & FAQs', href: '/help-faqs' },
    ],
  },
  {
    heading: 'Golafly',
    links: [
      { label: travel.fullName, href: TRAVEL_URL, external: true },
      { label: academy.fullName, href: academy.href },
      { label: camp.name, href: camp.href },
      ...GOLAFLY_PROGRAMS.map((p) => ({ label: p.label, href: p.href })),
    ],
  },
  {
    heading: 'Company',
    links: [
      { label: 'About', href: '/about' },
      { label: 'Blog', href: '/blog' },
      { label: 'Travel blog', href: '/travel/blog' },
      { label: 'Internship', href: '/internship' },
    ],
  },
  {
    heading: 'Legal',
    links: [
      { label: 'Terms & Conditions', href: '/legal/terms' },
      { label: 'Privacy Policy', href: '/legal/privacy' },
      { label: 'Refund Policy', href: '/legal/refund' },
    ],
  },
]

/* WhatsApp already has its own line under Contact. */
const SOCIALS = SOCIAL_LINKS.filter((s) => s.name !== 'WhatsApp')

export function Footer() {
  const pathname = usePathname()
  // Sanity Studio owns the full viewport.
  if (pathname.startsWith('/studio')) return null

  return (
    <footer className='relative isolate w-full overflow-hidden bg-band-ink text-band-ink-muted scheme-dark dark:border-t dark:border-band-ink-border'>
      <FooterBackdrop />

      <div className='page-container'>
        <NewsletterSection />
        <FamilySection />

        {/* ── Brand + link columns ── */}
        <div className='grid grid-cols-1 gap-12 border-t border-band-ink-border py-14 sm:py-16 lg:grid-cols-12 lg:gap-8'>
          <div className='grid grid-cols-1 gap-10 md:grid-cols-2 md:gap-8 lg:col-span-4 lg:flex lg:flex-col lg:gap-8 lg:pr-6'>
            <div>
              <Link
                href='/'
                aria-label='Golafly Matchday home'
                className={cn('inline-flex rounded-md', FOCUS_RING, 'focus-visible:outline-offset-4')}
              >
                <MatchdayLogo tone='onDark' size='md' />
              </Link>
              <p className='mt-6 max-w-sm text-[15px] leading-relaxed'>
                Match tickets, hotels and flights, booked together: your
                complete matchday in one place.
              </p>
            </div>

            <div>
              <ul className='space-y-3'>
                <ContactItem href={`mailto:${CONTACT.email}`} icon={<Mail className='size-4' />}>
                  {CONTACT.email}
                </ContactItem>
                <ContactItem
                  href={`tel:${CONTACT.phone.replace(/\s/g, '')}`}
                  icon={<Phone className='size-4' />}
                >
                  {CONTACT.phone}
                </ContactItem>
                <ContactItem href={CONTACT.whatsapp} external icon={<IconWhatsApp />}>
                  Chat on WhatsApp
                </ContactItem>
              </ul>

              <ul aria-label='Golafly on social media' className='mt-7 flex flex-wrap gap-2'>
                {SOCIALS.map(({ name, href }) => {
                  const Icon = SOCIAL_ICON_MAP[name]
                  return (
                    <li key={name}>
                      <a
                        href={href}
                        target='_blank'
                        rel='noopener noreferrer'
                        aria-label={`Golafly on ${name} (opens in a new tab)`}
                        className={cn(
                          'grid size-10 place-items-center rounded-full border border-band-ink-border text-band-ink-muted transition-colors duration-200 hover:border-primary/60 hover:text-primary',
                          FOCUS_RING,
                        )}
                      >
                        <Icon />
                      </a>
                    </li>
                  )
                })}
              </ul>
            </div>
          </div>

          <nav
            aria-label='Footer'
            className='grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-4 md:gap-x-8 lg:col-span-8'
          >
            {FOOTER_NAV.map((col) => (
              <div key={col.heading}>
                <h2 className='font-mono text-[11px] uppercase tracking-[0.22em] text-band-ink-fg'>
                  {col.heading}
                </h2>
                <ul className='mt-5 space-y-3.5'>
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <FooterNavLink {...link} />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        {/* ── Offices ── */}
        <div className='grid grid-cols-1 gap-6 border-t border-band-ink-border py-10 sm:grid-cols-2 lg:grid-cols-12 lg:gap-8'>
          <h2 className='font-mono text-[11px] uppercase tracking-[0.22em] text-band-ink-fg sm:col-span-2 lg:col-span-4'>
            Offices
          </h2>
          {OFFICES.map((office) => (
            <address
              key={office.city}
              className='flex gap-3 text-[13.5px] not-italic leading-relaxed lg:col-span-4'
            >
              <MapPin aria-hidden className='mt-1 size-4 shrink-0 text-primary' />
              <span>
                <span className='block font-medium text-band-ink-fg'>{office.city}</span>
                {office.lines.map((line) => (
                  <span key={line} className='block'>
                    {line}
                  </span>
                ))}
              </span>
            </address>
          ))}
        </div>

        {/* ── Bottom bar ── */}
        <div className='flex flex-col gap-5 border-t border-band-ink-border py-7 lg:flex-row lg:items-center lg:justify-between'>
          <div className='flex flex-wrap items-center gap-x-6 gap-y-2 font-mono text-[11px] tracking-[0.08em]'>
            <p>{BRAND.legal}</p>
            {cookiebotEnabled && (
              <button
                type='button'
                onClick={openCookiebotPreferences}
                className={cn(
                  'rounded-sm uppercase tracking-[0.16em] transition-colors duration-200 hover:text-primary',
                  FOCUS_RING,
                )}
              >
                Cookie settings
              </button>
            )}
          </div>
          <ul aria-label='Golafly standards' className='flex flex-wrap gap-2'>
            {BRAND.badges.map((badge) => (
              <li
                key={badge}
                className='rounded-full border border-band-ink-border px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em]'
              >
                {badge}
              </li>
            ))}
          </ul>
        </div>

        {/* Editorial watermark that closes the page. Decorative only. */}
        <div
          aria-hidden
          className='pointer-events-none -mb-[0.08em] select-none bg-gradient-to-b from-white/[0.1] via-white/[0.04] to-transparent bg-clip-text font-display text-[clamp(64px,24vw,330px)] uppercase leading-[0.8] tracking-[0.01em] text-transparent'
        >
          Matchday
        </div>
      </div>
    </footer>
  )
}

/* ─── Newsletter ─────────────────────────────────────────────────── */

function NewsletterSection() {
  return (
    <section
      aria-labelledby='footer-newsletter-title'
      className='grid grid-cols-1 gap-10 pt-20 pb-16 sm:pt-24 lg:grid-cols-12 lg:items-end lg:gap-12 lg:pt-28 lg:pb-20'
    >
      <div className='lg:col-span-7'>
        <Eyebrow>Newsletter</Eyebrow>
        <h2
          id='footer-newsletter-title'
          className='mt-5 font-heading text-[36px] font-bold uppercase leading-[0.95] tracking-[-0.02em] text-band-ink-fg sm:text-[48px] lg:text-[56px]'
        >
          Stay in the <span className='text-primary'>game</span>.
        </h2>
        <p className='mt-5 max-w-md text-[15px] leading-relaxed sm:text-base'>
          New fixtures, ticket releases and matchday travel tips from Golafly,
          straight to your inbox.
        </p>
      </div>


      <NewsletterForm source="footer" className="max-w-xl lg:col-span-5 lg:max-w-none" />
    </section>
  )
}

/* ─── Golafly family ─────────────────────────────────────────────── */

type FamilyStatus = 'current' | 'soon' | 'link'

interface FamilyTileData {
  id: string
  logo: ReactNode
  tagline: string
  status: FamilyStatus
  href?: string
  external?: boolean
}

const FAMILY: FamilyTileData[] = [
  {
    id: 'matchday',
    logo: <MatchdayLogo tone='onDark' size='sm' />,
    tagline: `${golaflyProduct('matchday').tagline}. ${golaflyProduct('matchday').description}`,
    status: 'current',
  },
  {
    id: 'travel',
    logo: (
      <Image
        src='/brand/golafly-travel.png'
        alt='Golafly Travel'
        width={147}
        height={52}
        className='h-[52px] w-[147px] shrink-0 object-contain object-left'
      />
    ),
    tagline: travel.tagline,
    status: 'link',
    href: TRAVEL_URL,
    external: true,
  },
  {
    id: 'academy',
    logo: (
      <CrestLockup
        src='/brand/golafly-academy-crest.svg'
        width={29}
        height={34}
        sub='Academy'
      />
    ),
    tagline: academy.tagline,
    status: 'soon',
  },
  {
    id: 'camp',
    logo: (
      <CrestLockup
        src='/brand/golafly-scouting-camp.png'
        width={34}
        height={34}
        sub='Scouting Camp'
        tight
      />
    ),
    tagline: camp.tagline,
    status: 'link',
    href: camp.href,
  },
]

function FamilySection() {
  return (
    <section
      aria-labelledby='footer-family-title'
      className='border-t border-band-ink-border py-12 sm:py-14'
    >
      <div className='flex items-center gap-4'>
        <Eyebrow id='footer-family-title' as='h2'>
          Part of the Golafly family
        </Eyebrow>
        <span aria-hidden className='h-px flex-1 bg-band-ink-border' />
      </div>

      {/* Phone: a swipeable row (one and a bit tiles in view).
          Tablet: 2 × 2. Desktop: one row of four. */}
      <ul className='-mx-5 mt-7 flex snap-x snap-mandatory scroll-px-5 gap-3 overflow-x-auto px-5 py-1 scrollbar-hide sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-4 sm:overflow-visible sm:px-0 sm:py-0 lg:grid-cols-4'>
        {FAMILY.map((tile) => (
          <li
            key={tile.id}
            className='w-[82%] max-w-[320px] shrink-0 snap-start sm:w-auto sm:max-w-none'
          >
            <FamilyTile {...tile} />
          </li>
        ))}
      </ul>
    </section>
  )
}

function FamilyTile({ logo, tagline, status, href, external }: FamilyTileData) {
  const body = (
    <>
      <div className='flex min-h-[52px] items-center'>{logo}</div>
      <p className='text-[13.5px] leading-relaxed'>{tagline}</p>
      <div className='mt-auto flex min-h-9 items-center justify-between gap-3 pt-1'>
        {status === 'current' && (
          <span className='inline-flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.18em] text-primary'>
            <span className='size-1.5 rounded-full bg-primary shadow-[0_0_8px_var(--brand-glow)]' />
            You&apos;re here
          </span>
        )}
        {status === 'soon' && (
          <span className='rounded-full border border-band-ink-border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.18em]'>
            Soon
          </span>
        )}
        {status === 'link' && (
          <>
            <span className='truncate font-mono text-[11px] transition-colors duration-200 group-hover:text-band-ink-fg'>
              {external ? TRAVEL_DOMAIN : 'Explore'}
            </span>
            <span
              aria-hidden
              className='grid size-9 shrink-0 place-items-center rounded-full border border-band-ink-border text-band-ink-fg transition-colors duration-200 group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground'
            >
              {external ? <ArrowUpRight className='size-4' /> : <ArrowRight className='size-4' />}
            </span>
          </>
        )}
      </div>
    </>
  )

  const base =
    'flex h-full flex-col gap-4 rounded-2xl border border-band-ink-border bg-band-ink-raise/60 p-5 sm:p-6'

  if (status !== 'link' || !href) {
    return <div className={base}>{body}</div>
  }

  const interactive = cn(
    base,
    'group transition duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:bg-band-ink-raise motion-reduce:transition-none motion-reduce:hover:translate-y-0',
    FOCUS_RING,
  )

  if (external) {
    return (
      <a href={href} target='_blank' rel='noopener noreferrer' className={interactive}>
        {body}
        <span className='sr-only'> (opens in a new tab)</span>
      </a>
    )
  }

  return (
    <Link href={href} className={interactive}>
      {body}
    </Link>
  )
}

/* Crest + GOLAFLY wordmark + ruled subline, on the same .md-logo system as
   the Matchday lockup so the four family marks share one rhythm. `tight`
   drops the rules and tracking for long sublines ("Scouting Camp"). */
function CrestLockup({
  src,
  width,
  height,
  sub,
  tight = false,
}: {
  src: string
  width: number
  height: number
  sub: string
  tight?: boolean
}) {
  return (
    <span role='img' aria-label={`Golafly ${sub}`} data-tone='onDark' className='md-logo md-logo--sm'>
      <Image
        src={src}
        alt=''
        width={width}
        height={height}
        unoptimized={src.endsWith('.svg')}
        className='md-logo__icon'
      />
      <span className='md-logo__type' aria-hidden>
        <GolaflyWordmark className='md-logo__word' />
        <span
          className={cn(
            'md-logo__sub',
            tight && 'justify-start tracking-[0.16em] before:hidden after:hidden [&>span]:mr-0',
          )}
        >
          <span>{sub}</span>
        </span>
      </span>
    </span>
  )
}

/* ─── Small pieces ───────────────────────────────────────────────── */

function Eyebrow({
  children,
  id,
  as: Tag = 'p',
}: {
  children: ReactNode
  id?: string
  as?: 'p' | 'h2'
}) {
  return (
    <Tag
      id={id}
      className='inline-flex shrink-0 items-center gap-2.5 font-mono text-[11px] uppercase tracking-[0.22em] text-primary'
    >
      <span aria-hidden className='size-1.5 rounded-full bg-primary shadow-[0_0_8px_var(--brand-glow)]' />
      {children}
    </Tag>
  )
}

function ContactItem({
  href,
  icon,
  external = false,
  children,
}: {
  href: string
  icon: ReactNode
  external?: boolean
  children: ReactNode
}) {
  return (
    <li>
      <a
        href={href}
        {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        className={cn(
          'group inline-flex items-center gap-3 rounded-full text-[14px] text-band-ink-fg transition-colors duration-200 hover:text-primary',
          FOCUS_RING,
        )}
      >
        <span
          aria-hidden
          className='grid size-9 shrink-0 place-items-center rounded-full border border-band-ink-border text-band-ink-muted transition-colors duration-200 group-hover:border-primary/50 group-hover:text-primary'
        >
          {icon}
        </span>
        <span className='min-w-0 break-words'>{children}</span>
        {external && (
          <>
            <ArrowUpRight aria-hidden className='size-3.5 shrink-0' />
            <span className='sr-only'> (opens in a new tab)</span>
          </>
        )}
      </a>
    </li>
  )
}

const NAV_LINK =
  'group inline-flex items-center gap-1.5 rounded-sm text-[14px] leading-snug text-band-ink-muted transition-colors duration-200 hover:text-band-ink-fg'

function FooterNavLink({ label, href, external }: FooterLinkItem) {
  if (!href) {
    return (
      <span className='inline-flex flex-wrap items-center gap-x-2 gap-y-1 text-[14px] leading-snug text-band-ink-muted/80'>
        {label}
        <span className='rounded-full border border-band-ink-border px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.16em]'>
          Soon
        </span>
      </span>
    )
  }

  if (external) {
    return (
      <a href={href} target='_blank' rel='noopener noreferrer' className={cn(NAV_LINK, FOCUS_RING)}>
        {label}
        <ArrowUpRight
          aria-hidden
          className='size-3.5 shrink-0 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 motion-reduce:transition-none'
        />
        <span className='sr-only'> (opens in a new tab)</span>
      </a>
    )
  }

  return (
    <Link href={href} className={cn(NAV_LINK, FOCUS_RING)}>
      {label}
    </Link>
  )
}

/* Fine white grid fading out from the top-right, plus a low neon haze. */
const GRID_MASK = 'radial-gradient(ellipse 60% 70% at 85% 0%, #000 25%, transparent 75%)'
const GRID_STYLE: CSSProperties = {
  backgroundImage:
    'linear-gradient(rgb(255 255 255 / 0.045) 1px, transparent 1px), linear-gradient(90deg, rgb(255 255 255 / 0.045) 1px, transparent 1px)',
  backgroundSize: '32px 32px',
  maskImage: GRID_MASK,
  WebkitMaskImage: GRID_MASK,
}

function FooterBackdrop() {
  return (
    <div aria-hidden className='pointer-events-none absolute inset-0 -z-10 overflow-hidden'>
      <div className='absolute inset-x-0 top-0 h-[560px]' style={GRID_STYLE} />
      <div className='absolute -right-48 -top-64 size-[620px] rounded-full bg-primary/[0.07] blur-[120px]' />
    </div>
  )
}
