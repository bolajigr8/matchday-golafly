import { Metadata } from 'next'
import { Suspense } from 'react'
import PaymentSuccessClient from './client'
import { NO_INDEX } from '@/lib/seo'

export const metadata: Metadata = {
  robots: NO_INDEX,
  title: 'Payment Status | Golafly',
  description: 'Check the status of your Golafly payment and booking.',
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={null}>
      <PaymentSuccessClient />
    </Suspense>
  )
}
