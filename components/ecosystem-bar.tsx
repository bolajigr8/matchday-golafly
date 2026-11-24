import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'

import { cn } from '@/lib/utils'
import { IconWhatsApp } from '@/components/social-icons'
import { CONTACT, NAV_LINKS } from '@/store/data'
import { GOLAFLY_PRODUCTS, type GolaflyProduct } from '@/store/ecosystem'

/* "Golafly family" strip above the navbar on public pages (pattern A).
   A thin ink band that names every sibling product so a fan buying tickets
   can see the rest of Golafly without it competing with the main nav.
   Desktop only: below lg the same list lives in the mobile menu. It scrolls
   away with the page — only the navbar under it is sticky. */

const FOCUS =
  'rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary'

const ITEM =
  'relative inline-flex h-full items-center gap-1 whitespace-nowrap transition-colors duration-200'

function ProductItem({ product }: { product: GolaflyProduct }) {
  // The site you're on: lit, with a neon bar sitting on the strip's floor.
  if (product.key === 'matchday') {
    return (
      <Link
        href='/'
        aria-current='true'
        className={cn(
          ITEM,
          FOCUS,
          'font-medium text-band-ink-fg after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:rounded-full after:bg-primary',
        )}
      >
        <span translate='no' className='notranslate'>
          {product.name}
        </span>
      </Link>
    )
  }

  // Not launched yet: a label and a chip, never a dead link.
  if (!product.href) {
    return (
      <span className={cn(ITEM, 'gap-2 text-band-ink-muted/80')}>
        <span translate='no' className='notranslate'>
          {product.name}
        </span>
        <span className='rounded-full bg-primary/10 px-1.5 py-px font-mono text-[9.5px] font-medium uppercase leading-[1.5] tracking-[0.14em] text-primary ring-1 ring-primary/25'>
          Soon
        </span>
      </span>
    )
  }

  if (product.external) {
    return (
      <a
        href={product.href}
        target='_blank'
        rel='noopener noreferrer'
        className={cn(ITEM, FOCUS, 'group text-band-ink-muted hover:text-band-ink-fg')}
      >
        <span translate='no' className='notranslate'>
          {product.name}
        </span>
        <ArrowUpRight
          aria-hidden
          className='size-3 opacity-70 transition-transform duration-200 group-hover:-translate-y-px group-hover:translate-x-px group-hover:opacity-100'
          strokeWidth={2}
        />
        <span className='sr-only'>(opens in a new tab)</span>
      </a>
    )
  }

  return (
    <Link
      href={product.href}
      className={cn(ITEM, FOCUS, 'text-band-ink-muted hover:text-band-ink-fg')}
    >
      <span translate='no' className='notranslate'>
        {product.name}
      </span>
    </Link>
  )
}

export function EcosystemBar() {
  return (
    <div className='hidden border-b border-band-ink-border bg-band-ink text-[12.5px] text-band-ink-muted lg:block'>
      <div className='page-container flex h-9 items-center justify-between gap-6'>
        <nav aria-label='Golafly family' className='flex h-full items-center gap-5'>
          <span className='flex items-center gap-2 font-mono text-[10.5px] font-medium uppercase tracking-[0.22em] text-band-ink-fg'>
            <span aria-hidden className='size-1.5 rounded-full bg-primary' />
            Golafly
          </span>
          <span aria-hidden className='h-3.5 w-px bg-band-ink-border' />
          <ul className='flex h-full items-center gap-5'>
            {GOLAFLY_PRODUCTS.map((product) => (
              <li key={product.key} className='flex h-full items-center'>
                <ProductItem product={product} />
              </li>
            ))}
          </ul>
        </nav>

        <div className='flex h-full items-center gap-5'>
        {/* Links moved up from the main navbar (NAV_LINKS with topBar),
            e.g. Help, so the navbar has room on desktop. */}
        {NAV_LINKS.filter((l) => l.topBar && l.href).map((l) => (
          <Link
            key={l.label}
            href={l.href!}
            className={cn('whitespace-nowrap text-band-ink-muted transition-colors duration-200 hover:text-band-ink-fg', FOCUS)}
          >
            {l.label}
          </Link>
        ))}
        <span aria-hidden className='h-3.5 w-px bg-band-ink-border' />
        <a
          href={CONTACT.whatsapp}
          target='_blank'
          rel='noopener noreferrer'
          aria-label={`Chat with us on WhatsApp, ${CONTACT.phone} (opens in a new tab)`}
          className={cn(
            'group inline-flex items-center gap-2 whitespace-nowrap text-band-ink-muted transition-colors duration-200 hover:text-band-ink-fg',
            FOCUS,
          )}
        >
          <IconWhatsApp className='size-3.5 text-primary' />
          <span className='tabular-nums'>{CONTACT.phone}</span>
          <ArrowUpRight
            aria-hidden
            className='size-3 opacity-60 transition-transform duration-200 group-hover:-translate-y-px group-hover:translate-x-px group-hover:opacity-100'
            strokeWidth={2}
          />
        </a>
        </div>
      </div>
    </div>
  )
}
