import type { ComponentProps, ReactNode } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

/* Small shared pieces of the World Football Summit screens (Figma "WFS").
   Text sizes are pixel values on purpose: Figma's sizes carry no built-in
   line height, and the page wrapper sets `leading-[normal]`. */

type Variant = 'lime' | 'dark' | 'ghost' | 'ghostDark'

/* Figma "WFS · Button": 48px pill, Inter 600 15px; on hover the fill
   lightens and the arrow slides 6px. Ghost styles carry a 1px border. */
const BASE =
  'group/btn inline-flex h-12 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full px-6 text-[15px] font-semibold leading-[normal] transition-[background-color,box-shadow,border-color,opacity] duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wfs-lime disabled:cursor-not-allowed disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50'

const VARIANTS: Record<Variant, string> = {
  lime: 'bg-wfs-lime text-wfs-on-lime hover:bg-[#cbff4d] hover:shadow-[0_8px_24px_rgba(183,255,10,0.35)]',
  dark: 'bg-[#0a0c0a] text-white hover:bg-[#262a26]',
  ghost: 'border border-wfs-line bg-wfs-surface text-wfs-text hover:bg-wfs-soft',
  ghostDark: 'border border-white/30 text-white hover:bg-white/8',
}

export function wfsButtonClass(variant: Variant = 'lime', className?: string) {
  return cn(BASE, VARIANTS[variant], className)
}

function Inner({ arrow, children }: { arrow?: boolean; children: ReactNode }) {
  return (
    <>
      <span>{children}</span>
      {/* An icon, not "→": the bundled fonts are latin subsets without arrows. */}
      {arrow && (
        <ArrowRight
          aria-hidden
          className='size-[15px] shrink-0 transition-transform duration-200 group-hover/btn:translate-x-1.5 motion-reduce:transition-none'
          strokeWidth={2.4}
        />
      )}
    </>
  )
}

interface Common {
  variant?: Variant
  arrow?: boolean
  className?: string
  children: ReactNode
}

export function WfsButton({ variant, arrow, className, children, ...props }: Common & Omit<ComponentProps<'button'>, keyof Common>) {
  return (
    <button type='button' className={wfsButtonClass(variant, className)} {...props}>
      <Inner arrow={arrow}>{children}</Inner>
    </button>
  )
}

export function WfsButtonLink({ variant, arrow, className, children, ...props }: Common & Omit<ComponentProps<typeof Link>, keyof Common>) {
  return (
    <Link className={wfsButtonClass(variant, className)} {...props}>
      <Inner arrow={arrow}>{children}</Inner>
    </Link>
  )
}

/** Four-point star used between marquee words and on the partner seal. */
export function Spark({ className }: { className?: string }) {
  return (
    <svg viewBox='0 0 14 14' aria-hidden focusable='false' className={className}>
      <path d='M7 0c.6 3.9 3.1 6.4 7 7-3.9.6-6.4 3.1-7 7-.6-3.9-3.1-6.4-7-7 3.9-.6 6.4-3.1 7-7Z' fill='currentColor' />
    </svg>
  )
}

/** Mono section label: "01 · YOUR TICKET". */
export function WfsEyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={cn('font-mono text-[11.5px] font-medium leading-[normal] tracking-[1.84px] text-wfs-lime-ink', className)}>
      {children}
    </p>
  )
}

/** Small pill: lime (default), dark outline, or soft. */
export function WfsChip({
  children,
  tone = 'lime',
  className,
}: {
  children: ReactNode
  tone?: 'lime' | 'ink' | 'soft'
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 font-mono text-[10.5px] font-medium leading-[normal]',
        tone === 'lime' && 'border-wfs-lime bg-wfs-lime text-wfs-on-lime',
        tone === 'ink' && 'border-[#2a2e2a] bg-[#141714] text-white',
        tone === 'soft' && 'border-wfs-line bg-wfs-soft text-wfs-text',
        className,
      )}
    >
      {children}
    </span>
  )
}

/** Lime circle with a tick (proof cards, ticket checks). */
export function WfsTick({ size = 18, className }: { size?: number; className?: string }) {
  return (
    <span
      aria-hidden
      style={{ width: size, height: size }}
      className={cn('inline-flex shrink-0 items-center justify-center rounded-full bg-wfs-lime text-wfs-on-lime', className)}
    >
      <svg viewBox='0 0 12 12' style={{ width: size * 0.5, height: size * 0.5 }} fill='none'>
        <path d='M2 6.4 4.8 9 10 3.4' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' />
      </svg>
    </span>
  )
}
