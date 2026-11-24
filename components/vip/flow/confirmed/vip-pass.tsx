'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { CalendarPlus, Plane } from 'lucide-react'
import { VipButton } from '@/components/vip/flow/button'

/* Confirmed → "Pass card" (Figma 506:4460) — the same printer sheet as
 * "VIP · Pass printing / printed (overlay)" (361:2644 / 361:2755): a black
 * slot, and the gold ticket feeding out of it. Printing: the ticket starts
 * hidden above the print window (y −340) and comes out in short pulls,
 * like a receipt printer, until it rests at y 0. */

export interface VipPassData {
  reference: string
  from: string
  to: string
  guest: string
  guests: number
  match: string
  date: string
  hospitality: string
  cabin: string
}

/* Barcode: Figma repeats 1·3·2·2·1px bars with 2px gaps, 70 bars. */
const BARS = Array.from({ length: 70 }, (_, i) => [1, 3, 2, 2, 1][i % 5])

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className='flex flex-col gap-0.5'>
      <span className='font-mono text-[10px] font-medium leading-[normal] tracking-[2px] text-[#5a4a2a]'>{label}</span>
      <span className='text-[14px] font-bold leading-[normal] text-[#17110a]'>{value}</span>
    </div>
  )
}

export function VipPass({ pass, onAddToCalendar }: { pass: VipPassData; onAddToCalendar: () => void }) {
  const reduce = useReducedMotion()
  return (
    <div className='relative mx-auto flex w-full max-w-[520px] flex-col items-center rounded-[28px] border border-vip-line/16 bg-vip-popover px-5 pb-8 pt-8 sm:px-9'>
      {/* Slot */}
      <div className='relative z-10 h-3.5 w-full rounded-full border border-vip-line/16 bg-black shadow-[inset_0_3px_6px_rgba(0,0,0,0.9)]' />
      {/* Print window: clips the ticket while it feeds out */}
      <div className='-mt-1.5 w-[calc(100%-28px)] overflow-hidden'>
        <motion.div
          className='flex flex-col gap-3.5 rounded-b-[22px] bg-linear-to-br from-vip-gold-light to-[#b8893a] px-6 pb-[22px] pt-6 text-[#17110a]'
          initial={reduce ? false : { y: '-100%' }}
          animate={{ y: reduce ? 0 : ['-100%', '-74%', '-74%', '-46%', '-46%', '-20%', '-20%', '0%'] }}
          transition={{ duration: 2.6, ease: 'easeOut', times: [0, 0.16, 0.3, 0.46, 0.6, 0.76, 0.86, 1] }}
        >
          <div className='flex justify-between font-mono text-[11px] font-medium leading-[normal] tracking-[2.2px]'>
            <span>GOLAFLY VIP</span>
            <span>{pass.reference}</span>
          </div>
          <div className='flex items-center justify-between'>
            <span className='font-display text-[48px] leading-[0.9] sm:text-[60px]'>{pass.from}</span>
            <span aria-hidden className='flex items-center gap-1.5 text-[15px] font-bold'>
              <span className='tracking-[4px]'>···</span>
              <Plane className='size-4 rotate-45 fill-[#17110a]' strokeWidth={1} />
              <span className='tracking-[4px]'>···</span>
            </span>
            <span className='font-display text-[48px] leading-[0.9] sm:text-[60px]'>{pass.to}</span>
          </div>
          <div className='grid grid-cols-2 gap-x-4 gap-y-3'>
            <Field label='GUEST' value={pass.guest} />
            <Field label='GUESTS' value={String(pass.guests)} />
            <Field label='MATCH' value={pass.match} />
            <Field label='DATE' value={pass.date} />
            <Field label='HOSPITALITY' value={pass.hospitality} />
            <Field label='CABIN' value={pass.cabin} />
          </div>
          <div aria-hidden className='flex h-[46px] gap-0.5 overflow-hidden'>
            {BARS.map((w, i) => (
              <span key={i} className='h-full shrink-0 bg-[#17110a]' style={{ width: w }} />
            ))}
          </div>
        </motion.div>
      </div>
      <VipButton onClick={onAddToCalendar} className='mt-7 h-[54px] w-full text-[16px]'>
        <span className='flex items-center gap-2'>
          <CalendarPlus aria-hidden className='size-[18px]' strokeWidth={2} />
          Add match to my calendar
        </span>
      </VipButton>
    </div>
  )
}

/* "Add match to my calendar": a real .ics file (opens in Google, Apple
   and Outlook calendars) — kick off to full time at the stadium, with the
   order number. The tickets themselves arrive by email. */
export function downloadVipCalendar(event: {
  reference: string
  title: string
  kickoff: string
  location: string
}) {
  /* 2026-11-22T20:00:00.000Z → 20261122T200000Z */
  const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
  const start = new Date(event.kickoff)
  const end = new Date(start.getTime() + 2 * 3_600_000)
  const esc = (t: string) => t.replace(/([,;\\])/g, '\\$1')
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Golafly//VIP Hospitality//EN',
    'BEGIN:VEVENT',
    `UID:${event.reference}@golafly.com`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(start)}`,
    `DTEND:${stamp(end)}`,
    `SUMMARY:${esc(event.title)} · VIP Hospitality`,
    `LOCATION:${esc(event.location)}`,
    `DESCRIPTION:Golafly VIP booking ${event.reference}. Your confirmations arrive by email.`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
  const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }))
  const a = document.createElement('a')
  a.href = url
  a.download = `golafly-vip-${event.reference}.ics`
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
