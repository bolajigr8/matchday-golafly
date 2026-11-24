'use client'

import { MoveRight } from 'lucide-react'
import ReusableHero from '@/components/shared/reusable-hero'
import { useRouter } from 'next/navigation'

const LandingPage = () => {
  const router = useRouter()
  return (
    <>
      <ReusableHero
        title={
          <h1 className='text-5xl md:text-8xl font-bold leading-[0.9] mb-8 tracking-tighter text-[#1A1C19] dark:text-white'>
            Elite Football <br />
            <span className='text-[#76B900] dark:text-[#a3ff00]'>
              Trial Showcase
            </span>{' '}
            <br />
          </h1>
        }
        description="The world's leading football trial event. Perform directly
                in front of scouts from the Premier League, La Liga, and
                Bundesliga. Your professional journey starts here."
        src='/golafly/fd9580b44bb8e95e5069f3bfee8901a9c142c8c4.png'
        pillar='play'
        actions={
          <div className='flex flex-wrap gap-4 items-center'>
            <button
              onClick={() => router.push('/apply-now')}
              className='bg-[#a3ff00] text-black px-8 py-4 rounded-full font-bold flex items-center gap-3 hover:bg-[#b4ff33] transition-colors shadow-xl shadow-[#a3ff00]/30'
            >
              Book Your Spot
              <div className='w-6 h-6 flex items-center justify-center'>
                <MoveRight size={12} className='text-[#000] fill-current' />
              </div>
            </button>
          </div>
        }
      />
    </>
  )
}

export default LandingPage
