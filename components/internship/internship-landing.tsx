import { ArrowRight, Check, Mail } from 'lucide-react'
import { SectionHead } from '@/components/home/section-head'
import { Routes } from '@/routes'
import type { InternshipSettings } from '@/sanity/internship'
import {
  CHALLENGE_FLOW,
  EXAMPLE_CHALLENGES,
  PARTNERSHIP_MODEL,
  STUDENT_DISCIPLINES,
  STUDENT_TRAITS,
  UNIVERSITY_VALUE,
  WHAT_YOU_GAIN,
  WHY_INTERN,
  type InternshipPosition,
} from '@/store/internship'
import { InternshipHero } from './internship-hero'
import { PositionCard } from './position-card'
import { ChallengeList } from './challenge-list'
import { ApplyLink, BrochureButton, Eyebrow, FeatureGrid, pillSecondary } from './ui'

export function InternshipLanding({
  positions,
  settings,
}: {
  positions: InternshipPosition[]
  settings: InternshipSettings
}) {
  return (
    <div className='relative min-h-screen bg-background'>
      <InternshipHero brochureUrl={settings.brochureUrl} />

      <div className='page-container space-y-16 py-16 sm:space-y-24 sm:py-20'>
        <section className='space-y-10 sm:space-y-12'>
          <SectionHead
            eyebrow='Why intern at Golafly'
            title={
              <>
                More than an internship. <span className='text-brand-text'>A chance to make an impact.</span>
              </>
            }
          />
          <FeatureGrid features={WHY_INTERN} />
        </section>

        <section id='positions' className='scroll-mt-24 space-y-10 sm:space-y-12'>
          <SectionHead
            eyebrow='Internship positions'
            title={
              <>
                Choose your <span className='text-brand-text'>track</span>
              </>
            }
            subtitle='Choose the area that matches your interests and help us build the future of travel and football.'
          />
          <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:gap-6'>
            {positions.map((position) => (
              <PositionCard key={position.slug} position={position} />
            ))}
          </div>
        </section>

        <section className='space-y-10 sm:space-y-12'>
          <SectionHead
            eyebrow='The Golafly Challenge'
            title={
              <>
                You don&apos;t just intern. <span className='text-brand-text'>You solve problems.</span>
              </>
            }
          />
          <ol className='grid grid-cols-2 gap-3 lg:grid-cols-4'>
            {CHALLENGE_FLOW.map((step, i) => (
              <li key={step.title} className='rounded-2xl border border-border bg-card p-4 sm:p-6'>
                <span className='font-mono text-[11px] tracking-[0.14em] text-brand-text'>
                  STEP {String(i + 1).padStart(2, '0')}
                </span>
                <h3 className='mt-2 text-lg font-bold text-foreground sm:text-[22px]'>{step.title}</h3>
                <p className='mt-1 text-[13px] leading-relaxed text-muted-foreground sm:text-sm'>{step.body}</p>
              </li>
            ))}
          </ol>
          <ChallengeList title='Example challenges' challenges={EXAMPLE_CHALLENGES} />
        </section>

        <section className='space-y-10 sm:space-y-12'>
          <SectionHead
            eyebrow="What you'll gain"
            title={
              <>
                Skills, network and <span className='text-brand-text'>a portfolio</span>
              </>
            }
            subtitle='Develop skills, build your network and create opportunities for the future.'
          />
          <FeatureGrid features={WHAT_YOU_GAIN} />
        </section>

        <section className='grid items-start gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:gap-12'>
          <div>
            <Eyebrow>Who should apply</Eyebrow>
            <h2 className='mt-3 text-2xl font-bold leading-tight tracking-tight text-foreground sm:text-4xl'>
              University students who like to dig in
            </h2>
            <p className='mt-3 text-sm text-muted-foreground sm:text-base'>
              Football knowledge helps on some tracks but isn&apos;t required for all of them.
            </p>
          </div>
          <div>
            <ul className='flex flex-wrap gap-2'>
              {STUDENT_DISCIPLINES.map((discipline) => (
                <li
                  key={discipline}
                  className='rounded-full border border-border bg-card px-3.5 py-1.5 text-sm text-foreground'
                >
                  {discipline}
                </li>
              ))}
            </ul>
            <ul className='mt-5 flex flex-wrap gap-x-4 gap-y-1.5 text-[13px] text-muted-foreground'>
              {STUDENT_TRAITS.map((trait) => (
                <li key={trait}>
                  <span className='font-bold text-brand-text'>+ </span>
                  {trait}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className='relative overflow-hidden rounded-3xl border border-border bg-card px-5 py-12 text-center sm:px-10 sm:py-20'>
          <div
            aria-hidden
            className='pointer-events-none absolute inset-0 [background:radial-gradient(60%_70%_at_50%_100%,color-mix(in_oklch,var(--brand)_22%,transparent),transparent_70%)]'
          />
          <div className='relative mx-auto max-w-2xl space-y-5'>
            <Eyebrow className='justify-center'>Ready to build with us?</Eyebrow>
            <h2 className='text-3xl font-bold leading-[1.08] tracking-tight text-foreground sm:text-5xl'>
              Your next idea could become <span className='text-brand-text'>Golafly&apos;s next product.</span>
            </h2>
            <p className='mx-auto max-w-lg text-sm text-muted-foreground sm:text-base'>
              If you are a university student looking for an internship where you can research, analyse,
              create and contribute, we&apos;d like to hear from you.
            </p>
            <div className='flex flex-col justify-center gap-3 pt-2 sm:flex-row'>
              <a href='#positions' className={`${pillSecondary} w-full sm:w-auto`}>
                View Available Positions
                <ArrowRight className='size-4' strokeWidth={2.5} />
              </a>
              <ApplyLink href={Routes.internshipApply} className='w-full sm:w-auto'>
                Apply Now
              </ApplyLink>
            </div>
          </div>
        </section>

        <UniversityPartner settings={settings} />
      </div>
    </div>
  )
}

function UniversityPartner({ settings }: { settings: InternshipSettings }) {
  const mailto = `mailto:${settings.partnerEmail}?subject=${encodeURIComponent('University partnership: Golafly Internship')}`

  return (
    <section
      id='university-partners'
      className='grid scroll-mt-24 gap-10 rounded-3xl bg-foreground px-5 py-10 text-(--uni-ink) [--uni-ink:var(--background)] sm:px-12 sm:py-14 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14 dark:border dark:border-border dark:bg-card dark:[--uni-ink:var(--foreground)]'
    >
      <div>
        <p className='inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-primary sm:text-xs'>
          <span className='size-1.5 rounded-full bg-primary' />
          University partner?
        </p>
        <h2 className='mt-4 text-3xl font-bold leading-[1.05] tracking-tight sm:text-[2.75rem]'>
          Place your students on real projects
        </h2>
        <p className='mt-4 max-w-md text-sm leading-relaxed text-(--uni-ink)/70 sm:text-base'>
          We work with universities to provide meaningful internship opportunities for their students. The
          partnership fits your internship framework, academic calendar and assessment requirements.
        </p>
        <ul className='mt-6 grid gap-2.5 text-sm'>
          {UNIVERSITY_VALUE.map((value) => (
            <li key={value} className='flex gap-2.5 text-(--uni-ink)/90'>
              <Check className='mt-0.5 size-4 shrink-0 text-primary' strokeWidth={2.5} />
              {value}
            </li>
          ))}
        </ul>
        <div className='mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap'>
          <a
            href={mailto}
            className='inline-flex items-center justify-center gap-2 rounded-full bg-primary px-7 py-3.5 text-sm font-bold text-primary-foreground transition-shadow hover:shadow-[0_0_22px_var(--brand-glow)]'
          >
            <Mail className='size-4' strokeWidth={2.5} />
            Partner With Golafly
          </a>
          <BrochureButton href={settings.brochureUrl} label='Partner Brochure' variant='inverse' />
        </div>
        <p className='mt-3 text-xs text-(--uni-ink)/55'>
          Or email <span className='select-all font-medium text-(--uni-ink)/80'>{settings.partnerEmail}</span>
        </p>
      </div>

      <div>
        <p className='mb-2 font-mono text-[10px] uppercase tracking-[0.16em] text-(--uni-ink)/60'>
          How a partnership works
        </p>
        <ol>
          {PARTNERSHIP_MODEL.map((step, i) => (
            <li
              key={i}
              className='grid grid-cols-[2.5rem_1fr] gap-3 border-b border-(--uni-ink)/15 py-4 last:border-b-0'
            >
              <span className='font-heading text-xl font-bold leading-none text-primary'>
                {String(i + 1).padStart(2, '0')}
              </span>
              <div>
                <span className='mb-1 block font-mono text-[10px] uppercase tracking-[0.14em] text-(--uni-ink)/60'>
                  {step.who}
                </span>
                <p className='text-[15px] text-(--uni-ink)/95'>{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
