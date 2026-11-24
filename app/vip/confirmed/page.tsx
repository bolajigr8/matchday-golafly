import type { Metadata } from 'next'
import { NO_INDEX } from '@/lib/seo'
import { VipFlowShell } from '@/components/vip/flow/shell'
import { VipConfirmedClient } from '@/components/vip/flow/confirmed/confirmed-client'

export const metadata: Metadata = { robots: NO_INDEX, title: 'Your VIP booking | Golafly' }

type Props = { searchParams: Promise<{ session_id?: string | string[] }> }

/* VIP Flow · 5 · Confirmed (Figma 506:4397). Stripe returns buyers to
   /payment-success, which hands a VIP package over to this page with the
   same session id. */
export default async function VipConfirmedPage({ searchParams }: Props) {
  const { session_id } = await searchParams
  return (
    <VipFlowShell>
      <VipConfirmedClient sessionId={typeof session_id === 'string' && session_id ? session_id : null} />
    </VipFlowShell>
  )
}
