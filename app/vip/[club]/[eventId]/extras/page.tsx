import type { Metadata } from 'next'
import { NO_INDEX } from '@/lib/seo'
import { VipExtrasClient } from '@/components/vip/flow/extras/extras-client'

type Props = { params: Promise<{ club: string; eventId: string }> }

export const metadata: Metadata = { robots: NO_INDEX, title: 'Build your VIP trip | Golafly' }

/* VIP Flow · 3 · Extras (Figma 506:3828). */
export default async function VipExtrasPage({ params }: Props) {
  const { club, eventId } = await params
  return <VipExtrasClient club={decodeURIComponent(club)} eventId={Number(eventId)} />
}
