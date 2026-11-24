'use client'

import { MapPin, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { CookiebotIframe } from '@/components/shared/cookiebot-iframe'

interface HotelMapProps {
  latitude: number
  longitude: number
  name: string
  address: string
}

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

export function HotelMap({
  latitude,
  longitude,
  name,
  address,
}: HotelMapProps) {
  const hasCoords = Number.isFinite(latitude) && Number.isFinite(longitude)
  const query = hasCoords ? `${latitude},${longitude}` : address
  const embedSrc = `https://www.google.com/maps/embed/v1/place?key=${GOOGLE_MAPS_API_KEY}&q=${encodeURIComponent(
    query,
  )}&zoom=16`
  const directionsUrl = hasCoords
    ? `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`
    : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`

  if (!GOOGLE_MAPS_API_KEY) {
    return (
      <div className='flex h-48 flex-col items-center justify-center gap-2 rounded-xl border border-border bg-muted text-center'>
        <MapPin className='size-6 text-muted-foreground' />
        <p className='px-4 text-[11px] text-muted-foreground'>{address}</p>
        {/* No Maps key on this deployment: link out instead of an embed. */}
        <Link
          href={directionsUrl}
          target='_blank'
          rel='noopener noreferrer'
          className='font-mono text-[11px] font-bold text-brand-text hover:underline'
        >
          Open in Google Maps
        </Link>
      </div>
    )
  }

  return (
    <div className='overflow-hidden rounded-xl border border-border'>
      <div className='relative h-56 w-full sm:h-64'>
        <CookiebotIframe
          consentCategory='preferences'
          consentMessage='The map is provided by Google and requires preference cookie consent.'
          title={`Map showing ${name}`}
          src={embedSrc}
          width='100%'
          height='100%'
          style={{ border: 0 }}
          loading='lazy'
          referrerPolicy='no-referrer-when-downgrade'
          allowFullScreen
          className='absolute inset-0'
        />
      </div>
      <div className='flex items-center justify-between gap-3 bg-card px-4 py-3'>
        <div className='min-w-0'>
          <p className='truncate text-[12px] font-medium text-foreground'>
            {name}
          </p>
          <p className='truncate font-mono text-[10px] text-muted-foreground'>
            {address}
          </p>
        </div>
        <Link
          href={directionsUrl}
          target='_blank'
          rel='noopener noreferrer'
          className='flex shrink-0 items-center gap-1 rounded-full border border-brand-text/40 bg-primary/10 px-3 py-1.5 font-mono text-[10px] font-bold text-brand-text hover:bg-primary/20'
        >
          Directions <ExternalLink className='size-3' />
        </Link>
      </div>
    </div>
  )
}
