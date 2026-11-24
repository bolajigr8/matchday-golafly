'use client'

import { useState } from 'react'
import { Play, ChevronDown } from 'lucide-react'
import { VideoModal } from '@/components/shared/video-modal'
import { Routes } from '@/routes'
import ReusableHero from '@/components/shared/reusable-hero'

const LandingPage = () => {
  const [isVideoOpen, setIsVideoOpen] = useState(false)

  const bottomNav = [
    { label: 'Club Trials', route: Routes.matchdayExperiences },
    { label: 'Matchday Travel', route: Routes.trialShowCase },
    { label: 'Stadium Tours', route: Routes.playerManagement },
    { label: 'Elite Camps', route: Routes.sportsMarketing },
    { label: 'International Competitions', route: Routes.iconicVenues },
  ]

  return (
    <>
      <ReusableHero
        title={
          <h1 className='text-6xl md:text-8xl font-bold leading-[0.9] mb-8 tracking-tighter text-white'>
            Live The <br />
            <span className='text-[#76B900] '>Dream</span> <br />
            Play The Game
          </h1>
        }
        description='Travel the world through football. Experience professional club
                trials, elite competitions, iconic stadiums, and matchday
                adventures — all managed by Golafly.'
        src='/golafly/golafly/FTH.png'
        pillar='travel'
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
            <a
              href='#programs'
              className='px-8 py-4 rounded-full border border-black/10 dark:border-white/20 font-bold text-gray-700 dark:text-white flex items-center gap-2 hover:bg-black/5 dark:hover:bg-white/5 transition-colors'
            >
              Explore Programs <ChevronDown size={18} />
            </a>
          </div>
        }
        bottomNav={bottomNav}
      />

      <VideoModal isOpen={isVideoOpen} onClose={() => setIsVideoOpen(false)} />
    </>
  )
}

export default LandingPage
