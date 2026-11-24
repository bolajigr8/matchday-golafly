'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { Loader2, MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface DestinationOption {
  id: string
  label: string
  sub?: string | null
}

/**
 * "Destination" box of the hotel search: type a city, pick one of the
 * supplier's places. Drawn like the flight search fields (SearchStripField).
 */
export function DestinationField({
  value,
  onType,
  options,
  loading,
  selectedId,
  onPick,
  error,
  placeholder = 'City or region',
}: {
  value: string
  onType: (text: string) => void
  options: DestinationOption[]
  loading: boolean
  selectedId: string | null
  onPick: (option: DestinationOption) => void
  error?: string | null
  placeholder?: string
}) {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const rootRef = useRef<HTMLDivElement>(null)
  const listId = useId()

  useEffect(() => {
    if (!open) return
    function onDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  function pick(option: DestinationOption) {
    onPick(option)
    setOpen(false)
  }

  const showList = open && value.trim().length >= 2

  return (
    <div ref={rootRef} className='relative min-w-0 flex-[2] basis-[220px]'>
      <div
        className={cn(
          'flex h-full min-w-0 flex-col justify-center rounded-xl border border-border bg-muted px-3.5 py-2 transition-colors focus-within:border-primary/50',
          error && 'border-destructive',
        )}
      >
        <span className='font-mono text-[9px] uppercase tracking-[0.1em] text-muted-foreground'>Destination</span>
        <div className='flex min-w-0 items-center gap-2'>
          <MapPin aria-hidden className='size-3.5 shrink-0 text-muted-foreground' />
          <input
            value={value}
            onChange={(e) => {
              onType(e.target.value)
              setActive(0)
              setOpen(true)
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={(e) => {
              if (!showList || options.length === 0) return
              if (e.key === 'ArrowDown') {
                e.preventDefault()
                setActive((i) => Math.min(options.length - 1, i + 1))
              } else if (e.key === 'ArrowUp') {
                e.preventDefault()
                setActive((i) => Math.max(0, i - 1))
              } else if (e.key === 'Enter') {
                e.preventDefault()
                pick(options[Math.min(active, options.length - 1)])
              } else if (e.key === 'Escape') {
                setOpen(false)
              }
            }}
            placeholder={placeholder}
            role='combobox'
            aria-expanded={showList}
            aria-controls={listId}
            aria-autocomplete='list'
            aria-label='Destination'
            className='w-full min-w-0 bg-transparent text-[13px] font-semibold text-foreground outline-none placeholder:font-normal placeholder:text-muted-foreground'
          />
          {loading && <Loader2 className='size-3.5 shrink-0 animate-spin text-muted-foreground' />}
        </div>
      </div>
      {error && <p className='mt-1 font-mono text-[10px] text-destructive'>{error}</p>}

      {showList && (
        <ul
          id={listId}
          role='listbox'
          className='absolute left-0 top-full z-50 mt-2 max-h-72 w-full min-w-[260px] overflow-y-auto rounded-2xl border border-border bg-card p-1.5 shadow-2xl'
        >
          {options.length === 0 ? (
            <li className='px-3 py-3 text-[12px] text-muted-foreground'>
              {loading ? 'Searching places…' : 'No places match this name.'}
            </li>
          ) : (
            options.map((o, i) => (
              <li
                key={o.id}
                role='option'
                aria-selected={o.id === selectedId}
                onMouseEnter={() => setActive(i)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(o)}
                className={cn(
                  'flex cursor-pointer flex-col rounded-lg px-3 py-2',
                  i === active && 'bg-muted',
                  o.id === selectedId && 'text-brand-text',
                )}
              >
                <span className='text-[13px] font-semibold'>{o.label}</span>
                {o.sub && <span className='text-[11px] text-muted-foreground'>{o.sub}</span>}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  )
}
