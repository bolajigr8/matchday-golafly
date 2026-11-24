import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import type { ComponentProps, ReactNode } from 'react'
import { cn } from '@/lib/utils'

/* "VIP · Button" (Figma 513:4191): Gold or Ghost, size M or S. On hover the
   gap widens (arrow nudges right), gold brightens and its glow grows, ghost
   turns gold. */
type Variant = 'gold' | 'ghost'
type Size = 'm' | 's'

const base =
  'inline-flex items-center justify-center rounded-full font-semibold leading-[normal] whitespace-nowrap transition-[gap,box-shadow,background-color,border-color,color] duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-vip-gold-light disabled:pointer-events-none disabled:opacity-50'

const sizes: Record<Size, string> = {
  m: 'gap-2.5 px-7 py-4 text-[15px] hover:gap-3.5',
  s: 'gap-2.5 px-[18px] py-[11px] text-[13px] hover:gap-3.5',
}

const variants: Record<Variant, string> = {
  gold:
    'bg-linear-to-r from-vip-gold-light to-vip-gold text-[#111111] shadow-[0_8px_22px_rgba(212,178,106,0.28)] hover:from-[#ffecbe] hover:to-[#e2c076] hover:shadow-[0_12px_34px_rgba(212,178,106,0.5)]',
  /* Ghost carries a 1px inside border; M ghost is 52px tall in Figma (2px
     taller than gold M) because the border sits inside the padding box. */
  ghost:
    'border border-vip-line/20 text-vip-chalk hover:border-vip-gold/75 hover:bg-vip-gold/8 hover:text-vip-gold-text',
}

export function vipButtonClass({
  variant = 'gold',
  size = 'm',
  className,
}: { variant?: Variant; size?: Size; className?: string } = {}) {
  return cn(base, sizes[size], variants[variant], className)
}

interface Common {
  variant?: Variant
  size?: Size
  /** Show the trailing → arrow. */
  arrow?: boolean
  children: ReactNode
  className?: string
}

function Inner({ arrow, children }: Pick<Common, 'arrow' | 'children'>) {
  return (
    <>
      <span>{children}</span>
      {/* Icon, not the "→" glyph: the bundled Inter subset has no arrows,
          so the text glyph falls back to a wider system font. */}
      {arrow && <ArrowRight aria-hidden className='size-[1em] shrink-0' strokeWidth={2.25} />}
    </>
  )
}

export function VipButton({
  variant,
  size,
  arrow,
  children,
  className,
  ...props
}: Common & Omit<ComponentProps<'button'>, keyof Common>) {
  return (
    <button type='button' className={vipButtonClass({ variant, size, className })} {...props}>
      <Inner arrow={arrow}>{children}</Inner>
    </button>
  )
}

export function VipButtonLink({
  variant,
  size,
  arrow,
  children,
  className,
  ...props
}: Common & Omit<ComponentProps<typeof Link>, keyof Common>) {
  return (
    <Link className={vipButtonClass({ variant, size, className })} {...props}>
      <Inner arrow={arrow}>{children}</Inner>
    </Link>
  )
}
