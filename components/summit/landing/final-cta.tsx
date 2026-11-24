'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { summitStepHref } from '@/features/summit/routes'
import { WfsButtonLink } from '../ui'

/* Figma "Final CTA": the departures board ("SEE YOU IN / LONDON", split-flap
   tiles that keep flipping to the city) and the "matchday warm up" on the
   right: three balls drop in, each opens a fact when tapped, and the last
   one can be kicked into the goal. Dark in both themes. */

const TILE =
  'relative overflow-hidden rounded-lg border border-white/6 bg-[linear-gradient(180deg,#1a1c1a_0%,#121412_50%,#0d0e0d_50%,#141714_100%)]'

function Tile({ char, big, flip }: { char: string; big?: boolean; flip?: number }) {
  return (
    <span className={cn(TILE, big ? 'h-16 w-11 sm:h-24 sm:w-16' : 'h-[38px] w-[25px] min-[420px]:h-[46px] min-[420px]:w-[30px] sm:h-[70px] sm:w-[46px]')}>
      <span
        key={flip}
        className={cn(
          'absolute inset-0 flex items-center justify-center font-display leading-none',
          big ? 'text-[56px] text-wfs-lime sm:text-[86px]' : 'text-[32px] text-white min-[420px]:text-[40px] sm:text-[60px]',
          flip !== undefined && 'animate-[wfs-flap_0.32s_ease-in]',
        )}
      >
        {char.trim()}
      </span>
      <span className='absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2 bg-[#050606]' />
      <span className='absolute left-0 top-1/2 h-2.5 w-[3px] -translate-y-1/2 bg-[#2a2e2a]' />
      <span className='absolute right-0 top-1/2 h-2.5 w-[3px] -translate-y-1/2 bg-[#2a2e2a]' />
    </span>
  )
}

const CITY = 'LONDON'
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

/* Each tile rolls through a few letters, left to right, and lands on the
   city; the whole board runs again every few seconds. */
function CityRow() {
  const [tick, setTick] = useState(0)
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const t = window.setInterval(() => setTick((n) => (n + 1) % 60), 140)
    return () => window.clearInterval(t)
  }, [])
  return (
    <span className='flex gap-1 sm:gap-1.5' aria-label={CITY} role='img'>
      {CITY.split('').map((target, i) => {
        const settleAt = 4 + i * 3
        const rolling = tick > i && tick < settleAt
        const char = rolling ? ALPHABET[(target.charCodeAt(0) - 65 + (settleAt - tick) * 7) % 26] : target
        return <Tile key={i} char={char} big flip={rolling || tick === settleAt ? tick : undefined} />
      })}
    </span>
  )
}

const FACTS = [
  ['PREMIER LEAGUE', 'Two days inside Craven Cottage'],
  ['FLIGHTS SORTED', 'From your city to London, booked'],
  ['150K+ PEOPLE', 'Clubs, leagues, brands and investors'],
]

function Ball({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <Image
      src='/figma/summit/ball.svg'
      alt=''
      width={91}
      height={91}
      unoptimized
      style={style}
      className={cn('pointer-events-none select-none', className)}
    />
  )
}

function WarmUp() {
  const [open, setOpen] = useState<number | null>(null)
  const [goal, setGoal] = useState(false)
  /* 0 = nothing yet … 4 = all four balls have dropped in. They start
     falling once the section is on screen (Figma "CTA ball drop"). */
  const [dropped, setDropped] = useState(0)
  const [seen, setSeen] = useState(false)
  const box = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = box.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setSeen(true), { threshold: 0.3 })
    io.observe(el)
    return () => io.disconnect()
  }, [])
  useEffect(() => {
    if (!seen || dropped >= 4) return
    const t = window.setTimeout(() => setDropped((n) => n + 1), dropped === 0 ? 250 : 320)
    return () => window.clearTimeout(t)
  }, [seen, dropped])

  /* Drawn at Figma's 540px and scaled down to fit narrower cards. */
  const [scale, setScale] = useState(1)
  const frame = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = frame.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setScale(Math.min(1, e.contentRect.width / 540)))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const DROP = 'transition-[transform,opacity] duration-700 ease-[cubic-bezier(0.34,1.4,0.5,1)] motion-reduce:transition-none'

  return (
    <div className='flex w-full max-w-[540px] shrink-0 flex-col'>
    <p className='font-mono text-[11.5px] font-medium leading-[normal] tracking-[2.07px] text-wfs-lime'>MATCHDAY WARM UP</p>
    <p className='mt-[7px] font-mono text-[10px] font-medium leading-[normal] tracking-[0.8px] text-white/50'>
      Tap a ball. Kick the last one in.
    </p>
    <div ref={frame} className='w-full' style={{ height: 323 * scale }}>
    <div ref={box} style={{ transform: `scale(${scale})` }} className='relative h-[323px] w-[540px] origin-top-left select-none'>
      <span aria-hidden className='absolute inset-x-2.5 bottom-[30px] h-10 rounded-full bg-wfs-lime/7 blur-[20px]' />
      <span aria-hidden className='absolute inset-x-0 bottom-[14px] h-px bg-white/12' />

      {FACTS.map(([title, body], i) => {
        const isOpen = open === i
        return (
          <button
            key={title}
            type='button'
            aria-expanded={isOpen}
            onClick={() => setOpen(isOpen ? null : i)}
            style={{ left: `${i * 19.4}%` }}
            className={cn(
              'absolute bottom-0 flex h-[240px] w-[110px] flex-col items-center justify-end rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wfs-lime',
              DROP,
              dropped > i ? 'translate-y-0 opacity-100' : '-translate-y-[420px] opacity-0',
            )}
          >
            <span
              className={cn(
                'absolute left-[5px] top-0 flex w-[100px] flex-col gap-1 rounded-xl border border-wfs-lime/35 bg-[#1c1c1c] px-3 py-[11px] text-left transition-[opacity,transform] duration-300',
                isOpen ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-3 opacity-0',
              )}
            >
              <span className='font-display text-[20px] leading-[1.2] tracking-[0.4px] text-wfs-lime'>{title}</span>
              <span className='font-mono text-[9px] font-medium leading-[1.35] tracking-[0.36px] text-white/65'>{body}</span>
            </span>
            <span
              className={cn(
                'mb-[26px] font-mono text-[9px] font-medium leading-[normal] tracking-[1.98px] text-wfs-lime/75 transition-opacity duration-200',
                isOpen && 'opacity-0',
              )}
            >
              TAP ME
            </span>
            <Ball
              className={cn(
                'mb-[-13px] size-[91px] transition-transform duration-500 ease-out',
                isOpen ? '-translate-y-[42px] -rotate-[160deg] scale-[1.28]' : 'wfs-bob',
              )}
              style={isOpen ? undefined : { animationDelay: `${i * -0.6}s` }}
            />
            <span aria-hidden className={cn('h-3.5 rounded-full bg-wfs-lime/30 blur-[6px] transition-all duration-500', isOpen ? 'w-9' : 'w-[60px]')} />
          </button>
        )
      })}

      {/* Goal ball */}
      <button
        type='button'
        aria-label={goal ? 'Goal! Kick again' : 'Kick the ball into the goal'}
        onClick={() => setGoal((g) => !g)}
        className={cn(
          'absolute bottom-0 right-0 h-[240px] w-[40.7%] min-w-[190px] rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wfs-lime',
          DROP,
          dropped > 3 ? 'translate-y-0 opacity-100' : '-translate-y-[420px] opacity-0',
        )}
      >
        <span className={cn('absolute right-1.5 top-[44px] font-display text-[64px] leading-[1.2] tracking-[2.56px] text-wfs-lime transition-opacity duration-300', goal ? 'opacity-100' : 'opacity-0')}>
          GOAL
        </span>
        {/* Goal frame + net */}
        <span aria-hidden className='absolute bottom-0 right-0 h-[116px] w-[140px] border-x-4 border-t-4 border-white bg-[repeating-linear-gradient(90deg,rgba(255,255,255,0.1)_0_1px,transparent_1px_12px),repeating-linear-gradient(0deg,rgba(255,255,255,0.1)_0_1px,transparent_1px_12px)]' />
        <span className={cn('absolute bottom-[122px] right-0 w-[140px] text-center font-mono text-[9px] font-medium leading-[normal] tracking-[1.26px] text-white/75 transition-opacity duration-300', goal ? 'opacity-100' : 'opacity-0')}>
          YOUR SEAT IS WAITING
        </span>
        <span className={cn('absolute bottom-[78px] left-[19px] font-mono text-[9px] font-medium leading-[normal] tracking-[1.98px] text-wfs-lime/75 transition-opacity duration-200', goal && 'opacity-0')}>
          KICK IT
        </span>
        <Ball
          className={cn(
            'absolute bottom-[-13px] left-0 size-[91px] transition-transform duration-500 ease-out',
            goal ? 'translate-x-[calc(100%+16px)] -translate-y-2.5 -rotate-[30deg]' : 'wfs-bob',
          )}
        />
      </button>
    </div>
    </div>
    </div>
  )
}

export function SummitFinalCta() {
  return (
    <section className='bg-wfs-surface'>
      <div className='page-container pb-16 pt-12 lg:pb-[120px] lg:pt-20'>
        <div className='relative flex flex-col gap-10 overflow-hidden rounded-[32px] bg-[#050606] px-5 py-10 text-white sm:px-10 xl:min-h-[470px] xl:flex-row xl:items-start xl:justify-between xl:gap-8 xl:px-16 xl:py-14'>
          <div className='flex flex-col items-start gap-3.5'>
            <p className='font-mono text-[11.5px] font-medium leading-[normal] tracking-[2.07px] text-wfs-lime'>
              NOW BOARDING · MATCHDAY DEPARTURES
            </p>
            <h2 className='flex flex-col gap-3.5'>
              <span className='sr-only'>See you in London</span>
              <span aria-hidden className='flex gap-1 sm:gap-1.5'>
                {'SEE YOU IN'.split('').map((c, i) => (
                  <Tile key={i} char={c} />
                ))}
              </span>
              <CityRow />
            </h2>
            <div className='flex flex-wrap items-center gap-3.5 pt-3.5'>
              <WfsButtonLink href={summitStepHref('london', 'ticket')} arrow>
                Get your ticket
              </WfsButtonLink>
              <span className='flex items-center gap-2 rounded-full border border-white/12 bg-white/6 px-3.5 py-2.5 text-[13.5px] font-medium leading-[normal]'>
                <Clock aria-hidden className='size-4' strokeWidth={1.8} />
                Early bird £550 ends 10 December
              </span>
            </div>
          </div>
          <WarmUp />
        </div>
      </div>
    </section>
  )
}
