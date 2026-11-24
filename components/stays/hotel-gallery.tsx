// components/stays/hotel-gallery.tsx
'use client'

import { cn } from '@/lib/utils'
import { HotelImage } from './hotel-image'

interface HotelGalleryProps {
  images: string[] // already collated/sized — pass collateGalleryImages() output
  hotelName: string
  onViewAll?: () => void
}

export function HotelGallery({
  images,
  hotelName,
  onViewAll,
}: HotelGalleryProps) {
  const count = images.length

  if (count === 0) {
    return (
      <div className='mb-6 h-64 overflow-hidden rounded-2xl sm:h-80 md:h-96'>
        <HotelImage
          hotelImageUrl={null}
          alt={hotelName}
          fill
          className='object-cover'
        />
      </div>
    )
  }

  // 1 image — single full-bleed hero
  if (count === 1) {
    return (
      <div className='relative mb-6 h-64 overflow-hidden rounded-2xl sm:h-80 md:h-96'>
        <HotelImage
          hotelImageUrl={images[0]}
          cdnSize='1024x768'
          alt={hotelName}
          fill
          sizes='100vw'
          className='object-cover'
          priority
        />
      </div>
    )
  }

  // 2 images — even split, side by side
  if (count === 2) {
    return (
      <div className='mb-6 grid h-64 grid-cols-2 gap-2 overflow-hidden rounded-2xl sm:h-80 md:h-96'>
        {images.map((img, i) => (
          <div key={i} className='relative overflow-hidden'>
            <HotelImage
              hotelImageUrl={img}
              cdnSize='1024x768'
              alt={i === 0 ? hotelName : ''}
              fill
              sizes='50vw'
              className='object-cover'
              priority={i === 0}
            />
          </div>
        ))}
      </div>
    )
  }

  // 3 images — big left, two stacked right
  if (count === 3) {
    return (
      <div className='mb-6 grid h-64 grid-cols-2 gap-2 overflow-hidden rounded-2xl sm:h-80 md:h-96'>
        <div className='relative row-span-2 overflow-hidden'>
          <HotelImage
            hotelImageUrl={images[0]}
            cdnSize='1024x768'
            alt={hotelName}
            fill
            sizes='(max-width: 768px) 50vw, 66vw'
            className='object-cover'
            priority
          />
        </div>
        {images.slice(1, 3).map((img, i) => (
          <div key={i} className='relative overflow-hidden'>
            <HotelImage
              hotelImageUrl={img}
              cdnSize='1024x768'
              alt=''
              fill
              sizes='(max-width: 768px) 50vw, 33vw'
              className='object-cover'
            />
          </div>
        ))}
      </div>
    )
  }

  // 4 images — even 2x2 grid
  if (count === 4) {
    return (
      <div className='mb-6 grid h-64 grid-cols-2 grid-rows-2 gap-2 overflow-hidden rounded-2xl sm:h-80 md:h-96'>
        {images.map((img, i) => (
          <div key={i} className='relative overflow-hidden'>
            <HotelImage
              hotelImageUrl={img}
              cdnSize='1024x768'
              alt={i === 0 ? hotelName : ''}
              fill
              sizes='50vw'
              className='object-cover'
              priority={i === 0}
            />
          </div>
        ))}
      </div>
    )
  }

  // 5+ images — original layout: big left, 2 top-right, 2 bottom-right,
  // with a "View all images" overlay on the last visible cell.
  const visible = images.slice(0, 5)
  return (
    <div className='mb-6 grid h-64 grid-cols-2 gap-2 overflow-hidden rounded-2xl sm:h-80 md:h-96 md:grid-cols-[2fr_1fr_1fr]'>
      <div className='relative row-span-2 overflow-hidden'>
        <HotelImage
          hotelImageUrl={visible[0]}
          cdnSize='1024x768'
          alt={hotelName}
          fill
          sizes='(max-width: 768px) 50vw, 800px'
          className='object-cover'
          priority
        />
      </div>
      {visible.slice(1).map((img, i) => {
        const isLast = i === visible.slice(1).length - 1
        return (
          <div key={i} className='relative overflow-hidden'>
            <HotelImage
              hotelImageUrl={img}
              cdnSize='1024x768'
              alt=''
              fill
              sizes='400px'
              className='object-cover'
            />
            {/* "View all images" overlay temporarily disabled — re-enable
          once there's a real lightbox/gallery view to link it to.
      {isLast && (
        <button
          onClick={onViewAll}
          className={cn(
            'absolute inset-0 flex items-center justify-center bg-black/45',
            onViewAll && 'cursor-pointer hover:bg-black/45',
          )}
        >
          <span className='font-mono text-[11px] font-bold text-white'>
            View all images
          </span>
        </button>
      )}
      */}
          </div>
        )
      })}
    </div>
  )
}
