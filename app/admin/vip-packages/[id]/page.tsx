import type { Metadata } from 'next'
import VipPackageClient from './client'

export const metadata: Metadata = {
  title: 'VIP package | Golafly Admin',
  description: 'One VIP package: its match ticket order, items, release and audit trail.',
}

export default async function AdminVipPackagePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <VipPackageClient id={decodeURIComponent(id)} />
}
