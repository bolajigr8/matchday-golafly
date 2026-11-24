import { Suspense } from 'react'
import type { Metadata } from 'next'
import { CheckoutTicketsClient } from './client'
import { NO_INDEX } from '@/lib/seo'

export const metadata: Metadata = {
  robots: NO_INDEX,
  title: 'Ticket Checkout | Golafly',
  description: 'Confirm your details and pay for your match tickets.',
}

export default function CheckoutTicketsPage() {
  return (
    <Suspense
      fallback={
        <div className='page-container py-10 sm:py-12'>
          <div className='mt-6 animate-pulse space-y-4'>
            <div className='h-40 rounded-xl bg-muted' />
            <div className='h-48 rounded-xl bg-muted' />
          </div>
        </div>
      }
    >
      <CheckoutTicketsClient />
    </Suspense>
  )
}
