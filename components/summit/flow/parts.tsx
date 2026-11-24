'use client'

import { Fragment, useId, type ComponentProps, type ReactNode } from 'react'
import Link from 'next/link'
import { ArrowLeft, Check, Minus, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SUMMIT_STEPS, summitLandingHref, summitStepHref, type SummitStep } from '@/features/summit/routes'
import type { SummitEvent } from '@/features/summit/types'
import { SummitFlowFooter } from '../footer'

/* Shared pieces of the four booking steps (Figma "WFS London · 2 Ticket",
   "3 Trip", "4 Pay", "5 Confirmed"). */

/* ── Stepper (Figma "Summit · Stepper") ─────────────────────────────── */
export function SummitStepper({ event, current }: { event: SummitEvent; current: SummitStep }) {
  const at = SUMMIT_STEPS.findIndex((s) => s.key === current)
  return (
    <ol aria-label='Booking steps' className='flex items-center gap-2 sm:gap-3.5'>
      {SUMMIT_STEPS.map((s, i) => {
        const done = i < at
        const active = i === at
        const dot = (
          <span
            className={cn(
              'flex size-7 shrink-0 items-center justify-center rounded-full border font-mono text-[12px] font-medium leading-none',
              active && 'border-wfs-lime bg-wfs-lime text-wfs-on-lime',
              done && 'border-[#121212] bg-[#121212] text-white dark:border-wfs-strong dark:bg-wfs-surface dark:text-wfs-text',
              !active && !done && 'border-wfs-line bg-wfs-surface text-wfs-text',
            )}
          >
            {done ? <Check aria-hidden className='size-3.5' strokeWidth={2.6} /> : i + 1}
          </span>
        )
        const label = (
          <span
            className={cn(
              'text-[14px] leading-[normal] max-md:hidden',
              active ? 'font-semibold text-wfs-text' : done ? 'font-medium text-wfs-text' : 'font-medium text-wfs-step',
            )}
          >
            {s.label}
          </span>
        )
        return (
          <Fragment key={s.key}>
            {i > 0 && <li aria-hidden className={cn('h-px w-5 sm:w-14', i <= at ? 'bg-[#121212] dark:bg-[#e6e6e6]' : 'bg-wfs-hair')} />}
            <li aria-current={active ? 'step' : undefined}>
              {/* Steps already done are links back; later ones are not reachable yet. */}
              {done && current !== 'confirmed' ? (
                <Link
                  href={summitStepHref(event.key, s.key)}
                  className='flex items-center gap-2.5 rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wfs-lime'
                >
                  {dot}
                  {label}
                  <span className='sr-only md:hidden'>{s.label}</span>
                </Link>
              ) : (
                <span className='flex items-center gap-2.5'>
                  {dot}
                  {label}
                  <span className='sr-only md:hidden'>{s.label}</span>
                </span>
              )}
            </li>
          </Fragment>
        )
      })}
    </ol>
  )
}

/* ── Page frame: top row (back + stepper), heading, body, footer ───── */
export function SummitFlowPage({
  event,
  step,
  back,
  kicker,
  title,
  sub,
  children,
}: {
  event: SummitEvent
  step: SummitStep
  /** Top-left: a link back, or plain text (the booking reference). */
  back: { href?: string; label: string }
  kicker?: string
  title?: string
  sub?: string
  children: ReactNode
}) {
  return (
    <>
      <div className='page-container flex flex-col gap-7 pb-16 pt-7 lg:pb-24 lg:pt-9'>
        <div className='flex flex-wrap items-center justify-between gap-4'>
          {back.href ? (
            <Link
              href={back.href}
              className='inline-flex items-center gap-1.5 rounded-sm font-mono text-[12.5px] font-medium leading-[normal] text-wfs-muted hover:text-wfs-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wfs-lime'
            >
              <ArrowLeft aria-hidden className='size-3.5' strokeWidth={2} />
              {back.label}
            </Link>
          ) : (
            <span className='font-mono text-[12.5px] font-medium leading-[normal] text-wfs-muted'>{back.label}</span>
          )}
          <SummitStepper event={event} current={step} />
        </div>
        {title && (
          <div className='flex max-w-[760px] flex-col gap-2 pt-1'>
            <p className='font-mono text-[11px] font-medium leading-[normal] tracking-[1.54px] text-wfs-lime-ink'>{kicker}</p>
            <h1 className='font-display text-[48px] leading-[1.1] text-wfs-text sm:text-[60px] sm:leading-[1.2]'>{title}</h1>
            <p className='pt-1 text-[16px] leading-6 text-wfs-muted'>{sub}</p>
          </div>
        )}
        {children}
      </div>
      <SummitFlowFooter />
    </>
  )
}

export const summitBackToLanding = (event: SummitEvent) => ({ href: summitLandingHref(event.key), label: `${event.name} 2027` })

/* ── Card ───────────────────────────────────────────────────────────── */
export function SummitCard({
  title,
  sub,
  aside,
  children,
  className,
}: {
  title?: string
  sub?: string
  aside?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section className={cn('flex flex-col gap-[18px] rounded-[20px] border border-wfs-line bg-wfs-surface p-5 shadow-[var(--wfs-card-shadow)] sm:p-6', className)}>
      {(title || aside) && (
        <div className='flex flex-wrap items-start justify-between gap-x-4 gap-y-3'>
          <div className='flex min-w-0 max-w-[520px] flex-col gap-1'>
            {title && <h2 className='font-heading text-[20px] font-bold leading-[normal] text-wfs-text'>{title}</h2>}
            {sub && <p className='text-[13.5px] leading-[19.6px] text-wfs-muted'>{sub}</p>}
          </div>
          {aside}
        </div>
      )}
      {children}
    </section>
  )
}

/* ── Field (mono label + 44px input) ────────────────────────────────── */
export function SummitField({
  label,
  className,
  ...props
}: { label: string; className?: string } & Omit<ComponentProps<'input'>, 'className'>) {
  const id = useId()
  return (
    <div className={cn('flex min-w-0 flex-col gap-1.5', className)}>
      <label htmlFor={id} className='font-mono text-[10.5px] font-medium uppercase leading-[normal] tracking-[1.05px] text-wfs-label'>
        {label}
      </label>
      <input
        id={id}
        className='h-11 w-full rounded-xl border border-wfs-line bg-wfs-surface px-3.5 text-[14px] leading-[normal] text-wfs-text outline-none transition-colors placeholder:text-wfs-placeholder hover:border-wfs-strong/40 focus:border-[1.5px] focus:border-wfs-strong'
        {...props}
      />
    </div>
  )
}

/* ── Segmented control (Figma "WFS · Segmented · …") ────────────────── */
export function SummitSegmented<T extends string>({
  label,
  options,
  value,
  onChange,
  className,
}: {
  label: string
  options: { key: T; label: string }[]
  value: T
  onChange: (key: T) => void
  className?: string
}) {
  return (
    <div role='radiogroup' aria-label={label} className={cn('flex w-fit max-w-full gap-1 overflow-x-auto rounded-full border border-wfs-line bg-wfs-soft p-1', className)}>
      {options.map((o) => {
        const on = o.key === value
        return (
          <button
            key={o.key}
            type='button'
            role='radio'
            aria-checked={on}
            onClick={() => onChange(o.key)}
            className={cn(
              'h-8 shrink-0 whitespace-nowrap rounded-full px-2.5 text-[13px] min-[400px]:px-3.5 font-medium leading-[normal] transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wfs-lime',
              on ? 'bg-wfs-active text-wfs-on-active' : 'text-wfs-text hover:bg-wfs-hair/60 dark:text-[#bfbfbf]',
            )}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

/* ── Switch (Figma "WFS · Switch": "Included" / "Not needed") ───────── */
export function SummitSwitch({ on, onChange, label }: { on: boolean; onChange: (on: boolean) => void; label: string }) {
  return (
    <button
      type='button'
      role='switch'
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
      className='flex shrink-0 items-center gap-2.5 rounded-full focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-wfs-lime'
    >
      <span className={cn('font-mono text-[11px] font-medium leading-[normal] tracking-[0.88px]', on ? 'text-[#333333] dark:text-[#d9d9d9]' : 'text-[#8c8c8c]')}>
        {on ? 'Included' : 'Not needed'}
      </span>
      <span className={cn('flex h-[22px] w-10 items-center rounded-full p-[3px] transition-colors duration-200', on ? 'bg-[#121212] dark:bg-white/16' : 'bg-[#d5d9d1]')}>
        <span className={cn('size-4 rounded-full transition-transform duration-200', on ? 'translate-x-[18px] bg-wfs-lime' : 'translate-x-0 bg-white dark:bg-[#1c1c1c]')} />
      </span>
    </button>
  )
}

/* ── Quantity (Figma "WFS · Quantity") ──────────────────────────────── */
export function SummitQuantity({
  value,
  min = 1,
  max,
  onChange,
}: {
  value: number
  min?: number
  max: number
  onChange: (n: number) => void
}) {
  const btn =
    'flex size-11 items-center justify-center rounded-full text-wfs-text transition-colors hover:bg-wfs-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wfs-lime disabled:cursor-not-allowed disabled:opacity-30'
  return (
    <div className='flex h-11 shrink-0 items-center rounded-full border border-wfs-strong bg-wfs-surface'>
      <button type='button' aria-label='One attendee fewer' disabled={value <= min} onClick={() => onChange(value - 1)} className={btn}>
        <Minus aria-hidden className='size-3.5' strokeWidth={2.6} />
      </button>
      <span aria-live='polite' className='w-11 text-center font-display text-[22px] leading-none tabular-nums text-wfs-text'>
        {value}
      </span>
      <button type='button' aria-label='One more attendee' disabled={value >= max} onClick={() => onChange(value + 1)} className={btn}>
        <Plus aria-hidden className='size-3.5' strokeWidth={2.6} />
      </button>
    </div>
  )
}

/* ── "Select" / "✓ Selected" pill on flight and hotel options ───────── */
export function SummitPick({ selected, className }: { selected: boolean; className?: string }) {
  return (
    <span
      className={cn(
        'flex h-[34px] w-24 shrink-0 items-center justify-center gap-1 rounded-full border text-[12.5px] font-semibold leading-[normal] transition-colors duration-200',
        selected ? 'border-wfs-lime bg-wfs-lime text-wfs-on-lime' : 'border-wfs-line bg-wfs-surface text-wfs-text',
        className,
      )}
    >
      {selected && <Check aria-hidden className='size-3.5' strokeWidth={2.6} />}
      {selected ? 'Selected' : 'Select'}
    </span>
  )
}

/** Loading block while the saved booking is read. */
export function SummitFlowLoading() {
  return <div aria-hidden className='h-[640px] animate-pulse rounded-[20px] bg-wfs-soft' />
}
