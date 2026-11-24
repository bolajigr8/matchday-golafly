import type { Metadata } from 'next'
import { NO_INDEX } from '@/lib/seo'
import { VipCheckoutClient } from '@/components/vip/flow/checkout/checkout-client'

type Props = { params: Promise<{ club: string; eventId: string }> }

export const metadata: Metadata = { robots: NO_INDEX, title: 'Checkout · VIP | Golafly' }

/* VIP Flow · 4 · Checkout (Figma 506:4207). */
export default async function VipCheckoutPage({ params }: Props) {
  const { club, eventId } = await params
  return <VipCheckoutClient club={decodeURIComponent(club)} eventId={Number(eventId)} />
}
