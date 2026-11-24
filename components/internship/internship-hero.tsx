import { ArrowRight } from 'lucide-react'
import { Routes } from '@/routes'
import { EXAMPLE_CHALLENGES } from '@/store/internship'
import { ApplyLink, BrochureButton, Eyebrow } from './ui'

/* The right-hand card shows what an internship actually looks like: one real
   challenge from the programme, part-way through its four steps. */
const BRIEF_STEPS = [
  { label: 'Research competitors & journeys', state: 'Done' },
  { label: 'Analyse gaps in checkout', state: 'Done' },
  { label: 'Build a bundle proposal', state: 'Week 6' },
  { label: 'Present to the Golafly team', state: 'Next' },
]
const CURRENT_STEP = 2

export function InternshipHero({ brochureUrl }: { brochureUrl: string }) {
  const challenge = EXAMPLE_CHALLENGES[0]

  return (
    <section className='relative overflow-hidden border-b border-border'>
      <div
        aria-hidden
        className='pointer-events-none absolute inset-0 [background-size:64px_64px] [background-image:linear-gradient(color-mix(in_oklch,var(--foreground)_5%,transparent)_1px,transparent_1px),linear-gradient(90deg,color-mix(in_oklch,var(--foreground)_5%,transparent)_1px,transparent_1px)] [mask-image:linear-gradient(to_bottom,black,transparent)]'
      />
      <div
        aria-hidden
        className='pointer-events-none absolute inset-0 [background:radial-gradient(55%_70%_at_85%_30%,color-mix(in_oklch,var(--brand)_22%,transparent),transparent_70%)]'
      />

      <div className='page-container relative grid items-center gap-12 py-14 sm:py-20 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16 lg:py-28'>
        <div className='animate-in fade-in slide-in-from-bottom-3 duration-500'>
          <Eyebrow>Golafly Internship</Eyebrow>
          <h1 className='mt-5 text-[2.6rem] font-bold uppercase leading-[0.95] tracking-tight text-foreground sm:text-7xl lg:text-[4.25rem] xl:text-[4.75rem] 2xl:text-[5.5rem]'>
            Turn knowledge into <span className='whitespace-nowrap text-brand-text'>real‑world</span> impact
          </h1>
          <p className='mt-5 font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground'>
            <span className='text-foreground'>Research.</span> Build. Innovate.
          </p>
          <p className='mt-5 max-w-xl text-[15px] leading-relaxed text-foreground/75 sm:text-base'>
            Turn your university knowledge into real-world experience. At Golafly, interns work on real
            projects across travel, football, product, marketing and partnerships, and help shape the
            future of Golafly.
          </p>
          <div className='mt-8 flex flex-col gap-3 sm:flex-row'>
            <ApplyLink href={Routes.internshipApply} className='w-full sm:w-auto'>
              Apply Now
              <ArrowRight className='size-4' strokeWidth={2.5} />
            </ApplyLink>
            <BrochureButton href={brochureUrl} className='w-full sm:w-auto' />
          </div>
        </div>

        <aside
          aria-label='Example intern challenge'
          className='mx-auto grid w-full max-w-md gap-4 rounded-3xl border border-border bg-card p-5 shadow-[0_24px_48px_-24px_color-mix(in_oklch,var(--foreground)_30%,transparent)] animate-in fade-in slide-in-from-bottom-4 duration-700 sm:p-6'
        >
          <div className='flex items-center justify-between gap-3 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground'>
            <span>Intern challenge · Matchday</span>
            <span className='inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-status-good-bg px-2.5 py-0.5 text-status-good'>
              <span className='size-1.5 rounded-full bg-status-good' />
              In progress
            </span>
          </div>
          <h2 className='text-xl font-bold leading-snug text-foreground sm:text-[22px]'>{challenge.question}</h2>
          <ol className='grid gap-2'>
            {BRIEF_STEPS.map((step, i) => (
              <li
                key={step.label}
                className={`grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-xl px-3 py-2.5 text-sm ${
                  i === CURRENT_STEP
                    ? 'bg-primary/15 text-foreground ring-1 ring-brand-text/35'
                    : 'bg-muted text-foreground/85'
                }`}
              >
                <span className={`font-mono text-xs ${i <= CURRENT_STEP ? 'text-brand-text' : 'text-muted-foreground'}`}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span>{step.label}</span>
                <span className='font-mono text-[11px] text-muted-foreground'>{step.state}</span>
              </li>
            ))}
          </ol>
          <div className='flex flex-wrap justify-between gap-x-4 gap-y-1 border-t border-border pt-3 text-[13px]'>
            <span className='text-muted-foreground'>Output</span>
            <span className='font-semibold text-foreground'>{challenge.output}</span>
          </div>
        </aside>
      </div>
    </section>
  )
}
