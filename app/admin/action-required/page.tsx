import type { Metadata } from 'next'
import { Suspense } from 'react'
import ActionRequiredClient from './client'

export const metadata: Metadata = {
  title: 'Action required | Golafly Admin',
  description: 'Paid bookings the supplier could not complete, waiting on CS.',
}

export default function AdminActionRequiredPage() {
  return (
    <Suspense fallback={null}>
      <ActionRequiredClient />
    </Suspense>
  )
}
