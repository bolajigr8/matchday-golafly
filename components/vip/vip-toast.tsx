'use client'

import { toast } from 'sonner'

/* VIP toasts (Figma "VIP · Toast · Pass saved" 513:5774): a dark pill with a gold hairline, a 20px gold icon and
   14px medium text. Shown through the site's existing sonner Toaster. Dark in both themes
   (the `dark` class), as in the light-mode designs. */

function CheckIcon() {
  return (
    <svg aria-hidden viewBox='0 0 20 20' className='size-5 shrink-0'>
      <circle cx='10' cy='10' r='9.2' fill='#d4b26a' />
      <path d='M6 10.3l2.6 2.6L14.2 7.5' fill='none' stroke='#0d0d0d' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' />
    </svg>
  )
}

const TEXT = {
  /* Confirmed → "Add match to my calendar" (client request: tickets are
     emailed, so the page offers a calendar event instead of a download). */
  calendar: 'Match saved to your calendar.',
}

export function showVipToast(kind: keyof typeof TEXT) {
  const text = TEXT[kind]
  toast.custom(
    () => (
      <div
        role='status'
        className='dark flex items-center gap-3 rounded-full border border-vip-gold/50 bg-[#171a17] py-4 pl-[18px] pr-[22px] text-[14px] font-medium leading-[normal] text-vip-chalk shadow-[0_12px_32px_rgba(0,0,0,0.45)]'
      >
        <CheckIcon />
        {text}
      </div>
    ),
    { id: `vip-${kind}`, duration: 4000 },
  )
}
