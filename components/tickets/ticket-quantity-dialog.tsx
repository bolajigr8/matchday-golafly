'use client'

import { useEffect, useState } from 'react'
import { Dialog as DialogPrimitive } from 'radix-ui'
import { ArrowRight, ShieldCheck, Ticket, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  useTicketQuantity,
  ANY_QUANTITY,
  type QuantityChoice,
} from '@/store/ticket-quantity'

/* "How many tickets do you need?" — partner-marketplace quantity step.
   Mounted once in components/providers.tsx. Opened by enterBuilder()
   (features/builder/enter.ts) or directly from the seats page's
   "2 tickets" pill to change the answer. */

type Option = { key: string; label: string; qty: number | null; plus?: boolean }

const OPTIONS: Option[] = [
  { key: 'any', label: 'Any', qty: null },
  { key: '1', label: '1', qty: 1 },
  { key: '2', label: '2', qty: 2 },
  { key: '3', label: '3', qty: 3 },
  { key: '4', label: '4', qty: 4 },
  { key: '5', label: '5', qty: 5 },
  { key: '6', label: '6', qty: 6 },
  { key: '7+', label: '7+', qty: 7, plus: true },
]

function keyOf(c: QuantityChoice): string {
  if (c.qty === null) return 'any'
  return c.qtyPlus || c.qty >= 7 ? '7+' : String(c.qty)
}

export function TicketQuantityDialog() {
  const request = useTicketQuantity((s) => s.request)
  const close = useTicketQuantity((s) => s.close)
  const setMounted = useTicketQuantity((s) => s.setMounted)

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [setMounted])

  return (
    <DialogPrimitive.Root open={!!request} onOpenChange={(o) => !o && close()}>
      {request && (
        <QuantityBody
          // Remount per request so each opening starts from its own initial value
          key={`${request.matchId}:${JSON.stringify(request.initial ?? {})}`}
          title={request.title}
          initial={{ ...ANY_QUANTITY, ...request.initial }}
          onSubmit={(choice) => {
            const cb = request.onContinue
            close()
            cb(choice)
          }}
        />
      )}
    </DialogPrimitive.Root>
  )
}

function QuantityBody({
  title,
  initial,
  onSubmit,
}: {
  title?: string
  initial: QuantityChoice
  onSubmit: (c: QuantityChoice) => void
}) {
  const [selected, setSelected] = useState(keyOf(initial))
  const [together, setTogether] = useState(initial.seatedTogether)
  const option = OPTIONS.find((o) => o.key === selected) ?? OPTIONS[0]
  const canGroup = option.qty !== null && option.qty > 1
  const groupOn = canGroup && together

  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className='fixed inset-0 z-[60] bg-ticket-ink/35 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 dark:bg-black/60' />
      <DialogPrimitive.Content
        aria-describedby={undefined}
        className='fixed left-1/2 top-1/2 z-[60] w-[calc(100%-2rem)] max-w-[360px] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl bg-ticket-surface text-foreground shadow-2xl ring-1 ring-ticket-line outline-none data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95'
      >
        <div className='flex items-start justify-between gap-3 px-5 pt-5 pb-4'>
          <div className='min-w-0'>
            <DialogPrimitive.Title className='text-[17px] font-semibold leading-snug text-ticket-ink'>
              How many tickets do you need?
            </DialogPrimitive.Title>
            {title && (
              <p className='mt-0.5 truncate text-xs text-muted-foreground'>{title}</p>
            )}
          </div>
          <DialogPrimitive.Close
            aria-label='Close'
            className='-mr-1 -mt-0.5 rounded-full p-1 text-ticket-ink transition-colors hover:bg-ticket-soft focus-visible:outline-2 focus-visible:outline-ticket'
          >
            <X className='size-4' />
          </DialogPrimitive.Close>
        </div>

        <div className='border-t border-dashed border-ticket-line px-5 pt-5 pb-4'>
          <div role='radiogroup' aria-label='Number of tickets' className='grid grid-cols-4 gap-2.5'>
            {OPTIONS.map((o) => {
              const active = o.key === selected
              return (
                <button
                  key={o.key}
                  type='button'
                  role='radio'
                  aria-checked={active}
                  onClick={() => setSelected(o.key)}
                  className={cn(
                    'h-11 rounded-lg border text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ticket',
                    active
                      ? 'border-ticket-soft bg-ticket-soft text-ticket-soft-foreground'
                      : 'border-ticket-line bg-ticket-surface text-ticket-ink hover:border-ticket/50',
                  )}
                >
                  {o.label}
                </button>
              )
            })}
          </div>

          <div className='mt-5 flex items-center justify-between gap-3'>
            <label
              htmlFor='seated-together'
              className={cn(
                'text-[13px] font-semibold text-ticket-ink',
                !canGroup && 'opacity-50',
              )}
            >
              Seated together
            </label>
            <button
              id='seated-together'
              type='button'
              role='switch'
              aria-checked={groupOn}
              disabled={!canGroup}
              onClick={() => setTogether((v) => !v)}
              className={cn(
                'relative h-[22px] w-10 shrink-0 rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ticket disabled:cursor-not-allowed disabled:opacity-50',
                groupOn ? 'bg-ticket' : 'bg-muted-foreground/35',
              )}
            >
              <span
                className={cn(
                  'absolute top-[3px] left-[3px] size-4 rounded-full bg-white shadow transition-transform',
                  groupOn && 'translate-x-[18px]',
                )}
              />
            </button>
          </div>
          {groupOn ? (
            <p className='mt-2 flex items-center gap-1.5 text-xs text-muted-foreground'>
              <ShieldCheck className='size-3.5 text-ticket-ink' />
              Only listings whose seller guarantees {option.plus ? `${option.qty}+` : option.qty} seats side by side
            </p>
          ) : !canGroup ? (
            <p className='mt-2 text-xs text-muted-foreground'>
              Pick 2 or more tickets to sit together.
            </p>
          ) : null}

          <div className='mt-5 grid grid-cols-[auto_1fr] gap-2.5'>
            <button
              type='button'
              onClick={() => onSubmit(ANY_QUANTITY)}
              className='h-12 rounded-lg bg-muted px-5 text-sm font-semibold text-ticket-ink transition-colors hover:bg-muted/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ticket'
            >
              Skip
            </button>
            <button
              type='button'
              onClick={() =>
                onSubmit({
                  qty: option.qty,
                  qtyPlus: Boolean(option.plus),
                  seatedTogether: groupOn,
                })
              }
              className='inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-ticket px-5 text-sm font-semibold text-ticket-foreground transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ticket'
            >
              Continue <ArrowRight className='size-4' />
            </button>
          </div>
        </div>

        <div className='flex items-center gap-2 border-t border-ticket-line px-5 py-3.5 text-xs text-muted-foreground'>
          <Ticket className='size-3.5 shrink-0' />
          Next, pick your seats on the stadium map.
        </div>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  )
}
