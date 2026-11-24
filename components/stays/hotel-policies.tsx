'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import type { StayDescriptionBlock } from '@/features/stays/types'

const COLLAPSED_COUNT = 3

/**
 * Renders `hotel.policy_struct` (check-in rules, meals, parking, payment
 * terms, etc). Previously each block rendered as its own bordered card in
 * a `space-y-3` stack, which read as a pile of disconnected notices. This
 * is one card with the blocks separated by internal dividers instead —
 * same content, arranged like a single policies document.
 */
export function HotelPoliciesSection({
  policies,
  className = '',
}: {
  policies: StayDescriptionBlock[] | null | undefined
  className?: string
}) {
  const [showAll, setShowAll] = useState(false)

  const list = Array.isArray(policies) ? policies : []
  if (list.length === 0) return null

  const visible = showAll ? list : list.slice(0, COLLAPSED_COUNT)
  const hiddenCount = list.length - visible.length

  return (
    <section className={className}>
      <h2 className='mb-3 font-heading text-lg font-bold text-foreground'>
        Policies
      </h2>
      <div className='divide-y divide-border overflow-hidden rounded-xl border border-border bg-card'>
        {visible.map((block) => (
          <div key={block.title} className='p-4'>
            <p className='mb-1 font-bold text-foreground'>{block.title}</p>
            {block.paragraphs.map((paragraph, index) => (
              <p
                key={index}
                className='text-[12px] leading-relaxed text-muted-foreground'
              >
                {paragraph}
              </p>
            ))}
          </div>
        ))}
      </div>
      {list.length > COLLAPSED_COUNT && (
        <button
          type='button'
          onClick={() => setShowAll((value) => !value)}
          className='mt-3 flex items-center gap-1 font-mono text-[11px] font-bold text-primary hover:underline'
        >
          {showAll ? 'Show less' : `Show ${hiddenCount} more`}
          <ChevronDown
            className={`size-3 transition-transform ${showAll ? 'rotate-180' : ''}`}
          />
        </button>
      )}
    </section>
  )
}
