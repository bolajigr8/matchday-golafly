'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Bell,
  Globe,
  DollarSign,
  Sun,
  Mail,
  MessageSquare,
  Megaphone,
  Calendar,
  Ticket as TicketIcon,
  Lock,
  Shield,
  Monitor,
  Eye,
  Trash2,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ── Toggle ────────────────────────────────────────────────────────────────────
function Toggle({
  checked,
  onToggle,
}: {
  checked: boolean
  onToggle: () => void
}) {
  return (
    <button
      role='switch'
      aria-checked={checked}
      onClick={onToggle}
      className={cn(
        'relative inline-flex h-6.5 w-11.5 shrink-0 items-center rounded-full transition-colors duration-200',
        checked ? 'bg-primary' : 'bg-muted',
      )}
    >
      <span
        className={cn(
          'inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200',
          checked ? 'translate-x-5.75' : 'translate-x-0.75',
        )}
      />
    </button>
  )
}

// ── Section label ─────────────────────────────────────────────────────────────
function SectionLabel({ title }: { title: string }) {
  return (
    <h2 className='font-heading text-[18px] font-bold text-foreground'>
      {title}
    </h2>
  )
}

// ── Row types ─────────────────────────────────────────────────────────────────
function SettingsRow({
  icon: Icon,
  iconBg,
  iconColor,
  label,
  sub,
  value,
  danger,
}: {
  icon: React.ElementType
  iconBg: string
  iconColor: string
  label: string
  sub: string
  value?: string | null
  danger?: boolean
}) {
  return (
    <button className='flex w-full items-center gap-3 px-5 py-4 text-left hover:bg-muted/20 transition-colors'>
      <div
        className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
          iconBg,
        )}
      >
        <Icon className={cn('h-4 w-4', iconColor)} />
      </div>
      <div className='min-w-0 flex-1'>
        <p
          className={cn(
            'font-heading text-[13px] font-bold',
            danger ? 'text-[#f87171]' : 'text-foreground',
          )}
        >
          {label}
        </p>
        <p className='text-[11px] text-muted-foreground mt-0.5'>{sub}</p>
      </div>
      {value && (
        <span className='shrink-0 font-mono text-[12px] text-primary font-bold'>
          {value}
        </span>
      )}
      <ChevronRight className='h-4 w-4 shrink-0 text-muted-foreground' />
    </button>
  )
}

function ToggleRow({
  icon: Icon,
  iconBg,
  iconColor,
  label,
  sub,
  checked,
  onToggle,
}: {
  icon: React.ElementType
  iconBg: string
  iconColor: string
  label: string
  sub: string
  checked: boolean
  onToggle: () => void
}) {
  return (
    <div className='flex w-full items-center gap-3 px-5 py-4'>
      <div
        className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
          iconBg,
        )}
      >
        <Icon className={cn('h-4 w-4', iconColor)} />
      </div>
      <div className='min-w-0 flex-1'>
        <p className='font-heading text-[13px] font-bold text-foreground'>
          {label}
        </p>
        <p className='text-[11px] text-muted-foreground mt-0.5'>{sub}</p>
      </div>
      <Toggle checked={checked} onToggle={onToggle} />
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export function SettingsMain() {
  const [comms, setComms] = useState({
    email: true,
    sms: true,
    marketing: true,
    matchReminders: true,
    ticketUpdates: true,
  })

  const toggle = (key: keyof typeof comms) =>
    setComms((prev) => ({ ...prev, [key]: !prev[key] }))

  return (
    <div className='space-y-6'>
      {/* ── Preferences ── */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.14, duration: 0.38 }}
        className='space-y-3'
      >
        <SectionLabel title='Preferences' />
        <div className='overflow-hidden rounded-2xl border border-border bg-card divide-y divide-border'>
          <SettingsRow
            icon={Bell}
            iconBg='bg-primary/15'
            iconColor='text-primary'
            label='Notification Preferences'
            sub='Choose what updates you want to receive and how.'
          />
          <SettingsRow
            icon={Globe}
            iconBg='bg-[#60A5FA]/15'
            iconColor='text-[#60A5FA]'
            label='Language'
            sub='Select your preferred language.'
            value='English'
          />
          <SettingsRow
            icon={DollarSign}
            iconBg='bg-[#C084FC]/15'
            iconColor='text-[#C084FC]'
            label='Currency'
            sub='Select your preferred currency.'
            value='USD ($)'
          />
          <SettingsRow
            icon={Sun}
            iconBg='bg-amber-500/15'
            iconColor='text-amber-400'
            label='Theme'
            sub='Choose your app appearance.'
            value='Dark'
          />
        </div>
      </motion.section>

      {/* ── Communication ── */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.18, duration: 0.38 }}
        className='space-y-3'
      >
        <SectionLabel title='Communication' />
        <div className='overflow-hidden rounded-2xl border border-border bg-card divide-y divide-border'>
          <ToggleRow
            icon={Mail}
            iconBg='bg-[#34D399]/15'
            iconColor='text-[#34D399]'
            label='Email Notifications'
            sub='Receive updates and offers via email.'
            checked={comms.email}
            onToggle={() => toggle('email')}
          />
          <ToggleRow
            icon={MessageSquare}
            iconBg='bg-[#60A5FA]/15'
            iconColor='text-[#60A5FA]'
            label='SMS Notifications'
            sub='Receive important updates via SMS.'
            checked={comms.sms}
            onToggle={() => toggle('sms')}
          />
          <ToggleRow
            icon={Megaphone}
            iconBg='bg-[#C084FC]/15'
            iconColor='text-[#C084FC]'
            label='Marketing & Promotions'
            sub='Get exclusive deals and promotional content.'
            checked={comms.marketing}
            onToggle={() => toggle('marketing')}
          />
          <ToggleRow
            icon={Calendar}
            iconBg='bg-amber-500/15'
            iconColor='text-amber-400'
            label='Match Reminders'
            sub='Get reminders before matchday.'
            checked={comms.matchReminders}
            onToggle={() => toggle('matchReminders')}
          />
          <ToggleRow
            icon={TicketIcon}
            iconBg='bg-[#f87171]/15'
            iconColor='text-[#f87171]'
            label='Ticket Updates'
            sub='Receive real-time updates about your tickets.'
            checked={comms.ticketUpdates}
            onToggle={() => toggle('ticketUpdates')}
          />
        </div>
      </motion.section>

      {/* ── Privacy & Security ── */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.22, duration: 0.38 }}
        className='space-y-3'
      >
        <SectionLabel title='Privacy & Security' />
        <div className='overflow-hidden rounded-2xl border border-border bg-card divide-y divide-border'>
          <SettingsRow
            icon={Lock}
            iconBg='bg-[#f87171]/15'
            iconColor='text-[#f87171]'
            label='Change Password'
            sub='Update your password regularly to keep your account secure.'
          />
          <SettingsRow
            icon={Shield}
            iconBg='bg-primary/15'
            iconColor='text-primary'
            label='Two-Factor Authentication'
            sub='Add an extra layer of security to your account.'
            value='Enabled'
          />
          <SettingsRow
            icon={Monitor}
            iconBg='bg-[#60A5FA]/15'
            iconColor='text-[#60A5FA]'
            label='Manage Devices'
            sub='View and manage devices logged into your account.'
          />
          <SettingsRow
            icon={Eye}
            iconBg='bg-[#C084FC]/15'
            iconColor='text-[#C084FC]'
            label='Privacy Settings'
            sub='Control what information you share and see.'
          />
          <SettingsRow
            icon={Trash2}
            iconBg='bg-[#f87171]/15'
            iconColor='text-[#f87171]'
            label='Delete Account'
            sub='Permanently delete your account and data.'
            danger
          />
        </div>
      </motion.section>
    </div>
  )
}
