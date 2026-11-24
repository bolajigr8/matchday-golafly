import Link from 'next/link'
import { ArrowRight, Check, ChevronRight, Download } from 'lucide-react'
import { Routes } from '@/routes'
import type { InternshipSettings } from '@/sanity/internship'
import {
  BROCHURE_FILENAME,
  INTERNSHIP_STAGES,
  POSITION_DEFAULTS,
  type InternshipList,
  type InternshipPosition,
} from '@/store/internship'
import { ChallengeList } from './challenge-list'
import { PositionCard, PositionNumber } from './position-card'
import { ApplyLink, Eyebrow } from './ui'

export function PositionDetail({
  position,
  others,
  settings,
}: {
  position: InternshipPosition
  others: InternshipPosition[]
  settings: InternshipSettings
}) {
  const applyHref = Routes.internshipApplyFor(position.slug)
  const facts = [
    ['Format', position.workMode || POSITION_DEFAULTS.workMode],
    ['Location', position.location || POSITION_DEFAULTS.location],
    ['Duration', position.duration || POSITION_DEFAULTS.duration],
    ['Certificate', 'On completion'],
  ]

  return (
    <div className='min-h-screen bg-background pb-24 lg:pb-0'>
      <div className='page-container'>
        <nav aria-label='Breadcrumb' className='flex flex-wrap items-center gap-1.5 pt-6 text-[13px] text-muted-foreground sm:pt-8'>
          <Link href={Routes.internship} className='hover:text-foreground'>
            Internship
          </Link>
          <ChevronRight className='size-3.5' />
          <Link href={`${Routes.internship}#positions`} className='hover:text-foreground'>
            Positions
          </Link>
          <ChevronRight className='size-3.5' />
          <span className='text-foreground'>{position.title}</span>
        </nav>

        <header className='grid gap-4 border-b border-border py-7 sm:py-10'>
          <PositionNumber order={position.order} className='text-5xl sm:text-6xl' />
          <h1 className='text-[2.1rem] font-bold leading-none tracking-tight text-foreground sm:text-5xl lg:text-6xl'>
            {position.title}
          </h1>
          {position.focus && (
            <p className='max-w-3xl text-base text-foreground/80 sm:text-lg'>{position.focus}</p>
          )}
          {position.tags.length > 0 && (
            <div className='flex flex-wrap gap-1.5'>
              {position.tags.map((tag) => (
                <span key={tag} className='rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs text-muted-foreground'>
                  {tag}
                </span>
              ))}
            </div>
          )}
        </header>

        <div className='grid items-start gap-10 py-10 lg:grid-cols-[1fr_360px] lg:gap-12 lg:pb-16'>
          <div className='grid min-w-0 gap-10'>
            {position.overview && (
              <Block title='About the role'>
                <p className='max-w-[65ch] leading-relaxed text-foreground/85'>{position.overview}</p>
              </Block>
            )}

            {position.lists.map((list) => (
              <Block key={list.title} title={list.title}>
                <ListBody list={list} />
              </Block>
            ))}

            {position.deliverables.length > 0 && (
              <Block title='Typical deliverables'>
                <TickList items={position.deliverables} />
              </Block>
            )}

            {position.challenge?.question && (
              <Block title='Your Golafly Challenge'>
                <ChallengeList challenges={[position.challenge]} />
              </Block>
            )}

            <Block title='How the internship runs'>
              <ol className='grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-5'>
                {INTERNSHIP_STAGES.map((stage, i) => (
                  <li key={stage.title} className='rounded-2xl border border-border bg-card p-4'>
                    <span className='font-mono text-[11px] tracking-[0.12em] text-brand-text'>
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <h3 className='mt-1 text-base font-bold text-foreground'>{stage.title}</h3>
                    <p className='mt-1 text-[13px] leading-snug text-muted-foreground'>{stage.activity}</p>
                    <p className='mt-2 text-[13px] font-semibold leading-snug text-foreground'>→ {stage.output}</p>
                  </li>
                ))}
              </ol>
            </Block>
          </div>

          <aside className='grid gap-4 lg:sticky lg:top-[calc(6rem+var(--bf-bar-h,0px))]'>
            <div className='grid gap-4 rounded-2xl border border-border bg-card p-6'>
              <h2 className='text-lg font-bold text-foreground'>Apply for this role</h2>
              <dl className='text-sm'>
                {facts.map(([label, value]) => (
                  <div key={label} className='flex justify-between gap-4 border-b border-border py-2.5 last:border-b-0'>
                    <dt className='text-muted-foreground'>{label}</dt>
                    <dd className='text-right font-semibold text-foreground'>{value}</dd>
                  </div>
                ))}
              </dl>
              <ApplyLink href={applyHref} className='hidden w-full lg:inline-flex'>
                Apply for this role
                <ArrowRight className='size-4' strokeWidth={2.5} />
              </ApplyLink>
              <p className='hidden text-center text-xs text-muted-foreground lg:block'>CV upload · takes about 5 minutes</p>
            </div>

            <a
              href={settings.brochureUrl}
              download={BROCHURE_FILENAME}
              className='group flex items-center gap-4 rounded-2xl border border-border bg-card p-5 transition-colors hover:border-brand-text/45'
            >
              <span
                aria-hidden
                className='grid h-13 w-11 shrink-0 place-items-end justify-center rounded-lg border border-border bg-muted pb-1.5 font-mono text-[9px] font-bold text-brand-text'
              >
                PDF
              </span>
              <span className='min-w-0 flex-1'>
                <span className='block text-sm font-semibold text-foreground'>Programme brochure</span>
                <span className='block text-xs text-muted-foreground'>All 6 tracks, methodology &amp; partnership model</span>
              </span>
              <span className='inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border px-3 py-2 text-xs font-semibold text-foreground transition-colors group-hover:border-brand-text/50'>
                <Download className='size-3.5' strokeWidth={2.5} />
                Download
              </span>
            </a>
          </aside>
        </div>

        {others.length > 0 && (
          <section className='space-y-6 border-t border-border py-12 sm:py-16'>
            <Eyebrow>Other positions</Eyebrow>
            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:gap-6'>
              {others.map((other) => (
                <PositionCard key={other.slug} position={other} />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Phones: the side card sits below the content, so the apply action
          stays pinned to the bottom of the screen instead. */}
      <div className='fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur lg:hidden'>
        <div className='mx-auto flex max-w-xl items-center gap-3'>
          <p className='min-w-0 flex-1 truncate text-sm font-semibold text-foreground'>{position.title}</p>
          <ApplyLink href={applyHref} className='shrink-0 px-5 py-3'>
            Apply
            <ArrowRight className='size-4' strokeWidth={2.5} />
          </ApplyLink>
        </div>
      </div>
    </div>
  )
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className='mb-4 text-xl font-bold text-foreground sm:text-2xl'>{title}</h2>
      {children}
    </section>
  )
}

function TickList({ items }: { items: string[] }) {
  return (
    <ul className='grid gap-2.5'>
      {items.map((item) => (
        <li key={item} className='flex gap-3 text-foreground/90'>
          <Check className='mt-1 size-4 shrink-0 text-brand-text' strokeWidth={2.5} />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

function ListBody({ list }: { list: InternshipList }) {
  if (list.style === 'pills') {
    return (
      <ul className='flex flex-wrap gap-2'>
        {list.items.map((item) => (
          <li key={item} className='rounded-full border border-border bg-card px-3 py-1.5 text-[13px] text-foreground'>
            {item}
          </li>
        ))}
      </ul>
    )
  }
  if (list.style === 'questions') {
    return (
      <ul className='grid gap-2.5'>
        {list.items.map((item) => (
          <li key={item} className='rounded-xl bg-muted px-4 py-3.5 text-sm text-foreground'>
            {item}
          </li>
        ))}
      </ul>
    )
  }
  return <TickList items={list.items} />
}
