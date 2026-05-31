import type { Metadata } from 'next'
import { RewardsClient } from './client'

export const metadata: Metadata = { title: 'My Rewards' }

export default function RewardsPage() {
  return <RewardsClient />
}
