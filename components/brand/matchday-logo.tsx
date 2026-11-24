import type { CSSProperties } from 'react'
import { cn } from '@/lib/utils'
import { GOLAFLY_MARK, GOLAFLY_WORDMARK } from './golafly-paths'

/* Golafly Matchday sub-brand: a die-cut match ticket (outline only, tilted
   −8°) holding the Golafly winged ball, next to the GOLAFLY wordmark and a
   "—— MATCHDAY ——" subline in live text. Same lockup structure as Travel
   and Academy (icon + wordmark + ruled subline).

   Colours come from CSS vars set in globals.css (.md-logo):
     light  → everything in the foreground ink, no neon
     dark   → neon ticket and ball, white wordmark, mist subline
   `tone="onDark"` forces the dark palette on ink bands in light mode. */

const TICKET =
  'M8 0H103A9 9 0 0 0 121 0H142A8 8 0 0 1 150 8V88A8 8 0 0 1 142 96H121A9 9 0 0 0 103 96H8A8 8 0 0 1 0 88V8A8 8 0 0 1 8 0Z'

const line: CSSProperties = {
  fill: 'none',
  stroke: 'var(--md-line, currentColor)',
  strokeWidth: 'var(--md-stroke, 2)',
  strokeLinejoin: 'round',
}

const perforation: CSSProperties = {
  stroke: 'var(--md-line, currentColor)',
  strokeWidth: 'calc(var(--md-stroke, 2) * 0.6)',
  strokeDasharray: 'calc(var(--md-stroke, 2) * 1.5) calc(var(--md-stroke, 2) * 1.5)',
  strokeLinecap: 'round',
}

export function MatchdayTicket({ className }: { className?: string }) {
  return (
    <svg
      viewBox='-9 -13 168 122'
      aria-hidden
      focusable='false'
      className={cn('overflow-visible', className)}
    >
      <g transform='rotate(-8 75 48)'>
        <path d={TICKET} style={line} />
        <line x1={112} y1={16} x2={112} y2={80} style={perforation} />
        <svg
          x={10}
          y={13}
          width={90}
          height={70}
          viewBox={GOLAFLY_MARK.viewBox}
          style={{ fill: 'var(--md-mark, currentColor)' }}
        >
          {GOLAFLY_MARK.paths.map((d) => (
            <path key={d.slice(0, 24)} d={d} fillRule='evenodd' />
          ))}
        </svg>
      </g>
    </svg>
  )
}

export function GolaflyWordmark({ className }: { className?: string }) {
  return (
    <svg viewBox={GOLAFLY_WORDMARK.viewBox} aria-hidden focusable='false' className={className}>
      {GOLAFLY_WORDMARK.paths.map((d) => (
        <path key={d.slice(0, 24)} d={d} fillRule='evenodd' />
      ))}
    </svg>
  )
}

type LogoSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

/**
 * `size` sets the ticket height (xs 28 · sm 34 · md 42 · lg 64 · xl 96 px)
 * and a matching line weight. Override per breakpoint with
 * `[--md-h:..px]` utilities if needed.
 */
export function MatchdayLogo({
  variant = 'full',
  size = 'md',
  tone = 'auto',
  className,
}: {
  variant?: 'full' | 'icon'
  size?: LogoSize
  tone?: 'auto' | 'onDark'
  className?: string
}) {
  return (
    <span
      role='img'
      aria-label='Golafly Matchday'
      translate='no'
      data-tone={tone}
      className={cn('notranslate md-logo', `md-logo--${size}`, className)}
    >
      <MatchdayTicket className='md-logo__icon' />
      {variant === 'full' && (
        <span className='md-logo__type' aria-hidden>
          <GolaflyWordmark className='md-logo__word' />
          <span className='md-logo__sub'>
            <span>Matchday</span>
          </span>
        </span>
      )}
    </span>
  )
}
