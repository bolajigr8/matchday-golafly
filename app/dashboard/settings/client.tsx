'use client'

import { AccountSection } from '@/components/dashboard/settings/account-section'
import { SettingsMain } from '@/components/dashboard/settings/settings-main'
import { SettingsSidebar } from '@/components/dashboard/settings/settings-sidebar'

export function SettingsClient() {
  return (
    <div className='p-6 space-y-6'>
      {/* Page header */}
      <div>
        <h1 className='font-heading text-[36px] font-bold leading-tight text-foreground'>
          Settings
        </h1>
        <p className='mt-1 text-[14px] text-muted-foreground'>
          Manage your account, preferences and security.
        </p>
      </div>

      {/* Main grid: left main + right sidebar */}
      <div className='grid grid-cols-1 gap-6 lg:grid-cols-[1fr_300px]'>
        {/* Left column */}
        <div className='space-y-6'>
          <AccountSection />
          <SettingsMain />
        </div>

        {/* Right sidebar */}
        <div>
          <SettingsSidebar />
        </div>
      </div>
    </div>
  )
}
