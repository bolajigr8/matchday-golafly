import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Routes } from '@/routes'
import { formatPositionNumber, type InternshipPosition } from '@/store/internship'

export function PositionNumber({ order, className = 'text-4xl' }: { order: number; className?: string }) {
  return (
    <span
      className={`font-heading font-bold leading-none text-transparent [-webkit-text-stroke:1.5px_var(--brand-text)] ${className}`}
      aria-hidden
    >
      {formatPositionNumber(order)}
    </span>
  )
}

export function PositionCard({ position }: { position: InternshipPosition }) {
  return (
    <Link
      href={Routes.internshipPosition(position.slug)}
      className='group flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 transition-all hover:-translate-y-1 hover:border-brand-text/45 sm:gap-4 sm:p-7'
    >
      <PositionNumber order={position.order} />
      <h3 className='text-lg font-bold leading-tight tracking-tight text-foreground sm:text-xl'>
        {position.title}
      </h3>
      <p className='flex-1 text-sm leading-relaxed text-muted-foreground'>{position.summary}</p>
      {position.tags.length > 0 && (
        <div className='flex flex-wrap gap-1.5'>
          {position.tags.map((tag) => (
            <span
              key={tag}
              className='rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs text-muted-foreground'
            >
              {tag}
            </span>
          ))}
        </div>
      )}
      <span className='inline-flex items-center gap-1.5 pt-1 text-sm font-semibold text-brand-text'>
        Learn more
        <ArrowRight className='size-4 transition-transform group-hover:translate-x-0.5' />
      </span>
    </Link>
  )
}
