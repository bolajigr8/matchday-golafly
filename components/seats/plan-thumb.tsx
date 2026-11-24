'use client'

/* eslint-disable @next/next/no-img-element -- a local blob: SVG, nothing for next/image to optimise */
import { useState } from 'react'
import { cn } from '@/lib/utils'

/** Mini stadium map on a listing card: the whole plan in grey with this
 *  listing's block(s) filled in its category colour (like FTN's cards). */
export function PlanThumbnail({
  src,
  viewBox,
  outline,
  color,
  label,
  className,
}: {
  src: string
  viewBox: string
  /** Outline markup of the highlighted block(s); empty = whole plan grey. */
  outline: string
  color: string
  label: string
  className?: string
}) {
  const vbW = Number(viewBox.split(/[\s,]+/)[2]) || 1000
  // If the image ever fails, hide it rather than show a broken-image icon;
  // the highlighted block outline still renders on its own.
  const [failedSrc, setFailedSrc] = useState<string | null>(null)
  return (
    <div
      role='img'
      aria-label={label}
      className={cn(
        'relative aspect-[4/3] w-20 shrink-0 overflow-hidden rounded-lg border border-border/60 bg-muted/40 @[33rem]:w-24',
        className,
      )}
    >
      {failedSrc !== src && (
        <img
          src={src}
          alt=''
          className='absolute inset-0 size-full object-contain p-1'
          draggable={false}
          onError={() => setFailedSrc(src)}
        />
      )}
      {outline && (
        <svg
          viewBox={viewBox}
          preserveAspectRatio='xMidYMid meet'
          className='absolute inset-0 size-full p-1'
          aria-hidden
        >
          <g
            fill={color}
            stroke='#ffffff'
            strokeWidth={vbW / 400}
            dangerouslySetInnerHTML={{ __html: outline }}
          />
        </svg>
      )}
    </div>
  )
}
