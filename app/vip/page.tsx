import type { Metadata } from 'next'
import { canonical, NO_INDEX } from '@/lib/seo'
import { VipClient } from './client'

export const metadata: Metadata = {
  alternates: canonical('/vip'),
  title: 'VIP Football Hospitality: Matchday, First Class | Golafly',
  description:
    'Hospitality seats at Spain’s biggest home matches, Business or First Class flights, a 4 or 5 star hotel and an eSIM, booked in one checkout.',
  /* Kept out of search while VIP is being built. Remove at launch. */
  robots: NO_INDEX,
}

type Props = { searchParams: Promise<{ club?: string | string[] }> }

export default async function VipPage({ searchParams }: Props) {
  const { club } = await searchParams
  return <VipClient initialClub={typeof club === 'string' ? club : null} />
}
