'use client'

import { motion } from 'framer-motion'
import { Check, BedDouble, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getFreeCancellationLabel, isStayRateRefundable } from '@/features/stays/format'
import type { StayRoom } from '@/features/stays/types'
import { Pagination } from '@/components/pagination'
import { stayDisplayPrice } from '@/features/stays/price'
import { RoomName } from './room-name'

const ROOMS_PER_PAGE = 8

function sym(code: string): string {
  const MAP: Record<string, string> = {
    EUR: '€',
    USD: '$',
    GBP: '£',
    JPY: '¥',
    CHF: 'CHF',
    AED: 'AED',
    SAR: 'SAR',
    AUD: 'A$',
    CAD: 'C$',
  }
  return MAP[code] ?? code
}

interface Props {
  rooms: StayRoom[]
  selectedRoomId: string | null
  onSelect: (bookHash: string) => void
  roomPage: number
  onPageChange: (p: number) => void
}

export function StaysRoomPicker({
  rooms,
  selectedRoomId,
  onSelect,
  roomPage,
  onPageChange,
}: Props) {
  const totalPages = Math.ceil(rooms.length / ROOMS_PER_PAGE)
  const pagedRooms = rooms.slice(
    (roomPage - 1) * ROOMS_PER_PAGE,
    roomPage * ROOMS_PER_PAGE,
  )

  if (rooms.length === 0) {
    return (
      <p className='text-[13px] text-muted-foreground'>
        No rooms available for the selected dates.
      </p>
    )
  }

  return (
    <div>
      <div className='space-y-3'>
        {pagedRooms.map((room) => {
          const active = selectedRoomId === room.book_hash
          const isFree = isStayRateRefundable(room)
          const cancellationLabel = getFreeCancellationLabel(room)
          const s = sym(room.currency)

          return (
            <motion.div
              key={room.book_hash}
              onClick={() => onSelect(room.book_hash)}
              whileHover={{ y: -2 }}
              className={cn(
                'cursor-pointer rounded-2xl border p-4 transition-all',
                active
                  ? 'border-brand-text bg-primary/5 shadow-[0_0_14px_var(--brand-glow)]'
                  : 'border-border bg-card hover:border-brand-text/30',
              )}
            >
              <div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4'>
                <div className='flex min-w-0 flex-1 items-start gap-3'>
                  <div
                    className={cn(
                      'mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border-2 transition-colors',
                      active
                        ? 'border-brand-text bg-primary text-primary-foreground'
                        : 'border-muted-foreground/40',
                    )}
                  >
                    {active && <Check className='size-3' strokeWidth={3} />}
                  </div>
                  <div className='min-w-0 flex-1'>
                    <RoomName
                      room={room}
                      titleClassName='font-heading text-[15px] font-bold text-foreground'
                    />
                    <p className='mt-0.5 text-[12px] capitalize text-muted-foreground'>
                      {room.meal_type?.replace(/-/g, ' ')}
                    </p>
                    <div className='mt-2 flex flex-wrap gap-1.5'>
                      {room.bed_type && (
                        <span className='inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 font-mono text-[10px] text-muted-foreground'>
                          <BedDouble className='size-3' /> {room.bed_type}
                        </span>
                      )}
                      <span className='inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 font-mono text-[10px] text-muted-foreground'>
                        <Users className='size-3' /> Sleeps {room.max_guests}
                      </span>
                      <span
                        className={cn(
                          'rounded-full px-2 py-0.5 font-mono text-[10px]',
                          isFree
                            ? 'bg-emerald-500/10 text-emerald-500'
                            : 'bg-destructive/10 text-destructive',
                        )}
                      >
                        {isFree ? (cancellationLabel ? 'Free cancellation' : 'Refundable') : 'Non-refundable'}
                      </span>
                    </div>
                    {room.amenities.length > 0 && (
                      <div className='mt-2 flex flex-wrap gap-1'>
                        {room.amenities.slice(0, 6).map((a) => (
                          <span
                            key={a}
                            className='rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[9px] capitalize text-muted-foreground'
                          >
                            {a.replace(/-/g, ' ')}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className='flex shrink-0 items-end justify-between gap-3 border-t border-border pt-3 sm:block sm:border-0 sm:pt-0 sm:text-right'>
                  <div>
                    <p className='font-heading text-xl font-bold text-brand-text'>
                      {s}
                      {stayDisplayPrice(room).perNight.toFixed(2)}
                    </p>
                    <p className='font-mono text-[10px] text-muted-foreground'>
                      per night
                    </p>
                    <p className='mt-0.5 font-mono text-[11px] text-muted-foreground'>
                      {s}
                      {stayDisplayPrice(room).total.toFixed(2)} total
                    </p>
                  </div>
                  <span
                    className={cn(
                      'block rounded-full px-4 py-1.5 text-center font-mono text-[11px] font-bold transition-colors sm:mt-2',
                      active
                        ? 'bg-primary text-primary-foreground'
                        : 'border border-border text-muted-foreground',
                    )}
                  >
                    {active ? '✓ Selected' : 'Select'}
                  </span>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      {totalPages > 1 && (
        <div className='mt-4'>
          <Pagination
            page={roomPage}
            totalPages={totalPages}
            onPage={onPageChange}
          />
        </div>
      )}
    </div>
  )
}
