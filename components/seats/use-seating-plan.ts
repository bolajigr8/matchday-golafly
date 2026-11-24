'use client'

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { planThumbnailMarkup, prepareSeatingPlan, type PreparedPlan } from '@/features/matchday/seating-plan'

/** The raw seating-plan SVG for a fixture, through our proxy (the CDN has no
 *  CORS). One request per plan, shared by the map and the mini maps. */
export function useSeatingPlanSvg(svgUrl: string | null) {
  return useQuery({
    queryKey: ['seating-plan', svgUrl],
    queryFn: async () => {
      const res = await fetch(`/api/seating-plan?url=${encodeURIComponent(svgUrl!)}`)
      if (!res.ok) throw new Error(`Seating plan ${res.status}`)
      return res.text()
    },
    enabled: !!svgUrl,
    staleTime: Infinity,
    gcTime: 30 * 60_000,
    retry: 1,
  })
}

/* Blob URLs for the mini-map image, owned by this module — NOT by a
 * component effect. Next 16 keeps a page you navigate away from alive in
 * the background (React Activity): effect cleanups run when it is hidden,
 * but memoised values survive. A URL revoked in a cleanup was therefore
 * still in use when you came back, and every card showed a broken image.
 * Here a URL lives as long as it is cached; only the oldest is revoked
 * once more than a few stadiums have been opened. */
const THUMB_CACHE_SIZE = 4
const thumbUrls = new Map<string, string>() // svgUrl → blob: URL (insertion = age)

function thumbUrlFor(svgUrl: string, plan: PreparedPlan): string {
  const hit = thumbUrls.get(svgUrl)
  if (hit) {
    // refresh its age
    thumbUrls.delete(svgUrl)
    thumbUrls.set(svgUrl, hit)
    return hit
  }
  const url = URL.createObjectURL(new Blob([planThumbnailMarkup(plan)], { type: 'image/svg+xml' }))
  thumbUrls.set(svgUrl, url)
  while (thumbUrls.size > THUMB_CACHE_SIZE) {
    const [oldKey, oldUrl] = thumbUrls.entries().next().value as [string, string]
    thumbUrls.delete(oldKey)
    URL.revokeObjectURL(oldUrl)
  }
  return url
}

export interface PlanThumb {
  /** Blob URL of the grey, label-free plan — one image shared by every card. */
  src: string
  viewBox: string
  /** Block key (upper case) → outline markup, for highlighting. */
  outlines: Map<string, string>
}

/** Data for the listing-card mini maps ("where is this seat?"). */
export function usePlanThumb(svgUrl: string | null): PlanThumb | null {
  const svg = useSeatingPlanSvg(svgUrl)
  const plan = useMemo(
    () => (svg.data ? prepareSeatingPlan(svg.data, 'spthumb') : null),
    [svg.data],
  )
  const src = plan && svgUrl ? thumbUrlFor(svgUrl, plan) : null

  return useMemo(() => {
    if (!plan || !src) return null
    return {
      src,
      viewBox: plan.viewBox,
      outlines: new Map(plan.blocks.map((b) => [b.key, b.outline])),
    }
  }, [plan, src])
}
