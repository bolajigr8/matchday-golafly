'use client'

import Hero from '@/components/player-management/hero'
import { CareerCommitment } from '@/components/player-management/commitment'
import { CompanyCommitment } from '@/components/player-management/CompanyCommitment'
import { FinalCTA } from '@/components/player-management/FinalCTA'

export function PlayerManagementClient() {
  return (
    <main>
      <Hero />
      <CareerCommitment />
      <CompanyCommitment />
      <FinalCTA />
    </main>
  )
}
