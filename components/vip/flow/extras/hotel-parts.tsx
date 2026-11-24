'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, BedDouble, Check, Mail, MapPin, Phone, Star, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { VipHotelOption } from '@/features/vip/contract'
import { formatVipPrice } from '@/features/vip/format'
import type { VipHotelInfo, VipHotelRate, VipMoney } from '@/features/vip/normalize'

/* The hotel box's pieces, copied from the travels project's stays screens
   (StaysHotelCard, HotelGallery, StaysRoomPicker, the hotel page's side
   summary) and restyled in the VIP colours. Nothing here imports the
   matchday Stays code. Supplier photos come from any host, so plain <img>. */

const chip = 'inline-flex items-center gap-1 rounded-full bg-vip-line/6 px-2.5 py-0.5 font-mono text-[10px] leading-[16px] text-vip-mist'

export function VipStars({ count, className }: { count: number; className?: string }) {
  const n = Math.max(0, Math.min(5, Math.round(count)))
  if (!n) return null
  return (
    <span className={cn('flex items-center gap-0.5', className)}>
      {Array.from({ length: n }, (_, i) => (
        <Star key={i} aria-hidden className='size-3.5 fill-vip-gold-text text-vip-gold-text' strokeWidth={1} />
      ))}
      <span className='sr-only'>{n} star</span>
    </span>
  )
}

function Photo({ src, alt, className, eager }: { src: string | null | undefined; alt: string; className?: string; eager?: boolean }) {
  const [broken, setBroken] = useState(false)
  if (!src || broken) {
    return (
      <span className={cn('flex items-center justify-center bg-linear-to-br from-vip-gold/20 to-vip-panel', className)}>
        <BedDouble aria-hidden className='size-8 text-vip-gold-text/70' strokeWidth={1.5} />
      </span>
    )
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading={eager ? 'eager' : 'lazy'}
      onError={() => setBroken(true)}
      className={cn('object-cover', className)}
    />
  )
}

/** "From €X" only when the supplier sends a real amount (one never does,
 *  the other may send only a currency). */
export function hotelPriceFrom(h: VipHotelOption): VipMoney | null {
  const a = h.price_from?.amount != null ? Number(h.price_from.amount) : NaN
  return h.price_from && Number.isFinite(a) && a > 0 ? { amount: a, currency: h.price_from.currency } : null
}

/* ── Results card (travels StaysHotelCard) ─────────────────────────── */

export function VipHotelCard({ hotel, index, onOpen }: { hotel: VipHotelOption; index: number; onOpen: () => void }) {
  const from = hotelPriceFrom(hotel)
  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index, 9) * 0.04, duration: 0.35 }}
      className='group overflow-hidden rounded-2xl border border-vip-line/10 bg-vip-card transition-[border-color,box-shadow] hover:border-vip-gold/60 hover:shadow-[0_12px_32px_rgba(212,178,106,0.14)]'
    >
      <div className='flex flex-col sm:flex-row'>
        <div className='relative h-52 w-full shrink-0 overflow-hidden sm:h-auto sm:min-h-[176px] sm:w-56'>
          <Photo
            src={hotel.photos?.[0]}
            alt=''
            className='absolute inset-0 size-full transition-transform duration-500 group-hover:scale-105'
          />
          <VipStars count={hotel.stars} className='absolute bottom-3 left-3 rounded-full bg-vip-ink/60 px-2 py-1' />
        </div>
        <div className='flex flex-1 flex-col justify-between gap-4 p-4 sm:p-5'>
          <div className='flex min-w-0 flex-col gap-1.5'>
            <h4 className='font-heading text-[17px] font-bold leading-[normal] text-vip-chalk sm:text-[18px]'>{hotel.name}</h4>
            {hotel.address && (
              <p className='flex items-start gap-1 text-[12px] leading-[1.4] text-vip-mist'>
                <MapPin aria-hidden className='mt-px size-3 shrink-0' /> {hotel.address}
              </p>
            )}
            {hotel.stars > 0 && (
              <span className='mt-1 flex flex-wrap gap-1.5'>
                <span className={cn(chip, 'bg-vip-gold/12 text-vip-gold-text')}>{Math.round(hotel.stars)}★</span>
              </span>
            )}
          </div>
          <div className='flex flex-wrap items-end justify-between gap-3'>
            <span className='flex flex-col gap-0.5 leading-[normal]'>
              {from ? (
                <>
                  <span className='font-mono text-[10px] uppercase tracking-[0.16em] text-vip-mist'>From · whole stay</span>
                  <span className='font-heading text-[19px] font-bold text-vip-gold-text'>
                    {formatVipPrice(from.amount, from.currency)}
                  </span>
                </>
              ) : (
                <span className='text-[13px] text-vip-mist'>Prices on the next step</span>
              )}
            </span>
            <button
              type='button'
              onClick={onOpen}
              aria-label={`View details: ${hotel.name}`}
              className='inline-flex items-center gap-1.5 rounded-full bg-linear-to-r from-vip-gold-light to-vip-gold px-5 py-2.5 text-[13px] font-semibold leading-[normal] text-[#0a0a0a] transition-[filter] hover:brightness-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-vip-gold-light'
            >
              View details
              <ArrowRight aria-hidden className='size-3.5' strokeWidth={2.25} />
            </button>
          </div>
        </div>
      </div>
    </motion.article>
  )
}

/* ── Gallery (travels HotelGallery: 1, 2, 3, 4 or 5+ photos) ───────── */

export function VipHotelGallery({ images, name }: { images: string[]; name: string }) {
  const box = 'grid h-56 gap-2 overflow-hidden rounded-2xl sm:h-72'
  const cell = 'relative overflow-hidden'
  const img = (src: string, i: number) => <Photo src={src} alt={i === 0 ? name : ''} eager={i === 0} className='absolute inset-0 size-full' />
  const count = images.length
  if (count <= 1) {
    return (
      <div className={cn(box, 'grid-cols-1')}>
        <div className={cell}>{img(images[0] ?? '', 0)}</div>
      </div>
    )
  }
  if (count === 2 || count === 4) {
    return (
      <div className={cn(box, 'grid-cols-2', count === 4 && 'grid-rows-2')}>
        {images.map((s, i) => (
          <div key={s + i} className={cell}>
            {img(s, i)}
          </div>
        ))}
      </div>
    )
  }
  const visible = images.slice(0, 5)
  return (
    <div className={cn(box, 'grid-cols-2', count >= 5 && 'md:grid-cols-[2fr_1fr_1fr]')}>
      <div className={cn(cell, 'row-span-2')}>{img(visible[0], 0)}</div>
      {visible.slice(1).map((s, i) => (
        <div key={s + i} className={cell}>
          {img(s, i + 1)}
        </div>
      ))}
    </div>
  )
}

/* ── About the hotel (only what the supplier sent) ─────────────────── */

export function VipHotelAbout({
  info,
  name,
  address,
}: {
  info: VipHotelInfo
  name: string
  address: string
}) {
  const hasCoords = info.latitude != null && info.longitude != null
  /* No map key in this app: a link to the map instead of an embedded map. */
  const mapHref = hasCoords
    ? `https://www.google.com/maps/search/?api=1&query=${info.latitude},${info.longitude}`
    : address
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${name}, ${address}`)}`
      : null
  const h = 'font-heading text-[16px] font-bold leading-[normal] text-vip-chalk'
  const link = 'inline-flex items-center gap-1.5 font-mono text-[12px] text-vip-gold-text hover:underline'
  return (
    <>
      {info.description.length > 0 && (
        <section className='flex flex-col gap-2'>
          <h4 className={h}>Overview</h4>
          {info.description.map((p, i) => (
            <p key={i} className='text-[13.5px] leading-[1.6] text-vip-mist'>
              {p}
            </p>
          ))}
        </section>
      )}
      {info.amenities.length > 0 && (
        <section className='flex flex-col gap-2'>
          <h4 className={h}>Hotel facilities</h4>
          <span className='flex flex-wrap gap-1.5'>
            {info.amenities.slice(0, 12).map((a) => (
              <span key={a} className={cn(chip, 'capitalize')}>
                {a}
              </span>
            ))}
          </span>
        </section>
      )}
      {(info.phone || info.email || mapHref || info.checkInTime) && (
        <section className='flex flex-col gap-2'>
          <h4 className={h}>Location &amp; contact</h4>
          <span className='flex flex-wrap gap-x-5 gap-y-2'>
            {mapHref && (
              <a href={mapHref} target='_blank' rel='noopener noreferrer' className={link}>
                <MapPin aria-hidden className='size-3.5' /> View on the map
              </a>
            )}
            {info.phone && (
              <a href={`tel:${info.phone.replace(/\s+/g, '')}`} className={link}>
                <Phone aria-hidden className='size-3.5' /> {info.phone}
              </a>
            )}
            {info.email && (
              <a href={`mailto:${info.email}`} className={link}>
                <Mail aria-hidden className='size-3.5' /> {info.email}
              </a>
            )}
          </span>
          {info.checkInTime && (
            <p className='font-mono text-[10.5px] leading-[normal] text-vip-mist'>
              Check-in from {info.checkInTime}
              {info.checkOutTime ? ` · Check-out until ${info.checkOutTime}` : ''}
            </p>
          )}
        </section>
      )}
    </>
  )
}

/* ── Room picker (travels StaysRoomPicker) ─────────────────────────── */

const ROOMS_SHOWN = 8

export function VipRoomPicker({
  rates,
  selected,
  onSelect,
  nights,
}: {
  rates: VipHotelRate[]
  selected: string | null
  onSelect: (rateId: string) => void
  nights: number | null
}) {
  const [shown, setShown] = useState(ROOMS_SHOWN)
  return (
    <div className='flex flex-col gap-3' role='radiogroup' aria-label='Rooms'>
      {rates.slice(0, shown).map((r) => {
        const active = selected === r.rateId
        const perNight = nightly(r, nights)
        const styled = !!r.mainRoomType && !!r.miscRoomType && r.roomName.includes(r.mainRoomType) && r.roomName.includes(r.miscRoomType)
        return (
          <motion.button
            key={r.rateId}
            type='button'
            role='radio'
            aria-checked={active}
            onClick={() => onSelect(r.rateId)}
            whileHover={{ y: -2 }}
            className={cn(
              'w-full rounded-2xl border p-4 text-left transition-[border-color,background-color,box-shadow] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-vip-gold-light',
              active
                ? 'border-vip-gold/80 bg-vip-gold/7 shadow-[0_0_14px_rgba(212,178,106,0.18)]'
                : 'border-vip-line/10 bg-vip-card hover:border-vip-gold/40',
            )}
          >
            <span className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4'>
              <span className='flex min-w-0 flex-1 items-start gap-3'>
                <span
                  aria-hidden
                  className={cn(
                    'mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border-2 transition-colors',
                    active ? 'border-vip-gold bg-vip-gold text-[#111111]' : 'border-vip-line/30',
                  )}
                >
                  {active && <Check className='size-3' strokeWidth={3} />}
                </span>
                {r.image && (
                  <Photo src={r.image} alt='' className='hidden size-16 shrink-0 rounded-xl sm:block' />
                )}
                <span className='flex min-w-0 flex-1 flex-col'>
                  {/* The full room name is always shown (qualifiers included). */}
                  <span className='break-words font-heading text-[15px] font-bold leading-[1.3] text-vip-chalk'>
                    {styled ? r.mainRoomType : r.roomName}
                  </span>
                  {styled && (
                    <span className='mt-0.5 break-words text-[12.5px] font-medium leading-snug text-vip-chalk/75'>
                      {r.miscRoomType}
                    </span>
                  )}
                  {r.board && <span className='mt-0.5 text-[12px] leading-[normal] text-vip-mist'>{r.board}</span>}
                  <span className='mt-2 flex flex-wrap gap-1.5'>
                    {r.bedType && (
                      <span className={cn(chip, 'capitalize')}>
                        <BedDouble aria-hidden className='size-3' /> {r.bedType}
                      </span>
                    )}
                    {r.maxGuests != null && (
                      <span className={chip}>
                        <Users aria-hidden className='size-3' /> Sleeps {r.maxGuests}
                      </span>
                    )}
                    {r.refundable !== null && (
                      <span
                        className={cn(
                          chip,
                          r.refundable ? 'bg-emerald-500/12 text-emerald-600 dark:text-emerald-400' : 'bg-red-500/10 text-red-600 dark:text-red-400',
                        )}
                      >
                        {r.refundable ? (r.freeCancellationBefore ? 'Free cancellation' : 'Refundable') : 'Non-refundable'}
                      </span>
                    )}
                  </span>
                  {r.amenities.length > 0 && (
                    <span className='mt-2 flex flex-wrap gap-1'>
                      {r.amenities.slice(0, 6).map((a) => (
                        <span
                          key={a}
                          className='rounded border border-vip-line/10 bg-vip-line/4 px-1.5 py-0.5 font-mono text-[9px] capitalize leading-[normal] text-vip-mist'
                        >
                          {a}
                        </span>
                      ))}
                    </span>
                  )}
                  {r.payAtProperty && (
                    <span className='mt-2 text-[11.5px] leading-[normal] text-vip-mist'>
                      Plus {formatVipPrice(r.payAtProperty.amount, r.payAtProperty.currency)} paid at the hotel
                    </span>
                  )}
                </span>
              </span>
              <span className='flex shrink-0 items-end justify-between gap-3 border-t border-vip-line/10 pt-3 sm:block sm:border-0 sm:pt-0 sm:text-right'>
                <span className='flex flex-col'>
                  {r.price ? (
                    <>
                      {perNight && (
                        <>
                          <span className='font-heading text-[20px] font-bold leading-[normal] text-vip-gold-text'>
                            {formatVipPrice(perNight.amount, perNight.currency)}
                          </span>
                          <span className='font-mono text-[10px] leading-[normal] text-vip-mist'>per night</span>
                        </>
                      )}
                      <span
                        className={cn(
                          'font-mono leading-[normal]',
                          perNight ? 'mt-0.5 text-[11px] text-vip-mist' : 'font-heading text-[20px] font-bold text-vip-gold-text',
                        )}
                      >
                        {formatVipPrice(r.price.amount, r.price.currency)}
                        {perNight ? ' total' : ''}
                      </span>
                      {!perNight && <span className='font-mono text-[10px] leading-[normal] text-vip-mist'>whole stay</span>}
                    </>
                  ) : (
                    <span className='text-[12.5px] leading-[normal] text-vip-mist'>Price when reserved</span>
                  )}
                </span>
                <span
                  className={cn(
                    'block rounded-full px-4 py-1.5 text-center font-mono text-[11px] font-bold leading-[normal] transition-colors sm:mt-2',
                    active ? 'bg-linear-to-r from-vip-gold-light to-vip-gold text-[#111111]' : 'border border-vip-line/20 text-vip-mist',
                  )}
                >
                  {active ? (
                    <span className='inline-flex items-center gap-1'>
                      <Check aria-hidden className='size-3' strokeWidth={3} /> Selected
                    </span>
                  ) : (
                    'Select'
                  )}
                </span>
              </span>
            </span>
          </motion.button>
        )
      })}
      {rates.length > shown && (
        <button
          type='button'
          onClick={() => setShown((n) => n + ROOMS_SHOWN)}
          className='self-center rounded-full border border-vip-line/20 px-5 py-2.5 text-[13px] font-semibold leading-[normal] text-vip-chalk hover:border-vip-gold/75 hover:text-vip-gold-text'
        >
          Show more rooms ({rates.length - shown})
        </button>
      )}
    </div>
  )
}

/** Per night: the supplier's own figure, else the stay total ÷ nights. */
export function nightly(r: VipHotelRate, nights: number | null): VipMoney | null {
  if (r.pricePerNight) return r.pricePerNight
  if (r.price && nights && nights > 0) return { amount: r.price.amount / nights, currency: r.price.currency }
  return null
}

export function BackLink({ onClick, children }: { onClick: () => void; children: string }) {
  return (
    <button
      type='button'
      onClick={onClick}
      className='inline-flex w-fit items-center gap-1.5 font-mono text-[11px] leading-[normal] text-vip-mist hover:text-vip-chalk'
    >
      <ArrowLeft aria-hidden className='size-3.5' /> {children}
    </button>
  )
}
