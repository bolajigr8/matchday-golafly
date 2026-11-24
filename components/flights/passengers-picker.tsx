'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, Minus, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface FlightPassengersValue {
  adults: number
  childrenAges: number[]
  infants: number
}

interface Props {
  value: FlightPassengersValue
  onChange: (value: FlightPassengersValue) => void
  /** Use on dark/translucent backgrounds. */
  dark?: boolean
}

const MAX_TOTAL_PASSENGERS = 9
const MIN_CHILD_AGE = 2
const MAX_CHILD_AGE = 11
const PANEL_WIDTH = 288 // w-72

function summaryLabel(v: FlightPassengersValue) {
  const parts = [`${v.adults} Adult${v.adults !== 1 ? 's' : ''}`]
  if (v.childrenAges.length > 0)
    parts.push(
      `${v.childrenAges.length} Child${v.childrenAges.length !== 1 ? 'ren' : ''}`,
    )
  if (v.infants > 0)
    parts.push(`${v.infants} Infant${v.infants !== 1 ? 's' : ''}`)
  return parts.join(', ')
}

export function FlightPassengersPicker({
  value,
  onChange,
  dark = false,
}: Props) {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(
    null,
  )
  const triggerRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  // Portals need a browser document — guard for SSR.
  useEffect(() => setMounted(true), [])

  const updatePosition = useCallback(() => {
    const el = triggerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    // Anchor the panel's right edge to the trigger's right edge, flipping
    // to the left edge if it would otherwise overflow off the viewport.
    let left = rect.right - PANEL_WIDTH
    if (left < 8) left = Math.max(8, rect.left)
    const maxLeft = window.innerWidth - PANEL_WIDTH - 8
    left = Math.min(left, maxLeft)
    setCoords({ top: rect.bottom + 8, left })
  }, [])

  useEffect(() => {
    if (!open) return
    updatePosition()
    window.addEventListener('scroll', updatePosition, true)
    window.addEventListener('resize', updatePosition)
    return () => {
      window.removeEventListener('scroll', updatePosition, true)
      window.removeEventListener('resize', updatePosition)
    }
  }, [open, updatePosition])

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      const target = e.target as Node
      if (
        triggerRef.current &&
        !triggerRef.current.contains(target) &&
        panelRef.current &&
        !panelRef.current.contains(target)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  const total = value.adults + value.childrenAges.length + value.infants

  function setAdults(n: number) {
    const adults = Math.max(1, Math.min(MAX_TOTAL_PASSENGERS, n))
    const infants = Math.min(value.infants, adults) // an infant always needs an adult
    onChange({ ...value, adults, infants })
  }
  function addChild() {
    if (total >= MAX_TOTAL_PASSENGERS) return
    onChange({ ...value, childrenAges: [...value.childrenAges, MIN_CHILD_AGE] })
  }
  function removeLastChild() {
    if (value.childrenAges.length === 0) return
    onChange({ ...value, childrenAges: value.childrenAges.slice(0, -1) })
  }
  function setChildAge(index: number, age: number) {
    const next = [...value.childrenAges]
    next[index] = age
    onChange({ ...value, childrenAges: next })
  }
  function setInfants(n: number) {
    const infants = Math.max(0, Math.min(value.adults, n))
    onChange({ ...value, infants })
  }

  const panel = open && coords && (
    <div
      ref={panelRef}
      style={{
        position: 'fixed',
        top: coords.top,
        left: coords.left,
        width: PANEL_WIDTH,
      }}
      className={cn(
        'z-[999] rounded-xl border p-4 shadow-xl',
        dark
          ? 'border-white/10 bg-zinc-900/95 backdrop-blur-xl'
          : 'border-border bg-background',
      )}
    >
      <Stepper
        label='Adults'
        sub='12+ years'
        value={value.adults}
        dark={dark}
        onDecrement={() => setAdults(value.adults - 1)}
        onIncrement={() => setAdults(value.adults + 1)}
        disableDecrement={value.adults <= 1}
        disableIncrement={total >= MAX_TOTAL_PASSENGERS}
      />

      <div
        className={cn(
          'mt-4 border-t pt-4',
          dark ? 'border-white/10' : 'border-border/60',
        )}
      >
        <div className='flex items-center justify-between'>
          <div>
            <p
              className={cn(
                'text-[13px] font-medium',
                dark ? 'text-white' : 'text-foreground',
              )}
            >
              Children
            </p>
            <p
              className={cn(
                'font-mono text-[10px]',
                dark ? 'text-white/40' : 'text-muted-foreground',
              )}
            >
              2–11 years
            </p>
          </div>
          <div className='flex items-center gap-3'>
            <StepperButton
              icon={Minus}
              onClick={removeLastChild}
              disabled={value.childrenAges.length === 0}
              dark={dark}
            />
            <span
              className={cn(
                'w-4 text-center text-[13px] font-bold',
                dark ? 'text-white' : 'text-foreground',
              )}
            >
              {value.childrenAges.length}
            </span>
            <StepperButton
              icon={Plus}
              onClick={addChild}
              disabled={total >= MAX_TOTAL_PASSENGERS}
              dark={dark}
            />
          </div>
        </div>

        {value.childrenAges.length > 0 && (
          <div className='mt-3 space-y-2'>
            {value.childrenAges.map((age, i) => (
              <div key={i} className='flex items-center justify-between gap-2'>
                <span
                  className={cn(
                    'font-mono text-[11px]',
                    dark ? 'text-white/60' : 'text-muted-foreground',
                  )}
                >
                  Child {i + 1} age
                </span>
                <select
                  value={age}
                  onChange={(e) => setChildAge(i, Number(e.target.value))}
                  style={dark ? { colorScheme: 'dark' } : undefined}
                  className={cn(
                    'rounded-lg border px-2 py-1 text-[12px] font-medium outline-none',
                    dark
                      ? 'border-white/10 bg-white/5 text-white'
                      : 'border-border bg-muted text-foreground',
                  )}
                >
                  {Array.from(
                    { length: MAX_CHILD_AGE - MIN_CHILD_AGE + 1 },
                    (_, k) => MIN_CHILD_AGE + k,
                  ).map((a) => (
                    <option
                      key={a}
                      value={a}
                      className='bg-white text-zinc-900 dark:bg-zinc-900 dark:text-white'
                    >
                      {a} yrs
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        )}
      </div>

      <div
        className={cn(
          'mt-4 border-t pt-4',
          dark ? 'border-white/10' : 'border-border/60',
        )}
      >
        <Stepper
          label='Infants'
          sub='Under 2, on lap'
          value={value.infants}
          dark={dark}
          onDecrement={() => setInfants(value.infants - 1)}
          onIncrement={() => setInfants(value.infants + 1)}
          disableDecrement={value.infants <= 0}
          disableIncrement={
            value.infants >= value.adults || total >= MAX_TOTAL_PASSENGERS
          }
        />
        {value.infants >= value.adults && value.adults > 0 && (
          <p
            className={cn(
              'mt-1.5 font-mono text-[10px]',
              dark ? 'text-amber-300' : 'text-amber-600',
            )}
          >
            Each infant travels on an accompanying adult&apos;s lap — add
            another adult for more infants.
          </p>
        )}
      </div>

      <button
        type='button'
        onClick={() => setOpen(false)}
        className='mt-4 w-full rounded-lg bg-primary py-2 text-[12px] font-bold text-primary-foreground'
      >
        Done
      </button>
    </div>
  )

  return (
    <div ref={triggerRef} className='relative w-full'>
      <button
        type='button'
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'flex w-full items-center justify-between gap-2 text-left text-[13px] font-medium outline-none',
          dark ? 'text-white' : 'text-foreground',
        )}
      >
        <span className='truncate'>{summaryLabel(value)}</span>
        <ChevronDown
          className={cn(
            'size-3.5 shrink-0',
            dark ? 'text-white/50' : 'text-muted-foreground',
          )}
        />
      </button>

      {mounted && panel ? createPortal(panel, document.body) : null}
    </div>
  )
}

function Stepper({
  label,
  sub,
  value,
  onDecrement,
  onIncrement,
  disableDecrement,
  disableIncrement,
  dark,
}: {
  label: string
  sub: string
  value: number
  onDecrement: () => void
  onIncrement: () => void
  disableDecrement?: boolean
  disableIncrement?: boolean
  dark?: boolean
}) {
  return (
    <div className='flex items-center justify-between'>
      <div>
        <p
          className={cn(
            'text-[13px] font-medium',
            dark ? 'text-white' : 'text-foreground',
          )}
        >
          {label}
        </p>
        <p
          className={cn(
            'font-mono text-[10px]',
            dark ? 'text-white/40' : 'text-muted-foreground',
          )}
        >
          {sub}
        </p>
      </div>
      <div className='flex items-center gap-3'>
        <StepperButton
          icon={Minus}
          onClick={onDecrement}
          disabled={disableDecrement}
          dark={dark}
        />
        <span
          className={cn(
            'w-4 text-center text-[13px] font-bold',
            dark ? 'text-white' : 'text-foreground',
          )}
        >
          {value}
        </span>
        <StepperButton
          icon={Plus}
          onClick={onIncrement}
          disabled={disableIncrement}
          dark={dark}
        />
      </div>
    </div>
  )
}

function StepperButton({
  icon: Icon,
  onClick,
  disabled,
  dark,
}: {
  icon: typeof Plus
  onClick: () => void
  disabled?: boolean
  dark?: boolean
}) {
  return (
    <button
      type='button'
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'grid size-6 place-items-center rounded-full border transition-colors disabled:opacity-30',
        dark
          ? 'border-white/20 text-white hover:border-primary/50'
          : 'border-border text-foreground hover:border-primary/50',
      )}
    >
      <Icon className='size-3' />
    </button>
  )
}
