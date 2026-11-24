import type { ReactNode } from 'react'
import { notFound } from 'next/navigation'
import { VipFlowShell } from '@/components/vip/flow/shell'

/* /vip/<club>/<eventId> and its builder steps. Open to everyone, guests
   included (the backend builds guest packages with a cart token). The match
   itself is loaded in the browser (see features/vip/hooks.ts for why). */
export default async function VipMatchLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ club: string; eventId: string }>
}) {
  const { eventId } = await params
  if (!/^\d+$/.test(eventId)) notFound()
  return <VipFlowShell>{children}</VipFlowShell>
}
