import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { NO_INDEX } from '@/lib/seo'
import { getSummitEvent } from '@/features/summit/api'
import { SummitConfirmedClient } from '@/components/summit/flow/confirmed-client'

export const metadata: Metadata = {
  title: 'Booking confirmed · World Football Summit | Golafly',
  robots: NO_INDEX,
}

/* Only an event that is on sale has booking steps (Riyadh has no dates yet). */
export default async function Page({ params }: { params: Promise<{ event: string }> }) {
  const { event: key } = await params
  const event = getSummitEvent(key)
  if (!event || !event.onSale) notFound()
  return <SummitConfirmedClient event={event} />
}
