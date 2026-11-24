import React from 'react'
import Hero from '@/components/football-tourism/hero'
import Programs from '@/components/football-tourism/programs'
import { ManagedServices } from '@/components/football-tourism/ManagedServices'
import { FinalCTA } from '@/components/football-tourism/FinalCTA'
import ExploreSection from '@/components/shared/ExploreSection'

export function FootballTourismClient() {
  return (
    <div>
      <Hero />
      <Programs />
      <ManagedServices />
      <ExploreSection categorySlug='football_tourism' />
      <FinalCTA />
    </div>
  )
}
