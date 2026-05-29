'use client'

import { ProfileContent } from '@/components/dashboard/profile/profile-content'
import { ProfileHero } from '@/components/dashboard/profile/profile-hero'
import { ProfileSidebar } from '@/components/dashboard/profile/profile-sidebar'

export function ProfileClient() {
  return (
    <div className='p-4 sm:p-6'>
      <div className='mb-5 sm:mb-6'>
        <h1 className='font-heading text-xl sm:text-2xl font-bold text-foreground'>
          My Profile
        </h1>
        <p className='mt-1 text-[12px] sm:text-[13px] text-muted-foreground'>
          Manage your account and preferences
        </p>
      </div>

      <div className='grid grid-cols-1 gap-6 xl:grid-cols-[1fr_280px]'>
        <div className='space-y-6'>
          <ProfileHero />
          <ProfileContent />
        </div>
        {/* Sidebar drops below content on mobile, sits beside on xl+ */}
        <ProfileSidebar />
      </div>
    </div>
  )
}
