// components/checkout/form-fields.tsx
//
// Factored out of app/builder/checkout/client.tsx's inline field styling
// so the new unified checkout (app/builder/pay) matches the existing
// visual language exactly, without duplicating the class strings.

import { cn } from '@/lib/utils'

export const fieldClass =
  'w-full rounded-lg border border-border bg-muted/60 px-3 py-2.5 text-[13px] text-foreground placeholder:text-muted-foreground/40 outline-none transition-all focus:border-primary/50 focus:ring-1 focus:ring-primary/20'

export function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="block font-mono text-[10.5px] font-semibold uppercase tracking-wider text-foreground/70">
      {children}
    </label>
  )
}

export function FieldWrap({
  label,
  error,
  full,
  children,
}: {
  label: string
  error?: string
  full?: boolean
  children: React.ReactNode
}) {
  return (
    <div className={cn('space-y-1.5', full && 'sm:col-span-2')}>
      <Label>{label}</Label>
      {children}
      {error && <p className="text-[10px] text-red-500">{error}</p>}
    </div>
  )
}

export function SectionCard({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="mb-4">
        <h2 className="text-[13px] font-bold text-foreground">{title}</h2>
        {subtitle && <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      {children}
    </div>
  )
}
