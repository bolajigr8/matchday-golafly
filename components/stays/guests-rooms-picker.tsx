'use client'

import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Plus, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { StayGuest } from '@/features/stays/types'
import {
  MAX_ADULTS_PER_ROOM,
  MAX_CHILDREN_PER_ROOM,
  MAX_ROOMS_PER_BOOKING,
  MAX_CHILD_AGE,
  addRoom,
  removeRoom,
  setRoomAdults,
  setRoomChildAge,
  setRoomChildCount,
  summarizeGuests,
} from '@/features/stays/utils'

// The value this widget edits IS the exact `guests` array the Stays API
// expects: one entry per room, e.g.
//   [{ adults: 2, children: [] }, { adults: 1, children: [8] }]
// No even-split guessing happens anywhere downstream any more — what
// the user assembles here is sent to /search-hp and /prebook unchanged.
export type GuestsRoomsValue = StayGuest[]

interface Props {
  value: GuestsRoomsValue
  onChange: (v: GuestsRoomsValue) => void
  dark?: boolean
  className?: string
}

export function GuestsRoomsPicker({ value, onChange, dark, className }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [open])

  return (
    <div ref={ref} className={cn('relative', className)}>
      <button
        type='button'
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'flex w-full items-center justify-between gap-2 text-left text-[13px] font-medium outline-none',
          dark ? 'text-white' : 'text-foreground',
        )}
      >
        <span className='truncate'>{summarizeGuests(value)}</span>
        <ChevronDown
          className={cn(
            'size-3.5 shrink-0 transition-transform',
            dark ? 'text-white/50' : 'text-muted-foreground',
            open && 'rotate-180',
          )}
        />
      </button>

      {open && (
        <div className='absolute right-0 top-full z-50 mt-2 w-[min(320px,calc(100vw-2rem))] rounded-2xl border border-border bg-card p-4 text-foreground shadow-2xl'>
          <div className='max-h-[60vh] space-y-4 overflow-y-auto pr-1'>
            {value.map((room, roomIndex) => (
              <div
                key={roomIndex}
                className='rounded-xl border border-border bg-background p-3'
              >
                <div className='mb-2 flex items-center justify-between'>
                  <p className='font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground'>
                    Room {roomIndex + 1}
                  </p>
                  {value.length > 1 && (
                    <button
                      type='button'
                      onClick={() => onChange(removeRoom(value, roomIndex))}
                      className='flex items-center gap-1 font-mono text-[10px] text-muted-foreground hover:text-destructive'
                    >
                      <Trash2 className='size-3' /> Remove
                    </button>
                  )}
                </div>

                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-[13px] font-bold'>Adults</p>
                    <p className='text-[11px] text-muted-foreground'>Ages 18+</p>
                  </div>
                  <Stepper
                    value={room.adults}
                    min={1}
                    max={MAX_ADULTS_PER_ROOM}
                    onChange={(n) =>
                      onChange(setRoomAdults(value, roomIndex, n))
                    }
                  />
                </div>

                <div className='mt-3 flex items-center justify-between'>
                  <div>
                    <p className='text-[13px] font-bold'>Children</p>
                    <p className='text-[11px] text-muted-foreground'>
                      Ages 0–17
                    </p>
                  </div>
                  <Stepper
                    value={room.children.length}
                    min={0}
                    max={MAX_CHILDREN_PER_ROOM}
                    onChange={(n) =>
                      onChange(setRoomChildCount(value, roomIndex, n))
                    }
                  />
                </div>

                {room.children.length > 0 && (
                  <div className='mt-2 space-y-2 border-t border-border pt-2'>
                    {room.children.map((age, childIndex) => (
                      <div
                        key={childIndex}
                        className='flex items-center justify-between gap-2'
                      >
                        <span className='text-[12px] text-muted-foreground'>
                          Child {childIndex + 1} age
                        </span>
                        <Select
                          value={String(age)}
                          onValueChange={(v) =>
                            onChange(
                              setRoomChildAge(
                                value,
                                roomIndex,
                                childIndex,
                                Number(v),
                              ),
                            )
                          }
                        >
                          <SelectTrigger
                            aria-label={`Age of child ${childIndex + 1}`}
                            className='h-auto rounded-lg px-2 py-1 text-[12px]'
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: MAX_CHILD_AGE + 1 }, (_, a) => (
                              <SelectItem
                                key={a}
                                value={String(a)}
                                className='text-[12px]'
                              >
                                {a === 0 ? 'Under 1' : `${a} yr${a !== 1 ? 's' : ''}`}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <button
            type='button'
            disabled={value.length >= MAX_ROOMS_PER_BOOKING}
            onClick={() => onChange(addRoom(value))}
            className='mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-border py-2 font-mono text-[11px] font-bold text-primary disabled:cursor-not-allowed disabled:opacity-40'
          >
            <Plus className='size-3.5' /> Add another room
          </button>

          <button
            type='button'
            onClick={() => setOpen(false)}
            className='mt-3 w-full rounded-full bg-primary py-2 font-mono text-[12px] font-bold text-primary-foreground'
          >
            Done
          </button>
        </div>
      )}
    </div>
  )
}

function Stepper({
  value,
  min,
  max,
  onChange,
}: {
  value: number
  min: number
  max: number
  onChange: (v: number) => void
}) {
  return (
    <div className='flex items-center gap-2'>
      <button
        type='button'
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        className='grid size-7 place-items-center rounded-full border border-border text-foreground disabled:opacity-30'
      >
        −
      </button>
      <span className='w-4 text-center text-[13px] font-medium'>{value}</span>
      <button
        type='button'
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        className='grid size-7 place-items-center rounded-full border border-border text-foreground disabled:opacity-30'
      >
        +
      </button>
    </div>
  )
}
