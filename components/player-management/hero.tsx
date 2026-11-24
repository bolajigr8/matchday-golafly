'use client'

import { useState } from 'react'
import { Play } from 'lucide-react'
import { VideoModal } from '@/components/shared/video-modal'
import { Routes } from '@/routes'
import ReusableHero from '@/components/shared/reusable-hero'

const LandingPage = () => {
  const [isVideoOpen, setIsVideoOpen] = useState(false)

  const bottomNav = [
    { label: 'Talent Scouting', route: Routes.matchdayExperiences },
    { label: 'Career Planning', route: Routes.trialShowCase },
    { label: 'Trial Management', route: Routes.playerManagement },
    { label: 'Contract Support', route: Routes.sportsMarketing },
    { label: 'FIFA Licensed', route: Routes.iconicVenues },
  ]

  return (
    <>
      <ReusableHero
        title={
          <h1 className='text-5xl md:text-8xl font-bold leading-[0.9] mb-8 tracking-tighter text-white'>
            Guiding Talent <br />
            <span className='text-[#76B900] '>Through</span> <br />
            Professional Football
          </h1>
        }
        description='Golafly helps aspiring players reach their dreams through
                strategic club pathways, professional representation, and
                ongoing career support.'
        src='/golafly/e9bc0a2c01f076d6e444ae049dc814b635ff04c7.png'
        tags={['Player Management']}
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
