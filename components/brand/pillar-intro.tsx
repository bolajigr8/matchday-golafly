'use client'

import { useEffect, useEffectEvent, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { useHydrated } from '@/hooks/use-hydrated'
import {
  INTRO_SKIP_ATTR,
  introForPath,
  introSeen,
  markIntroSeen,
  type Pillar,
  type PillarIntroSpec,
} from '@/lib/pillar-intro'

/* The pillar intro: about two seconds of motion that opens a route with its
   pillar — PLAY IT, LIVE IT or TRAVEL FOR IT — and the section's name.

     PLAY IT        the ball rolls along the touchline, two keepy-ups, then
                    lands as the full stop
     LIVE IT        floodlights sweep on, the ball rolls in under them
     TRAVEL FOR IT  a plane flies a dashed flight path, sets down the full
                    stop as it crosses it, then climbs away

   It never blocks the page: the page renders underneath, a tap or Escape
   skips it, it clears itself even if the script stalls (the CSS fallback in
   globals.css), and reduced-motion visitors never see it. Which route gets
   which intro, and the once-per-visit rule, live in lib/pillar-intro.ts. */

const WORDS: Record<Pillar, string[]> = {
  play: ['PLAY', 'IT'],
  live: ['LIVE', 'IT'],
  travel: ['TRAVEL', 'FOR', 'IT'],
}

const OUT_AT = 1700
const OUT_FOR = 450

/* Whether each section's intro plays, decided the first time the section is
   rendered on the client and kept for the visit, so marking it seen (below)
   doesn't hide an intro that is already running. */
const willPlay = new Map<string, boolean>()

function decide(key: string) {
  if (!willPlay.has(key)) {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    willPlay.set(key, !reduce && !introSeen(key))
  }
  return willPlay.get(key)!
}

export function PillarIntro({ disabled = false }: { disabled?: boolean }) {
  const pathname = usePathname()
  const spec = disabled ? null : introForPath(pathname)
  const hydrated = useHydrated()
  const [finished, setFinished] = useState<string | null>(null)
  const key = spec?.key ?? null
  const playing = hydrated && !!key && finished !== key && decide(key)

  useEffect(() => {
    if (!hydrated) return
    // React decides visibility from here on; the boot script's flag would
    // otherwise hide the next section's intro too.
    document.documentElement.removeAttribute(INTRO_SKIP_ATTR)
  }, [hydrated])

  useEffect(() => {
    if (playing && key) markIntroSeen(key)
  }, [playing, key])

  function onDone() {
    if (!key) return
    willPlay.set(key, false)
    setFinished(key)
  }

  if (!spec) return null
  // Before hydration: the server's ink screen, which the boot script has
  // already hidden for anyone who shouldn't see it.
  if (!hydrated) return <IntroOverlay spec={spec} running={false} onDone={onDone} />
  if (!playing) return null
  return <IntroOverlay key={spec.key} spec={spec} running onDone={onDone} />
}

function IntroOverlay({
  spec,
  running,
  onDone,
}: {
  spec: PillarIntroSpec
  running: boolean
  onDone: () => void
}) {
  const root = useRef<HTMLDivElement>(null)
  // Stable for the effect below, so a parent re-render never restarts the motion.
  const finish = useEffectEvent(onDone)

  useEffect(() => {
    if (!running || !root.current) return
    const stop = animateIntro(root.current, spec.pillar, finish)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') finish()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      stop()
      window.removeEventListener('keydown', onKey)
    }
  }, [running, spec.pillar])

  const words = WORDS[spec.pillar]
  return (
    <div
      ref={root}
      className='pillar-intro'
      data-pillar={spec.pillar}
      aria-hidden
      onClick={onDone}
    >
      <svg data-part='fx' className='pillar-intro__fx' />
      {spec.pillar === 'live' && (
        <>
          <div data-part='beam-l' className='pillar-intro__beam pillar-intro__beam--l' />
          <div data-part='beam-r' className='pillar-intro__beam pillar-intro__beam--r' />
        </>
      )}
      {spec.pillar !== 'travel' && (
        <div data-part='touchline' className='pillar-intro__touchline' />
      )}
      <div data-part='word' className='pillar-intro__word'>
        <div data-part='text' translate='no' className='pillar-intro__text notranslate'>
          {words.map((w, wi) => (
            <span key={w + wi} className='contents'>
              {wi > 0 && <span className='pillar-intro__gap' />}
              {w.split('').map((ch, ci) => (
                <span
                  key={ci}
                  data-part='letter'
                  className={
                    wi === words.length - 1
                      ? 'pillar-intro__letter text-primary'
                      : 'pillar-intro__letter'
                  }
                >
                  {ch}
                </span>
              ))}
            </span>
          ))}
          <span data-part='dot' className='pillar-intro__dot' />
        </div>
        <div data-part='rule' className='pillar-intro__rule' />
        <div data-part='label' className='pillar-intro__label'>
          {spec.label}
        </div>
      </div>
      {spec.pillar === 'travel' ? (
        <svg data-part='ball' className='pillar-intro__ball' viewBox='0 0 24 24'>
          <path
            d='M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z'
            className='fill-band-ink-fg stroke-primary'
            strokeWidth='1.2'
            strokeLinecap='round'
            strokeLinejoin='round'
          />
        </svg>
      ) : (
        <svg data-part='ball' className='pillar-intro__ball' viewBox='0 0 100 100'>
          <circle cx='50' cy='50' r='46' className='fill-band-ink-fg stroke-band-ink' strokeWidth='4' />
          <polygon points='50,30 69,44 62,66 38,66 31,44' className='fill-band-ink' />
          <path
            d='M50 30 50 6 M69 44 92 37 M62 66 76 86 M38 66 24 86 M31 44 8 37'
            className='stroke-band-ink'
            strokeWidth='4'
            fill='none'
          />
          <path
            d='M37 9 50 6 63 9 M84 22 92 37 91 52 M86 74 76 86 63 93 M37 93 24 86 14 74 M9 52 8 37 16 22'
            className='stroke-band-ink'
            strokeWidth='7'
            fill='none'
            strokeLinecap='round'
          />
          <circle cx='50' cy='50' r='46' fill='none' className='stroke-primary' strokeWidth='3' />
        </svg>
      )}
      <span className='pillar-intro__skip'>Tap to skip</span>
    </div>
  )
}

/* ── The motion ──────────────────────────────────────────────────────────
   Web Animations, measured from the live layout so the ball lands exactly
   on the full stop at any screen size. Returns a function that stops it. */
function animateIntro(root: HTMLElement, pillar: Pillar, finish: () => void) {
  const q = <T extends Element = HTMLElement>(part: string) =>
    root.querySelector(`[data-part="${part}"]`) as T | null
  const ball = q<SVGSVGElement>('ball')!
  const word = q('word')!
  const rule = q('rule')!
  const label = q('label')!
  const dotEl = q('dot')!
  const fx = q<SVGSVGElement>('fx')!
  const touchline = q('touchline')
  const letters = root.querySelectorAll<HTMLElement>('[data-part="letter"]')
  const running: Animation[] = []
  const timers: number[] = []

  const anim = (el: Element, frames: Keyframe[], opts: KeyframeAnimationOptions) => {
    const a = el.animate(frames, { fill: 'both', ...opts })
    running.push(a)
    return a
  }

  const box = root.getBoundingClientRect()
  const W = box.width
  const H = box.height
  const size = ball.getBoundingClientRect().width
  const lineY = H * 0.8
  if (touchline) touchline.style.top = `${lineY}px`
  const d = dotEl.getBoundingClientRect()
  const land = { x: d.left - box.left + d.width / 2, y: d.bottom - box.top - d.width / 2 }
  const endScale = d.width / size
  const at = (x: number, y: number, rot: number, s: number) =>
    `translate(${x - size / 2}px, ${y - size / 2}px) rotate(${rot}deg) scale(${s})`

  let landAt: number
  if (pillar === 'travel') {
    // A dashed flight path, revealed behind the ball as it flies
    const x0 = -size, y0 = H * 0.92, cx = W * 0.2, cy = -H * 0.15
    const path = `M${x0} ${y0} Q${cx} ${cy} ${land.x} ${land.y}`
    fx.setAttribute('viewBox', `0 0 ${W} ${H}`)
    fx.innerHTML =
      `<defs><mask id="pillar-route" maskUnits="userSpaceOnUse" x="0" y="${-H}" width="${W}" height="${H * 2}">` +
      `<path data-part="reveal" d="${path}" fill="none" stroke="white" stroke-width="8"></path></mask></defs>` +
      `<path data-part="route" d="${path}" fill="none" class="stroke-primary" stroke-opacity="0.6" stroke-width="2" stroke-dasharray="6 9" mask="url(#pillar-route)"></path>`
    const reveal = q<SVGPathElement>('reveal')!
    const len = reveal.getTotalLength()
    reveal.style.strokeDasharray = `${len}`
    anim(reveal, [{ strokeDashoffset: len }, { strokeDashoffset: 0 }], { duration: 1100, easing: 'cubic-bezier(.45,0,.25,1)' })
    anim(q('route')!, [{ opacity: 1 }, { opacity: 1, offset: 0.7 }, { opacity: 0 }], { duration: 1700 })
    // The drawing's nose points up and to the right, so 45° lines it up with
    // the direction of travel.
    const heading = (dx: number, dy: number) => (Math.atan2(dy, dx) * 180) / Math.PI + 45
    const curve = (
      p0: [number, number],
      p1: [number, number],
      p2: [number, number],
      scale: (t: number) => number,
    ) => {
      const frames: Keyframe[] = []
      for (let i = 0; i <= 24; i++) {
        const t = i / 24, mt = 1 - t
        const bx = mt * mt * p0[0] + 2 * mt * t * p1[0] + t * t * p2[0]
        const by = mt * mt * p0[1] + 2 * mt * t * p1[1] + t * t * p2[1]
        const dx = 2 * mt * (p1[0] - p0[0]) + 2 * t * (p2[0] - p1[0])
        const dy = 2 * mt * (p1[1] - p0[1]) + 2 * t * (p2[1] - p1[1])
        frames.push({ transform: at(bx, by, heading(dx, dy), scale(t)), offset: t })
      }
      return frames
    }
    anim(
      ball,
      curve([x0, y0], [cx, cy], [land.x, land.y], (t) => 1 + Math.sin(t * Math.PI) * 0.35),
      { duration: 1100, easing: 'cubic-bezier(.45,0,.25,1)' },
    )
    // Past the full stop it carries on along its line, then climbs off screen.
    const reach = Math.hypot(land.x - cx, land.y - cy) || 1
    const push = size * 2.5
    anim(
      ball,
      curve(
        [land.x, land.y],
        [land.x + ((land.x - cx) / reach) * push, land.y + ((land.y - cy) / reach) * push],
        [W + size * 2, H * 0.08],
        () => 1,
      ),
      { duration: 500, delay: 1100, easing: 'cubic-bezier(.4,0,.8,.6)', fill: 'forwards' },
    )
    anim(dotEl, [{ transform: 'scale(0)' }, { transform: 'scale(1.5)', offset: 0.6 }, { transform: 'scale(1)' }], {
      duration: 300,
      delay: 1060,
    })
    landAt = 1100
    reveal_(650)
  } else {
    if (pillar === 'live') {
      const sweep = (el: Element, from: number, to: number, delay: number) =>
        anim(el, [
          { opacity: 0, transform: `rotate(${from}deg)` },
          { opacity: 1, transform: `rotate(${to}deg)`, offset: 0.6 },
          { opacity: 0.55, transform: `rotate(${to * 1.3}deg)` },
        ], { duration: 1100, delay, easing: 'cubic-bezier(.2,.7,.3,1)' })
      sweep(q('beam-l')!, -38, -14, 0)
      sweep(q('beam-r')!, 38, 14, 80)
    }
    if (touchline)
      anim(touchline, [{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], { duration: 450, easing: 'cubic-bezier(.2,.7,.3,1)' })
    const rollEnd = W * 0.38
    const rot = ((rollEnd + size) / (Math.PI * size)) * 360
    const frames: Keyframe[] = [
      { transform: at(-size, lineY - size / 2, 0, 1), offset: 0, easing: 'cubic-bezier(.2,.7,.3,1)' },
      { transform: at(rollEnd, lineY - size / 2, rot, 1), offset: 0.42 },
    ]
    if (pillar === 'play') {
      // two keepy-ups on the spot
      frames.push({ transform: at(rollEnd, lineY - size * 2.1, rot + 90, 1), offset: 0.52, easing: 'cubic-bezier(.4,0,1,1)' })
      frames.push({ transform: at(rollEnd, lineY - size / 2, rot + 140, 1), offset: 0.6, easing: 'cubic-bezier(0,0,.6,1)' })
    }
    // the last pop arcs over onto the full stop
    const apexY = Math.min(land.y - size * 2.4, H * 0.12)
    frames.push({ transform: at((rollEnd + land.x) / 2, apexY, rot + 260, 1.1), offset: 0.8, easing: 'cubic-bezier(.4,0,1,1)' })
    frames.push({ transform: at(land.x, land.y, rot + 380, endScale), offset: 1 })
    anim(ball, frames, { duration: 1300 })
    landAt = 1300
    reveal_(700)
  }

  function reveal_(start: number) {
    letters.forEach((el, i) =>
      anim(el, [{ opacity: 0, transform: 'translateY(30%)' }, { opacity: 1, transform: 'translateY(0)' }], {
        duration: 320,
        delay: start + i * 45,
        easing: 'cubic-bezier(.2,.7,.3,1)',
      }),
    )
  }

  // the word gives a little as the ball lands, then the rule and label draw in
  anim(word, [{ scale: '1' }, { scale: '1.03', offset: 0.4 }, { scale: '1' }], { duration: 260, delay: landAt })
  anim(rule, [{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], { duration: 380, delay: landAt + 40, easing: 'cubic-bezier(.2,.7,.3,1)' })
  anim(label, [{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 320, delay: landAt + 160 })

  // hand over to the page
  anim(root, [{ opacity: 1, scale: '1' }, { opacity: 0, scale: '1.04' }], { duration: OUT_FOR, delay: OUT_AT, easing: 'cubic-bezier(.65,0,.35,1)' })
  timers.push(window.setTimeout(finish, OUT_AT + OUT_FOR))

  return () => {
    running.forEach((a) => a.cancel())
    timers.forEach((t) => window.clearTimeout(t))
  }
}
