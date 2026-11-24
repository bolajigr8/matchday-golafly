'use client'

import React, { useState } from 'react'
import { Play } from 'lucide-react'
import { VideoModal } from '@/components/shared/video-modal'
import { Routes } from '@/routes'
import ReusableHero from '@/components/shared/reusable-hero'

const LandingPage = () => {
  const [isVideoOpen, setIsVideoOpen] = useState(false)

  const bottomNav = [
    { label: 'Club Sponsorships', route: Routes.matchdayExperiences },
    { label: 'Stadium Advertising', route: Routes.trialShowCase },
    { label: 'Matchday Activations', route: Routes.playerManagement },
    { label: 'Digital Partnerships', route: Routes.sportsMarketing },
  ]

  return (
    <>
      <ReusableHero
        title={
          <h1 className='text-5xl md:text-8xl font-bold leading-[0.9] mb-8 tracking-tighter text-white'>
            Activate Your <br />
            Brand <br />
            Through <br />
            <span className='text-[#76B900] '>Global Football</span> <br />
          </h1>
        }
        description="Tap into the passion of the world's most popular sport.
                Showcase your brand through strategic football platforms and
                ignite powerful connections with a global audience."
        src='/golafly/fd9580b44bb8e95e5069f3bfee8901a9c142c8c4.png'
        tags={['Sports Marketing']}
        actions={
          <div className='flex flex-wrap gap-4 items-center'>
            <button
              onClick={() => setIsVideoOpen(true)}
              className='bg-[#a3ff00] text-black px-8 py-4 rounded-full font-bold flex items-center gap-3 hover:bg-[#b4ff33] transition-colors shadow-xl shadow-[#a3ff00]/30'
            >
              <div className='w-6 h-6 bg-black rounded-full flex items-center justify-center'>
                <Play size={12} className='text-[#a3ff00] fill-current' />
              </div>
              Watch Reel
            </button>
          </div>
        }
        bottomNav={bottomNav}
      />

      <VideoModal isOpen={isVideoOpen} onClose={() => setIsVideoOpen(false)} />
    </>
  )
}

export default LandingPage
