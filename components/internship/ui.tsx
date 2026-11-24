import Link from 'next/link'
import type { ReactNode } from 'react'
import {
  Award,
  Briefcase,
  ChartColumn,
  Download,
  FolderOpen,
  Globe,
  Goal,
  Lightbulb,
  Search,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { BROCHURE_FILENAME, type Feature, type FeatureIcon } from '@/store/internship'

/* Pill links shared by every internship page. Same shapes as the home hero
   and CTA; the light-mode edge keeps the lime fill visible on a light page. */
export const pillPrimary =
  'inline-flex items-center justify-center gap-2 rounded-full border border-brand-edge bg-primary px-7 py-3.5 text-sm font-bold text-primary-foreground shadow-lg transition-shadow hover:shadow-[0_0_22px_var(--brand-glow)] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50'
export const pillSecondary =
  'inline-flex items-center justify-center gap-2 rounded-full border border-border bg-card/70 px-6 py-3.5 text-sm font-semibold text-foreground backdrop-blur transition-colors hover:border-brand-text/50 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50'

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p
      className={cn(
        'inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-brand-text sm:text-xs',
        className,
      )}
    >
      <span className='size-1.5 rounded-full bg-primary' />
      {children}
    </p>
  )
}

export function BrochureButton({
  href,
  label = 'Download Brochure',
  variant = 'secondary',
  className,
}: {
  href: string
  label?: string
  /** `inverse` sits on the dark University Partner panel and reads its --uni-ink. */
  variant?: 'primary' | 'secondary' | 'inverse'
  className?: string
}) {
  return (
    <a
      href={href}
      download={BROCHURE_FILENAME}
      className={cn(
        variant === 'primary' && pillPrimary,
        variant === 'secondary' && pillSecondary,
        variant === 'inverse' &&
          'inline-flex items-center justify-center gap-2 rounded-full border border-(--uni-ink)/30 px-6 py-3.5 text-sm font-semibold text-(--uni-ink) transition-colors hover:border-primary hover:text-primary',
        className,
      )}
    >
      <Download className='size-4' strokeWidth={2.5} />
      {label}
    </a>
  )
}

export function ApplyLink({ href, children, className }: { href: string; children: ReactNode; className?: string }) {
  return (
    <Link href={href} className={cn(pillPrimary, className)}>
      {children}
    </Link>
  )
}

const FEATURE_ICONS: Record<FeatureIcon, LucideIcon> = {
  briefcase: Briefcase,
  search: Search,
  lightbulb: Lightbulb,
  football: Goal,
  globe: Globe,
  folder: FolderOpen,
  chart: ChartColumn,
  users: Users,
  award: Award,
}

export function FeatureGrid({ features }: { features: Feature[] }) {
  return (
    <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:gap-6'>
      {features.map((feature) => {
        const Icon = FEATURE_ICONS[feature.icon]
        return (
          <div
            key={feature.title}
            className='flex gap-4 rounded-2xl border border-border bg-card p-5 sm:block sm:p-7'
          >
            <span className='grid size-11 shrink-0 place-items-center rounded-xl bg-primary/15 text-brand-text'>
              <Icon className='size-5' />
            </span>
            <div>
              <h3 className='text-base font-bold text-foreground sm:mt-5 sm:text-lg'>{feature.title}</h3>
              <p className='mt-1 text-sm leading-relaxed text-muted-foreground sm:mt-2'>{feature.body}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
