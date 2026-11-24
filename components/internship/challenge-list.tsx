import type { InternshipChallenge } from '@/store/internship'

export function ChallengeList({ title, challenges }: { title?: string; challenges: InternshipChallenge[] }) {
  return (
    <div className='overflow-hidden rounded-3xl border border-border bg-card'>
      {title && (
        <div className='flex flex-wrap items-baseline justify-between gap-2 border-b border-border px-5 py-4 sm:px-6'>
          <h3 className='text-lg font-bold text-foreground'>{title}</h3>
          <span className='font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground'>
            Question → expected output
          </span>
        </div>
      )}
      <ul>
        {challenges.map((challenge) => (
          <li
            key={challenge.question}
            className='grid gap-2 border-b border-border px-5 py-4 last:border-b-0 sm:px-6 md:grid-cols-[1.1fr_1fr] md:items-center md:gap-6'
          >
            <p className='font-heading text-base font-semibold leading-snug text-foreground'>
              &ldquo;{challenge.question}&rdquo;
            </p>
            <p className='flex items-baseline gap-2 text-sm text-muted-foreground'>
              <span className='shrink-0 font-mono text-[10px] uppercase tracking-[0.14em] text-brand-text'>
                Output
              </span>
              {challenge.output}
            </p>
          </li>
        ))}
      </ul>
    </div>
  )
}
