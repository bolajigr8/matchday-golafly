'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Plus, Minus, Maximize2, Minimize2, LocateFixed } from 'lucide-react'
import { cn } from '@/lib/utils'

/* Zoom / drag-to-pan / fullscreen frame shared by both seat maps: the real
   seating plan (seating-plan-map.tsx) and the schematic oval fallback
   (stadium-map.tsx). `children` is the map itself and moves with zoom/pan;
   `overlay` (tooltip, reset button…) stays fixed on top of the frame. */

export function MapViewport({
  children,
  overlay,
  className,
}: {
  children: ReactNode
  overlay?: ReactNode
  className?: string
}) {
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [full, setFull] = useState(false)
  const boxRef = useRef<HTMLDivElement | null>(null)
  const drag = useRef<{ x: number; y: number; px: number; py: number; moved: boolean } | null>(null)
  const [dragging, setDragging] = useState(false)

  const clampPan = (p: { x: number; y: number }, z: number) => {
    const el = boxRef.current
    if (!el || z <= 1) return { x: 0, y: 0 }
    const mx = ((z - 1) * el.clientWidth) / 2
    const my = ((z - 1) * el.clientHeight) / 2
    return { x: Math.max(-mx, Math.min(mx, p.x)), y: Math.max(-my, Math.min(my, p.y)) }
  }
  const zoomTo = (z: number) => {
    const next = Math.max(1, Math.min(3, +z.toFixed(1)))
    setZoom(next)
    setPan((p) => clampPan(p, next))
  }
  const recenter = () => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }

  // Fullscreen: the real Fullscreen API where supported; otherwise (iOS
  // Safari) a fixed full-viewport overlay gives the same result.
  useEffect(() => {
    const onChange = () => {
      if (!document.fullscreenElement) setFull(false)
    }
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])
  useEffect(() => {
    if (!full) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setFull(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [full])
  const toggleFull = async () => {
    const el = boxRef.current
    if (!el) return
    if (full) {
      if (document.fullscreenElement) await document.exitFullscreen().catch(() => {})
      setFull(false)
      return
    }
    if (el.requestFullscreen) {
      try {
        await el.requestFullscreen()
      } catch {
        /* blocked — fall back to the overlay */
      }
    }
    setFull(true)
  }

  return (
    <div
      ref={boxRef}
      data-full={full ? 'true' : 'false'}
      className={cn(
        'flex flex-col gap-2',
        full &&
          'fixed inset-0 z-[70] bg-background p-3 sm:p-4 [&:fullscreen]:bg-background',
        className,
      )}
    >
      {/* Stage: the map moves inside it; overlays stay put. */}
      <div
        className={cn(
          'relative overflow-hidden rounded-xl bg-muted/40 p-2 sm:p-3',
          full && 'flex min-h-0 flex-1 items-center justify-center',
        )}
        style={{ touchAction: zoom > 1 ? 'none' : 'pan-y' }}
        onPointerDown={(e) => {
          if (zoom <= 1) return
          drag.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y, moved: false }
          setDragging(true)
        }}
        onPointerMove={(e) => {
          const d = drag.current
          if (!d) return
          const dx = e.clientX - d.x
          const dy = e.clientY - d.y
          if (Math.abs(dx) + Math.abs(dy) > 4) d.moved = true
          if (d.moved) setPan(clampPan({ x: d.px + dx, y: d.py + dy }, zoom))
        }}
        onPointerUp={() => {
          // Keep `moved` until the click that follows this pointerup has been
          // swallowed below, then clear.
          setDragging(false)
          setTimeout(() => {
            drag.current = null
          }, 0)
        }}
        onPointerLeave={() => {
          drag.current = null
          setDragging(false)
        }}
        onClickCapture={(e) => {
          // A drag shouldn't also select the block under the pointer.
          if (drag.current?.moved) e.stopPropagation()
        }}
        onWheel={(e) => {
          if (!e.ctrlKey && !full) return
          e.preventDefault()
          zoomTo(zoom + (e.deltaY < 0 ? 0.2 : -0.2))
        }}
      >
        <div
          className={cn(
            'w-full origin-center',
            !dragging && 'transition-transform duration-300',
            zoom > 1 && 'cursor-grab active:cursor-grabbing',
          )}
          style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
        >
          {children}
        </div>
        {overlay}
      </div>

      {/* Controls sit BELOW the map, so they never cover blocks or prices. */}
      <div className='flex items-center justify-end gap-1.5'>
        <MapButton label='Zoom out' disabled={zoom <= 1} onClick={() => zoomTo(zoom - 0.4)}>
          <Minus className='size-3.5' />
        </MapButton>
        <MapButton label='Zoom in' disabled={zoom >= 3} onClick={() => zoomTo(zoom + 0.4)}>
          <Plus className='size-3.5' />
        </MapButton>
        <MapButton
          label='Recentre map'
          disabled={zoom === 1 && pan.x === 0 && pan.y === 0}
          onClick={recenter}
        >
          <LocateFixed className='size-3.5' />
        </MapButton>
        <MapButton label={full ? 'Exit full screen' : 'Full screen'} onClick={toggleFull}>
          {full ? <Minimize2 className='size-3.5' /> : <Maximize2 className='size-3.5' />}
        </MapButton>
      </div>
    </div>
  )
}

function MapButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string
  disabled?: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type='button'
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      className='flex size-9 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-sm transition-colors hover:border-primary/50 disabled:opacity-40'
    >
      {children}
    </button>
  )
}
