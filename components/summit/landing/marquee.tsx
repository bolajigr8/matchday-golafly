import { Fragment } from 'react'
import { SUMMIT_AUDIENCES } from '@/features/summit/mock-data'
import { Spark } from '../ui'

/* Figma "WFS · Marquee": lime band, the audiences sliding left for ever.
   Two identical halves, moved by exactly one half, so the loop has no seam. */
export function SummitMarquee() {
  const half = (hidden: boolean) => (
    <div aria-hidden={hidden || undefined} className='flex shrink-0 items-center gap-9 pr-9'>
      {SUMMIT_AUDIENCES.map((word) => (
        <Fragment key={word}>
          <span className='font-display text-[26px] leading-[1.2] text-wfs-on-lime'>{word}</span>
          <Spark className='size-[13px] text-wfs-on-lime' />
        </Fragment>
      ))}
    </div>
  )
  return (
    <div className='flex h-14 items-center overflow-hidden bg-wfs-lime'>
      <div className='wfs-marquee flex w-max'>
        {half(false)}
        {half(true)}
        {half(true)}
        {half(true)}
      </div>
    </div>
  )
}
