'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Ticket as TicketIcon,
  Plane,
  BedDouble,
  Wifi,
  Car,
  ChevronRight,
  ArrowRight,
  Plus,
  MoreVertical,
  Bell,
  RefreshCw,
  FileText,
  RotateCcw,
  Lock,
  Headphones,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { TRANSACTIONS, PAYMENT_CARDS } from '@/store/dashboard'

type TxnFilter = 'All' | 'Tickets' | 'Travel' | 'Stay' | 'Other'

const FILTER_TABS: TxnFilter[] = ['All', 'Tickets', 'Travel', 'Stay', 'Other']

const TXN_ICON_CONFIG = {
  ticket: { icon: TicketIcon, bg: 'bg-primary/15', color: 'text-primary' },
  flight: { icon: Plane, bg: 'bg-[#60A5FA]/15', color: 'text-[#60A5FA]' },
  hotel: { icon: BedDouble, bg: 'bg-[#C084FC]/15', color: 'text-[#C084FC]' },
  esim: { icon: Wifi, bg: 'bg-[#34D399]/15', color: 'text-[#34D399]' },
  transfer: { icon: Car, bg: 'bg-amber-500/15', color: 'text-amber-400' },
}

const CATEGORY_MAP: Record<string, TxnFilter> = {
  Tickets: 'Tickets',
  Travel: 'Travel',
  Stay: 'Stay',
  Other: 'Other',
}

const PAYMENT_SETTINGS = [
  {
    icon: Bell,
    iconBg: 'bg-primary/15',
    iconColor: 'text-primary',
    label: 'Payment Notifications',
    sub: 'Manage email and SMS alerts for payments.',
    value: null,
  },
  {
    icon: RefreshCw,
    iconBg: 'bg-[#60A5FA]/15',
    iconColor: 'text-[#60A5FA]',
    label: 'Auto Payments',
    sub: 'Manage and view your automatic payments.',
    value: 'Enabled',
  },
  {
    icon: FileText,
    iconBg: 'bg-[#C084FC]/15',
    iconColor: 'text-[#C084FC]',
    label: 'Invoices & Receipts',
    sub: 'Download invoices and receipts for your bookings.',
    value: null,
  },
  {
    icon: RotateCcw,
    iconBg: 'bg-amber-500/15',
    iconColor: 'text-amber-400',
    label: 'Refunds',
    sub: 'View your refund history and status.',
    value: null,
  },
]

function MastercardLogo() {
  return (
    <div className='relative flex h-8 w-12 items-center'>
      <div className='h-7 w-7 rounded-full bg-[#EB001B]' />
      <div className='absolute left-3.5 h-7 w-7 rounded-full bg-[#F79E1B] opacity-90' />
    </div>
  )
}

export function TransactionsAndMethods() {
  const [activeFilter, setActiveFilter] = useState<TxnFilter>('All')

  const filtered = TRANSACTIONS.filter((t) => {
    if (activeFilter === 'All') return true
    return CATEGORY_MAP[t.category] === activeFilter
  })

  return (
    <div className='space-y-4'>
      {/* ── Recent Transactions ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.14, duration: 0.38 }}
        className='rounded-2xl border border-border bg-card'
      >
        {/* Header */}
        <div className='flex items-center justify-between px-4 sm:px-5 pt-4 sm:pt-5 pb-3 sm:pb-4'>
          <h2 className='font-heading text-[16px] sm:text-[18px] font-bold text-foreground'>
            Recent Transactions
          </h2>
          <Link
            href='#'
            className='flex items-center gap-1 font-mono text-[11px] text-muted-foreground hover:text-foreground transition-colors'
          >
            View all <ArrowRight className='h-3 w-3' />
          </Link>
        </div>

        {/* Filter tabs — scrollable on mobile */}
        <div className='flex items-center gap-1.5 px-4 sm:px-5 pb-3 overflow-x-auto scrollbar-hide'>
          {FILTER_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveFilter(tab)}
              className={cn(
                'shrink-0 rounded-lg px-3 py-1.5 font-mono text-[11px] font-bold transition-colors',
                activeFilter === tab
                  ? 'bg-primary text-background'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Transaction list */}
        <div className='divide-y divide-border'>
          {filtered.map((txn) => {
            const cfg = TXN_ICON_CONFIG[txn.type]
            const Icon = cfg.icon
            return (
              <div
                key={txn.id}
                className='flex items-center gap-3 px-4 sm:px-5 py-3 sm:py-3.5 hover:bg-muted/20 transition-colors cursor-pointer'
              >
                {/* Icon */}
                <div
                  className={cn(
                    'flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl',
                    cfg.bg,
                  )}
                >
                  <Icon className={cn('h-4 w-4', cfg.color)} />
                </div>

                {/* Details */}
                <div className='min-w-0 flex-1'>
                  <p className='font-heading text-[12px] sm:text-[13px] font-bold text-foreground truncate'>
                    {txn.title}
                  </p>
                  <p className='text-[10px] sm:text-[11px] text-muted-foreground mt-0.5 truncate'>
                    {txn.subtitle}
                  </p>
                </div>

                {/* Date — hidden on mobile */}
                <div className='hidden sm:flex flex-col items-end shrink-0'>
                  <p className='font-mono text-[11px] text-muted-foreground'>
                    {txn.date}
                  </p>
                  <p className='font-mono text-[10px] text-muted-foreground mt-0.5'>
                    {txn.time}
                  </p>
                </div>

                {/* Paid badge — hidden on smallest screens */}
                <span className='hidden xs:block shrink-0 rounded-full bg-primary/15 px-2.5 py-0.5 font-mono text-[10px] font-bold text-primary'>
                  Paid
                </span>

                {/* Amount */}
                <p className='shrink-0 font-heading text-[13px] sm:text-[14px] font-bold text-foreground w-15 sm:w-17.5 text-right'>
                  ${txn.amount.toFixed(2)}
                </p>

                <ChevronRight className='h-4 w-4 shrink-0 text-muted-foreground' />
              </div>
            )
          })}
        </div>

        {/* View all */}
        <div className='p-4 sm:p-5 pt-3'>
          <Link
            href='#'
            className='flex w-full items-center justify-center gap-1.5 rounded-xl border border-border px-4 py-2.5 font-heading text-[12px] sm:text-[13px] font-bold text-foreground transition-colors hover:border-primary/40 hover:text-primary'
          >
            View all transactions <ArrowRight className='h-3.5 w-3.5' />
          </Link>
        </div>
      </motion.div>

      {/* ── Saved Payment Methods ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.18, duration: 0.38 }}
        className='rounded-2xl border border-border bg-card p-4 sm:p-5'
      >
        <div className='flex items-center justify-between mb-4'>
          <h2 className='font-heading text-[16px] sm:text-[18px] font-bold text-foreground'>
            Saved Payment Methods
          </h2>
          <button className='flex items-center gap-1 font-mono text-[11px] text-primary hover:opacity-80 transition-opacity font-bold'>
            <Plus className='h-3 w-3' />
            Add New
          </button>
        </div>

        {/* Cards grid */}
        <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
          {/* VISA */}
          <div className='rounded-xl border border-border bg-background/40 p-4'>
            <div className='flex items-center justify-between mb-3'>
              <span className='font-heading text-[18px] sm:text-[20px] font-black italic tracking-widest text-white'>
                VISA
              </span>
              <span className='rounded-full bg-primary/20 px-2.5 py-0.5 font-mono text-[10px] font-bold text-primary'>
                Primary
              </span>
            </div>
            <p className='font-mono text-[12px] sm:text-[13px] text-muted-foreground mb-3 tracking-widest'>
              •••• •••• •••• 4242
            </p>
            <div className='flex items-end justify-between'>
              <div>
                <p className='font-mono text-[10px] text-muted-foreground'>
                  Expires 06/27
                </p>
                <p className='font-mono text-[11px] text-foreground mt-0.5'>
                  Adewale Adeyemi
                </p>
              </div>
              <button className='flex h-7 w-7 items-center justify-center rounded-lg hover:bg-muted/50 transition-colors'>
                <MoreVertical className='h-4 w-4 text-muted-foreground' />
              </button>
            </div>
          </div>

          {/* Mastercard */}
          <div className='rounded-xl border border-border bg-background/40 p-4'>
            <div className='flex items-center justify-between mb-3'>
              <MastercardLogo />
            </div>
            <p className='font-mono text-[12px] sm:text-[13px] text-muted-foreground mb-3 tracking-widest'>
              •••• •••• •••• 8881
            </p>
            <div className='flex items-end justify-between'>
              <div>
                <p className='font-mono text-[10px] text-muted-foreground'>
                  Expires 11/26
                </p>
                <p className='font-mono text-[11px] text-foreground mt-0.5'>
                  Adewale Adeyemi
                </p>
              </div>
              <button className='flex h-7 w-7 items-center justify-center rounded-lg hover:bg-muted/50 transition-colors'>
                <MoreVertical className='h-4 w-4 text-muted-foreground' />
              </button>
            </div>
          </div>
        </div>

        <p className='mt-3 flex items-center gap-1.5 font-mono text-[10px] sm:text-[11px] text-muted-foreground'>
          <Lock className='h-3 w-3' />
          Your payment information is encrypted and stored securely.
        </p>
      </motion.div>

      {/* ── Payment Settings ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.22, duration: 0.38 }}
        className='rounded-2xl border border-border bg-card'
      >
        <div className='px-4 sm:px-5 pt-4 sm:pt-5 pb-3'>
          <h2 className='font-heading text-[16px] sm:text-[18px] font-bold text-foreground'>
            Payment Settings
          </h2>
        </div>

        <div className='divide-y divide-border'>
          {PAYMENT_SETTINGS.map(
            ({ icon: Icon, iconBg, iconColor, label, sub, value }) => (
              <button
                key={label}
                className='flex w-full items-center gap-3 px-4 sm:px-5 py-3 sm:py-3.5 text-left hover:bg-muted/20 transition-colors'
              >
                <div
                  className={cn(
                    'flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl',
                    iconBg,
                  )}
                >
                  <Icon
                    className={cn('h-3.5 w-3.5 sm:h-4 sm:w-4', iconColor)}
                  />
                </div>
                <div className='min-w-0 flex-1'>
                  <p className='font-heading text-[12px] sm:text-[13px] font-bold text-foreground'>
                    {label}
                  </p>
                  <p className='text-[10px] sm:text-[11px] text-muted-foreground mt-0.5'>
                    {sub}
                  </p>
                </div>
                {value && (
                  <span className='shrink-0 font-mono text-[11px] sm:text-[12px] text-primary font-bold'>
                    {value}
                  </span>
                )}
                <ChevronRight className='h-4 w-4 shrink-0 text-muted-foreground' />
              </button>
            ),
          )}
        </div>
      </motion.div>

      {/* ── Help Footer ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.26, duration: 0.38 }}
        className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-border bg-card px-4 sm:px-5 py-4'
      >
        <div className='flex items-center gap-3'>
          <div className='flex h-9 w-9 items-center justify-center rounded-xl bg-muted/50'>
            <Headphones className='h-4 w-4 text-muted-foreground' />
          </div>
          <div>
            <p className='font-heading text-[12px] sm:text-[13px] font-bold text-foreground'>
              Need help with a payment?
            </p>
            <p className='text-[10px] sm:text-[11px] text-muted-foreground mt-0.5'>
              Our support team is here 24/7 to help you.
            </p>
          </div>
        </div>
        <button className='flex items-center justify-center gap-2 rounded-xl border border-border bg-background/40 px-4 py-2.5 font-heading text-[12px] sm:text-[13px] font-bold text-foreground hover:border-primary/30 transition-colors whitespace-nowrap'>
          Contact Support
          <Headphones className='h-3.5 w-3.5 text-muted-foreground' />
        </button>
      </motion.div>
    </div>
  )
}
