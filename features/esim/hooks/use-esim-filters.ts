// features/esim/hooks/use-esim-filters.ts

import { useState, useCallback, useMemo } from 'react'
import type { EsimPackageFilters } from '../api'
import { useDebounce } from './use-debounce'

export const DATA_BUCKETS = [
  { label: '≤ 1 GB', apiValue: '1GB' },
  { label: '2–3 GB', apiValue: '3GB' },
  { label: '5–10 GB', apiValue: '5GB' },
  { label: '20–50 GB', apiValue: '20GB' },
  { label: '100 GB+', apiValue: '100GB' },
  { label: 'Unlimited', apiValue: 'unlimited' },
] as const

export const VALIDITY_BUCKETS = [
  { label: '1–7 days', days: 7 },
  { label: '8–15 days', days: 15 },
  { label: '16–30 days', days: 30 },
  { label: '31–90 days', days: 90 },
  { label: '90+ days', days: 365 },
] as const

export function dataBucketsToApiParam(buckets: string[]): string | undefined {
  if (!buckets.length) return undefined
  if (buckets.includes('Unlimited')) return 'unlimited'
  const first = DATA_BUCKETS.find((b) => buckets.includes(b.label))
  return first?.apiValue
}

export function validityBucketsToApiParam(
  buckets: string[],
): number | undefined {
  if (!buckets.length) return undefined
  const matched = VALIDITY_BUCKETS.filter((b) => buckets.includes(b.label))
  if (!matched.length) return undefined
  return Math.max(...matched.map((b) => b.days))
}

export interface EsimFiltersState {
  activeTab: 'local' | 'global'
  countryCode: string
  dataBuckets: string[]
  validityBuckets: string[]
  unlimitedOnly: boolean
  minPrice: number
  maxPrice: number
  operators: string[]
  page: number
  searchInput: string
}

const DEFAULT_STATE: EsimFiltersState = {
  activeTab: 'local',
  countryCode: 'NG',
  dataBuckets: [],
  validityBuckets: [],
  unlimitedOnly: false,
  minPrice: 0,
  maxPrice: 9999,
  operators: [],
  page: 1,
  searchInput: '',
}

/**
 * Local-state version of travels' URL-synced filter hook — the builder's
 * eSIM section is an inline card, not its own bookmarkable route, so
 * filters live in component state rather than the query string. The
 * bucket→API-param conversion logic above is identical to travels'.
 */
export function useEsimFilters(initial?: Partial<EsimFiltersState>) {
  const [state, setState] = useState<EsimFiltersState>({
    ...DEFAULT_STATE,
    ...initial,
  })

  const debouncedSearch = useDebounce(state.searchInput, 300)

  const patch = useCallback(
    (updates: Partial<EsimFiltersState>, resetPage = true) => {
      setState((s) => ({
        ...s,
        ...updates,
        page: resetPage ? 1 : (updates.page ?? s.page),
      }))
    },
    [],
  )

  const backendFilters: EsimPackageFilters = useMemo(() => {
    const f: EsimPackageFilters = {}

    if (state.unlimitedOnly) {
      f.data = 'unlimited'
    } else {
      const dataParam = dataBucketsToApiParam(state.dataBuckets)
      if (dataParam) f.data = dataParam
    }

    const validityParam = validityBucketsToApiParam(state.validityBuckets)
    if (validityParam) f.validity_days = validityParam

    if (state.minPrice > 0) f.min_price = state.minPrice
    if (state.maxPrice < 9999) f.max_price = state.maxPrice
    if (state.operators.length === 1) f.network = state.operators[0]

    f.page = Math.max(1, Math.floor(state.page))

    return f
  }, [
    state.unlimitedOnly,
    state.dataBuckets,
    state.validityBuckets,
    state.minPrice,
    state.maxPrice,
    state.operators,
    state.page,
  ])

  const activeFilterCount =
    (debouncedSearch.trim() ? 1 : 0) +
    state.dataBuckets.length +
    state.validityBuckets.length +
    (state.unlimitedOnly ? 1 : 0) +
    (state.minPrice > 0 ? 1 : 0) +
    (state.maxPrice < 9999 ? 1 : 0) +
    state.operators.length

  const hasActive = activeFilterCount > 0

  function toggleList(
    key: 'dataBuckets' | 'validityBuckets' | 'operators',
    value: string,
  ) {
    const current = state[key]
    const next = current.includes(value)
      ? current.filter((x) => x !== value)
      : [...current, value]
    patch({ [key]: next } as Partial<EsimFiltersState>)
  }

  function clearAll() {
    setState({
      ...DEFAULT_STATE,
      activeTab: state.activeTab,
      countryCode: state.countryCode,
    })
  }

  return {
    ...state,
    urlSearch: debouncedSearch.trim().toLowerCase(),
    setActiveTab: (t: 'local' | 'global') => patch({ activeTab: t }),
    setCountryCode: (c: string) => patch({ countryCode: c }),
    setSearchInput: (q: string) => setState((s) => ({ ...s, searchInput: q })),
    setPage: (p: number) => patch({ page: Math.max(1, Math.floor(p)) }, false),
    setPriceRange: (min: number, max: number) =>
      patch({ minPrice: min, maxPrice: max }),
    setUnlimitedOnly: (v: boolean) => patch({ unlimitedOnly: v }),
    backendFilters,
    activeFilterCount,
    hasActive,
    toggleList,
    clearAll,
  }
}
