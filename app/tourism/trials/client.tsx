'use client'

import Hero from '@/components/trial-showcase/hero'
import { ProgramsList } from '@/components/trial-showcase/programs-list'
import { ScoutingNetwork } from '@/components/trial-showcase/scouting-network'
import { SuccessStories } from '@/components/trial-showcase/success-stories'
import { Chance } from '@/components/trial-showcase/chance'
import { FinalCTA } from '@/components/trial-showcase/final-cta'

export function TrialShowcaseClient() {
  return (
    <main>
      <Hero />
      <ProgramsList
        categorySlug='football_tourism'
        subcategorySlug='trial_showcase_tours'
      />
      <ScoutingNetwork />
      <SuccessStories />
      <Chance />
      <FinalCTA />
    </main>
  )
}
