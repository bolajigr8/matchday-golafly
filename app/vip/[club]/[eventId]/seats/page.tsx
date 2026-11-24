import type { Metadata } from 'next'
import { NO_INDEX } from '@/lib/seo'
import { VipSeatsClient } from '@/components/vip/flow/seats/seats-client'

type Props = { params: Promise<{ club: string; eventId: string }> }

export const metadata: Metadata = { robots: NO_INDEX, title: 'Choose your hospitality · VIP | Golafly' }

/* VIP Flow · 2 · Seats (Figma 506:3508). */
export default async function VipSeatsPage({ params }: Props) {
  const { club, eventId } = await params
  return <VipSeatsClient club={decodeURIComponent(club)} eventId={Number(eventId)} />
}
