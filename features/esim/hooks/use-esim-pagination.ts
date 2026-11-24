// features/esim/hooks/use-esim-pagination.ts

import { useMemo, useEffect } from 'react'
import type { EsimPackage } from '../types'

const PLANS_PER_PAGE = 15

export function useEsimPagination({
  packages,
  totalPages: backendTotalPages,
  page,
  isLoading,
  isFetching,
  activeTab,
  urlSearch,
}: {
  packages: EsimPackage[]
  totalPages: number
  page: number
  isLoading: boolean
  isFetching: boolean
  activeTab: 'local' | 'global'
  urlSearch: string
}) {
  const filtered = useMemo(() => {
    if (!urlSearch) return packages
    const q = urlSearch.toLowerCase()
    return packages.filter((pkg) => {
      const haystack = [
        pkg.country,
        pkg.country_code,
        pkg.operator,
        pkg.title,
        pkg.data,
      ]
        .join(' ')
        .toLowerCase()
      return haystack.includes(q)
    })
  }, [packages, urlSearch])

  const totalPages = useMemo(() => {
    if (urlSearch) {
      return Math.max(1, Math.ceil(filtered.length / PLANS_PER_PAGE))
    }
    return Math.max(1, backendTotalPages)
  }, [urlSearch, filtered.length, backendTotalPages])

  // Only clamp when we have settled data (not loading/fetching) —
  // while fetching, trust the requested page as-is.
  const safePage =
    isLoading || isFetching ? page : Math.max(1, Math.min(page, totalPages))

  const paginated = useMemo(() => {
    if (urlSearch) {
      const start = (safePage - 1) * PLANS_PER_PAGE
      return filtered.slice(start, start + PLANS_PER_PAGE)
    }
    // Backend already returns the correct page — return as-is
    return filtered
  }, [filtered, safePage, urlSearch])

  // ─── Scroll to results on page change ────────────────────────
  useEffect(() => {
    if (isLoading || isFetching) return
    document
      .getElementById('esim-results')
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [page, isLoading, isFetching])

  const globalRegions = useMemo(
    () =>
      activeTab === 'global'
        ? [...new Set(paginated.map((p) => p.country))]
        : [],
    [activeTab, paginated],
  )

  return { filtered, totalPages, safePage, paginated, globalRegions }
}
