'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Plane, TrendingUp, User } from 'lucide-react'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Routes, QueryParams, type ProgramType } from '@/routes'
import { FootballTourismForm } from './football-tourism-form'
import { SportsMarketingForm } from './sports-marketing-form'
import { PlayerManagementForm } from './player-management-form'

export default function ApplicationForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const activeProgram =
    (searchParams.get(QueryParams.program) as ProgramType) || 'football-tourism'
  const programSubcategoryIdRaw = searchParams.get(
    QueryParams.programSubcategoryId,
  )
  const programSubcategoryId = programSubcategoryIdRaw
    ? Number(programSubcategoryIdRaw)
    : undefined
  const isProgramApplicantsFlow =
    typeof programSubcategoryId === 'number' &&
    !Number.isNaN(programSubcategoryId)

  const tabs = [
    { label: 'FOOTBALL TOURISM', value: 'football-tourism', icon: Plane },
    { label: 'SPORTS MARKETING', value: 'sports-marketing', icon: TrendingUp },
    { label: 'PLAYER MANAGEMENT', value: 'player-management', icon: User },
  ]

  const handleTabChange = (program: string) => {
    const newUrl = isProgramApplicantsFlow
      ? Routes.applyNowWithProgramSubcategory(
          program as ProgramType,
          programSubcategoryId as number,
        )
      : Routes.applyNowWithProgram(program as ProgramType)
    router.push(newUrl)
  }

  const getProgramTitle = () => {
    if (activeProgram === 'football-tourism') return 'Football Tourism'
    if (activeProgram === 'sports-marketing') return 'Sports Marketing'
    return 'Player Management'
  }

  const getProgramDescription = () => {
    if (activeProgram === 'football-tourism')
      return 'Join our football tours, club trials, and matchday experiences.'
    if (activeProgram === 'sports-marketing')
      return 'Partner with us to amplify your brand through sports marketing campaigns.'
    return 'Get professional representation and career management for aspiring footballers.'
  }

  return (
    <section className='relative min-h-screen w-full bg-background py-[80px] lg:py-[120px]'>
      <div className='relative z-20 w-full max-w-[900px] mx-auto px-[20px] lg:px-[60px]'>
        <div className='text-center mb-[32px] lg:mb-[40px]'>
          <h1 className='text-[#b4ff39] text-[36px] lg:text-[48px] font-bold mb-[8px] lg:mb-[12px] uppercase tracking-[2px] lg:tracking-[3px] leading-[1.2]'>
            APPLY NOW
          </h1>
          <h2 className='text-foreground text-[20px] lg:text-[24px] font-normal uppercase tracking-[1px] mb-[12px] lg:mb-[16px] leading-[1.2]'>
            APPLY FOR{' '}
            <span className='text-[#b4ff39] font-bold'>
              {getProgramTitle().toUpperCase()}
            </span>
          </h2>
          <p className='text-muted-foreground text-[13px] lg:text-[15px] leading-[1.6] max-w-[700px] mx-auto'>
            {getProgramDescription()}
          </p>
        </div>

        <Tabs
          value={activeProgram}
          onValueChange={handleTabChange}
          className='mb-[24px] lg:mb-[40px]'
        >
          <div className='overflow-x-auto lg:overflow-visible scrollbar-hide mb-[16px] lg:mb-[24px] py-[2px]'>
            <TabsList
              className='flex w-full sm:grid sm:grid-cols-3 gap-[8px] sm:gap-[10px] lg:gap-[12px] bg-transparent p-0 min-w-max sm:min-w-0'
              style={{ height: 'auto' }}
            >
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className='data-[state=active]:shadow-[0px_4px_15px_0px_rgba(180,255,57,0.3)] rounded-[2px] p-[10px] sm:p-[12px] lg:p-[14px] gap-[6px] lg:gap-[8px] uppercase text-[10px] sm:text-[11px] lg:text-[13px] font-bold tracking-[0.5px] transition-all flex items-center justify-center flex-1 sm:flex-auto whitespace-nowrap'
                    style={
                      activeProgram === tab.value
                        ? {
                            background: '#b4ff39',
                            color: '#11100d',
                            border: 'none',
                            height: 'auto',
                          }
                        : {
                            backgroundColor: 'rgba(0,0,0,0.05)',
                            color: '#999',
                            border: '1px solid #555',
                            height: 'auto',
                          }
                    }
                  >
                    <Icon className='w-[14px] h-[14px] lg:w-[16px] lg:h-[16px]' />
                    <span>{tab.label}</span>
                  </TabsTrigger>
                )
              })}
            </TabsList>
          </div>

          <div className='text-center mb-[24px] lg:mb-[32px]'>
            <p className='text-muted-foreground text-[11px] sm:text-[12px] lg:text-[14px] leading-[1.6] max-w-[600px] mx-auto'>
              {activeProgram === 'football-tourism' &&
                'Apply for our football tours, club trials, or matchday experiences around the world.'}
              {activeProgram === 'sports-marketing' &&
                'Partner with us to amplify your brand through sports marketing campaigns.'}
              {activeProgram === 'player-management' &&
                'Get professional representation and career management for aspiring footballers.'}
            </p>
          </div>

          <div className='max-w-[700px] mx-auto'>
            <TabsContent value='football-tourism' className='mt-0'>
              <FootballTourismForm />
            </TabsContent>
            <TabsContent value='sports-marketing' className='mt-0'>
              <SportsMarketingForm
                programSubcategoryId={
                  isProgramApplicantsFlow
                    ? (programSubcategoryId as number)
                    : undefined
                }
              />
            </TabsContent>
            <TabsContent value='player-management' className='mt-0'>
              <PlayerManagementForm
                programSubcategoryId={
                  isProgramApplicantsFlow
                    ? (programSubcategoryId as number)
                    : undefined
                }
              />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </section>
  )
}
