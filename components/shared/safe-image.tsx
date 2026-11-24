'use client'

import Image, { type ImageProps } from 'next/image'
import { useState } from 'react'

const FALLBACK_IMAGE =
  'data:image/svg+xml;charset=UTF-8,' +
  encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#111111"/>
          <stop offset="100%" stop-color="#1c1f1a"/>
        </linearGradient>
      </defs>
      <rect width="800" height="600" fill="url(#g)"/>
      <g opacity="0.06">
        <path d="M-40 220 L400 40 L440 70 L0 260 Z" fill="#a3ff00"/>
        <path d="M-40 340 L520 90 L540 120 L-20 380 Z" fill="#a3ff00"/>
      </g>
      <circle cx="400" cy="270" r="46" fill="none" stroke="#a3ff00" stroke-width="3" opacity="0.6"/>
      <path d="M400 232 L423 249 L414 276 L386 276 L377 249 Z" fill="#a3ff00" opacity="0.6"/>
      <text x="400" y="360" text-anchor="middle" font-family="sans-serif" font-size="20" font-weight="700" letter-spacing="4" fill="#a3ff00" opacity="0.7">GOLAFLY</text>
    </svg>
  `)

type SafeImageProps = Omit<ImageProps, 'onError' | 'src'> & {
  src?: string | null
}

export function SafeImage({ src, alt, ...props }: SafeImageProps) {
  const [errored, setErrored] = useState(false)
  const resolvedSrc = !src || errored ? FALLBACK_IMAGE : src

  return (
    <Image
      {...props}
      src={resolvedSrc}
      alt={alt}
      unoptimized={resolvedSrc === FALLBACK_IMAGE}
      onError={() => setErrored(true)}
    />
  )
}
