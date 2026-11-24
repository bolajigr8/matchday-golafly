// features/vip/plan.ts
//
// The match's real seating plan (event.svg_url, the supplier SVG the main
// Matchday seats page draws), prepared once per page, plus the pieces the
// VIP seats page needs: which plan blocks a listing sits in, and a small
// grey thumbnail of the whole stadium for the listing cards (same idea as
// components/seats/plan-thumb.tsx on the main site).

import { useId, useMemo } from 'react'
import { useSeatingPlanSvg } from '@/components/seats/use-seating-plan'
import {
  normalizeApiBlock,
  planThumbnailMarkup,
  prepareSeatingPlan,
  type PreparedPlan,
} from '@/features/matchday/seating-plan'
import type { VipListing } from './contract'

/** The plan blocks a listing sits in (category.seating_blocks + its own
 *  seat_details.block), normalised like the plan's keys. */
export function listingBlocks(l: VipListing): string[] {
  const fromCat = (l.category.seating_blocks ?? '')
    .split(';')
    .map((b) => b.trim())
    .filter(Boolean)
  const own = l.seat_details.block?.trim()
  return [...new Set([...fromCat, ...(own ? [own] : [])].map(normalizeApiBlock))]
}

export interface VipPlanThumb {
  src: string
  viewBox: string
  /** Outline markup of the listing's blocks ('' = none on the plan). */
  outline: string
}

/** Prepared plan + a per-listing thumbnail. `thumbFor` returns null when
 *  none of the listing's blocks are on the plan (no position is guessed). */
export function useVipPlan(svgUrl: string | null | undefined) {
  const prefix = 'vipt' + useId().replace(/[^a-zA-Z0-9]/g, '')
  const svg = useSeatingPlanSvg(svgUrl || null)
  const plan: PreparedPlan | null = useMemo(
    () => (svg.data ? prepareSeatingPlan(svg.data, prefix) : null),
    [svg.data, prefix],
  )
  /* A data: URL (pure, no blob to revoke), shared by every card. */
  const src = useMemo(
    () => (plan ? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(planThumbnailMarkup(plan))}` : null),
    [plan],
  )
  const outlines = useMemo(() => new Map((plan?.blocks ?? []).map((b) => [b.key, b.outline])), [plan])

  const thumbFor = (l: VipListing): VipPlanThumb | null => {
    if (!plan || !src) return null
    const outline = listingBlocks(l)
      .map((k) => outlines.get(k) ?? '')
      .join('')
    return outline ? { src, viewBox: plan.viewBox, outline } : null
  }

  /* Still working: fetching, or fetched and not yet prepared. */
  const loading = svg.isLoading || (!!svg.data && !plan && !svg.isError)
  return { plan, thumbFor, loading }
}
