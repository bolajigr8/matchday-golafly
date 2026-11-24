import { Suspense } from 'react'
import type { Metadata } from 'next'
import { CheckoutTicketsConfirmClient } from './client'
import { NO_INDEX } from '@/lib/seo'

export const metadata: Metadata = {
  robots: NO_INDEX,
  title: 'Confirming your tickets | Golafly',
  description: 'We are confirming your ticket order.',
}

export default function CheckoutTicketsConfirmPage() {
  return (
    <Suspense
      fallback={
        <div className='page-container py-10 sm:py-12'>
          <div className='mt-6 animate-pulse space-y-4'>
            <div className='h-40 rounded-xl bg-muted' />
          </div>
        </div>
      }
    >
      <CheckoutTicketsConfirmClient />
    </Suspense>
  )
}
