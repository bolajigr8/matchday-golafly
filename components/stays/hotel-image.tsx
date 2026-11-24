'use client'

import { useState } from 'react'
import Image, { type ImageProps } from 'next/image'
import { ImageOff } from 'lucide-react'
import { cn } from '@/lib/utils'
import { resolveImage } from '@/features/stays/stay-images'

type Props = Omit<ImageProps, 'src'> & {
  hotelImageUrl?: unknown
  cdnSize?: string // any value is safe — automatically coerced to a valid CDN size
}

export function HotelImage({
  hotelImageUrl,
  cdnSize = '240x240',
  className,
  alt,
  fill,
  ...rest
}: Props) {
  const [failed, setFailed] = useState(false)

  // Reset the failure flag whenever the underlying image (or requested
  // size) changes — otherwise a component instance that's reused for a
  // different image (e.g. a recycled list/carousel slot) gets stuck
  // showing the placeholder forever after its first failed load, even
  // once it's been handed a perfectly valid new URL.
  //
  // Adjusted during the render rather than in an effect: that way the
  // placeholder never paints once against the new image before resetting.
  const imageKey = `${hotelImageUrl}|${cdnSize}`
  const [lastImageKey, setLastImageKey] = useState(imageKey)
  if (lastImageKey !== imageKey) {
    setLastImageKey(imageKey)
    setFailed(false)
  }

  const resolved = resolveImage(hotelImageUrl, cdnSize)
  const src = failed ? null : resolved

  if (!src) {
    return (
      <div
        className={cn(
          'flex items-center justify-center bg-muted',
          fill ? 'absolute inset-0' : '',
          className,
        )}
      >
        <ImageOff className='size-6 text-muted-foreground/40' />
      </div>
    )
  }

  return (
    <Image
      src={src}
      alt={alt ?? ''}
      className={className}
      fill={fill}
      onError={() => setFailed(true)}
      // Supplier CDNs (ETG, Duffel) are not in next.config's image hosts:
      // load them as-is, like the other supplier photos on this site.
      unoptimized
      {...rest}
    />
  )
}

/** @deprecated returns '' when nothing resolves — prefer <HotelImage> */
export function resolveHotelImg(url?: unknown, size = '240x240'): string {
  return resolveImage(url, size) ?? ''
}
