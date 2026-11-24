import type { Metadata } from 'next'
import { Suspense } from 'react'
import VipPackagesClient from './client'

export const metadata: Metadata = {
  title: 'VIP packages | Golafly Admin',
  description: 'VIP hospitality packages: match ticket, flight, hotel and eSIM in one payment.',
}

export default function AdminVipPackagesPage() {
  return (
    <Suspense fallback={null}>
      <VipPackagesClient />
    </Suspense>
  )
}
