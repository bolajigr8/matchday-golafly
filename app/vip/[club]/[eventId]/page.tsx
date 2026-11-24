import type { Metadata } from 'next'
import { NO_INDEX } from '@/lib/seo'
import { VipMatchClient } from '@/components/vip/flow/match/match-client'

type Props = { params: Promise<{ club: string; eventId: string }> }

export const metadata: Metadata = {
  /* Kept out of search while VIP is being built. Remove at launch. */
  robots: NO_INDEX,
  title: 'VIP Hospitality | Golafly',
}

/* VIP Flow · 1 · Match (Figma 504:2985). */
export default async function VipMatchPage({ params }: Props) {
  const { club, eventId } = await params
  return <VipMatchClient club={decodeURIComponent(club)} eventId={Number(eventId)} />
}
