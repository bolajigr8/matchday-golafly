import { Suspense } from 'react'
import type { Metadata } from 'next'
import { PayClient } from './client'
import { NO_INDEX } from '@/lib/seo'

export const metadata: Metadata = {
  robots: NO_INDEX,
  title: 'Checkout | Golafly',
  description:
    'Review and confirm every item in your matchday booking, then pay once for everything.',
}

export default function PayPage() {
  return (
    <Suspense
      fallback={
        <div className="page-container py-10 sm:py-12">
          <div className="mt-6 animate-pulse space-y-4">
            <div className="h-40 rounded-xl bg-muted" />
            <div className="h-48 rounded-xl bg-muted" />
          </div>
        </div>
      }
    >
      <PayClient />
    </Suspense>
  )
}
