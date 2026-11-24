'use client'

import { useEffect, useState } from 'react'
import type { BaseHue } from '@/features/matchday/seats'

/* The dominant colour of a club crest, as a hue + saturation, for theming
 * the stadium map (see themeCategoryColors). The crest is loaded through our
 * own /api/image-proxy so the canvas isn't cross-origin "tainted". White,
 * black and grey pixels are ignored; the most common saturated hue wins.
 * Returns null while loading or when no clear colour is found. */

const cache = new Map<string, BaseHue | null>()

function dominantHue(img: HTMLImageElement): BaseHue | null {
  const size = 40
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return null
  ctx.drawImage(img, 0, 0, size, size)
  const { data } = ctx.getImageData(0, 0, size, size)
  const bins = Array.from({ length: 24 }, () => ({ w: 0, s: 0 }))
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 200) continue // transparent
    const r = data[i] / 255
    const g = data[i + 1] / 255
    const b = data[i + 2] / 255
    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    const l = (max + min) / 2
    const d = max - min
    if (d < 0.18 || l < 0.12 || l > 0.9) continue // grey / black / white
    const s = d / (1 - Math.abs(2 * l - 1))
    let h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4
    h = (h * 60 + 360) % 360
    const bin = bins[Math.floor(h / 15) % 24]
    bin.w += s
    bin.s += s
  }
  let best = -1
  let total = 0
  bins.forEach((b, i) => {
    total += b.w
    if (best < 0 || b.w > bins[best].w) best = i
  })
  if (best < 0 || bins[best].w < 8 || bins[best].w < total * 0.2) return null
  return { h: best * 15 + 7.5, s: (bins[best].s / bins[best].w) * 100 }
}

export function useTeamHue(crestUrl: string | null | undefined): BaseHue | null {
  const [hue, setHue] = useState<{ url: string; value: BaseHue | null } | null>(null)
  useEffect(() => {
    if (!crestUrl || cache.has(crestUrl)) return
    let cancelled = false
    const img = new Image()
    img.decoding = 'async'
    img.onload = () => {
      let value: BaseHue | null = null
      try {
        value = dominantHue(img)
      } catch {
        value = null
      }
      cache.set(crestUrl, value)
      if (!cancelled) setHue({ url: crestUrl, value })
    }
    img.onerror = () => {
      cache.set(crestUrl, null)
      if (!cancelled) setHue({ url: crestUrl, value: null })
    }
    img.src = `/api/image-proxy?url=${encodeURIComponent(crestUrl)}`
    return () => {
      cancelled = true
    }
  }, [crestUrl])
  if (!crestUrl) return null
  if (cache.has(crestUrl)) return cache.get(crestUrl) ?? null
  return hue?.url === crestUrl ? hue.value : null
}
