'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

// Ported from Travels' components/esim/plan/esim-plan-sidebar.tsx. This
// is general educational copy about how eSIMs work, not simulated
// product/pricing data — the actual package list, prices, and
// availability still come from the live eSIM API, same as before.
const FAQS = [
  {
    q: 'Is my phone compatible with eSIM?',
    a: 'Most phones released since 2019 support eSIM (iPhone XS and newer, Google Pixel 3+, recent Samsung Galaxy). Make sure your device is eSIM-capable and carrier-unlocked.',
  },
  {
    q: 'When does my plan start?',
    a: 'Your plan starts when you first connect to the network at your destination. It does not start when you install the eSIM.',
  },
  {
    q: 'Can I keep my regular number?',
    a: 'Yes. The eSIM works alongside your existing SIM. Your regular number stays active for calls and texts.',
  },
  {
    q: 'Do I get a phone number with the eSIM?',
    a: 'No. The eSIM provides data only. You keep your regular number on your existing SIM for calls and texts.',
  },
  {
    q: 'What happens when my data runs out?',
    a: 'Your data connection will stop. You can purchase a top-up or a new plan through the website.',
  },
]

export function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className='overflow-hidden rounded-xl border border-border bg-card'>
      <button
        type='button'
        onClick={() => setOpen((o) => !o)}
        className='flex w-full items-center justify-between px-5 py-4 text-left text-sm font-bold'
      >
        {q}
        {open ? (
          <ChevronUp className='size-4 shrink-0 text-muted-foreground' />
        ) : (
          <ChevronDown className='size-4 shrink-0 text-muted-foreground' />
        )}
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            transition={{ duration: 0.22 }}
            className='overflow-hidden'
          >
            <p className='px-5 pb-4 text-sm text-muted-foreground'>{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function EsimFaqSection() {
  return (
    <section className='pb-4'>
      <h3 className='mb-3 text-[13px] font-bold text-foreground'>
        Frequently Asked Questions
      </h3>
      <div className='space-y-2'>
        {FAQS.map((f) => (
          <FaqItem key={f.q} q={f.q} a={f.a} />
        ))}
      </div>
    </section>
  )
}
