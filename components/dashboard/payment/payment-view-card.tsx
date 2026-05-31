'use client'

import { motion } from 'framer-motion'
import {
  Ticket as TicketIcon,
  Plane,
  BedDouble,
  MoreHorizontal,
  TrendingUp,
  ChevronDown,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const CATEGORIES = [
  {
    icon: TicketIcon,
    label: 'Tickets',
    amount: '$980.00',
    iconColor: 'text-primary',
    iconBg: 'bg-primary/15',
  },
  {
    icon: Plane,
    label: 'Travel',
    amount: '$1,250.00',
    iconColor: 'text-[#60A5FA]',
    iconBg: 'bg-[#60A5FA]/15',
  },
  {
    icon: BedDouble,
    label: 'Stay',
    amount: '$180.50',
    iconColor: 'text-[#C084FC]',
    iconBg: 'bg-[#C084FC]/15',
  },
  {
    icon: MoreHorizontal,
    label: 'Other',
    amount: '$70.00',
    iconColor: 'text-muted-foreground',
    iconBg: 'bg-muted/50',
  },
]

export function PaymentOverviewCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, duration: 0.38 }}
      className='rounded-2xl border border-border bg-card p-4 sm:p-5'
    >
      {/* Header */}
      <div className='flex items-center justify-between mb-5 sm:mb-6'>
        <h2 className='font-heading text-[16px] sm:text-[18px] font-bold text-foreground'>
          Payment Overview
        </h2>
        <button className='flex items-center gap-1.5 rounded-xl border border-border bg-background/40 px-2.5 sm:px-3 py-1.5 font-mono text-[11px] sm:text-[12px] text-muted-foreground hover:border-primary/30 transition-colors'>
          All time <ChevronDown className='h-3 w-3 sm:h-3.5 sm:w-3.5' />
        </button>
      </div>

      {/* Stats row */}
      <div className='flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-6'>
        {/* Total spent */}
        <div className='min-w-22.5'>
          <p className='font-mono text-[11px] tracking-wider text-muted-foreground'>
            Total Spent
          </p>
          <p className='font-heading text-[26px] sm:text-[30px] font-bold text-foreground mt-1 leading-none'>
            $2,480.50
          </p>
          <p className='font-mono text-[10px] text-muted-foreground mt-1.5'>
            All time
          </p>
        </div>

        {/* Category tiles — 2x2 on mobile, single row on sm+ */}
        <div className='grid grid-cols-2 gap-3 sm:flex sm:items-start sm:gap-5'>
          {CATEGORIES.map(
            ({ icon: Icon, label, amount, iconColor, iconBg }) => (
              <div key={label} className='flex flex-col items-center gap-1.5'>
                <div
                  className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-xl',
                    iconBg,
                  )}
                >
                  <Icon className={cn('h-4 w-4', iconColor)} />
                </div>
                <p className='font-mono text-[10px] text-muted-foreground'>
                  {label}
                </p>
                <p className='font-heading text-[12px] sm:text-[13px] font-bold text-foreground'>
                  {amount}
                </p>
              </div>
            ),
          )}
        </div>
      </div>

      {/* View spending insights */}
      <button className='mt-5 flex w-full items-center justify-between rounded-xl border border-border bg-background/30 px-4 py-3 transition-colors hover:border-primary/30 hover:bg-muted/20'>
        <div className='flex items-center gap-2.5'>
          <TrendingUp className='h-4 w-4 text-primary' />
          <span className='font-heading text-[12px] sm:text-[13px] font-bold text-foreground'>
            View spending insights
          </span>
        </div>
        <ChevronRight className='h-4 w-4 text-muted-foreground' />
      </button>
    </motion.div>
  )
}
