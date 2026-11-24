import { cn } from '@/lib/utils'

/* The landing page's numbered section heading (Figma: "Section head" in
 * each Step frame): gold dot + mono eyebrow, then a two-line title whose
 * second line sits on a gold block, then an optional intro line.
 *
 * Two looks in the file: steps 2–3 use a gold eyebrow and a gold GRADIENT
 * block; steps 1, 4 and "Why" use a light eyebrow and a SOLID gold block. */
export function VipSectionHead({
  eyebrow,
  line1,
  line2,
  intro,
  introWidth = 700,
  tone = 'solid',
  className,
  id,
}: {
  /** Figma text-box width of the intro: 680 in step 2, 700 elsewhere. */
  introWidth?: 680 | 700
  eyebrow: string
  line1: string
  line2: string
  /** 18/28 grey intro under the title (Figma widths 680–700px). */
  intro?: string
  tone?: 'solid' | 'gradient'
  className?: string
  /** id for the <h2>, so the section can be labelled by it. */
  id?: string
}) {
  const gradient = tone === 'gradient'
  return (
    <div className={cn('flex flex-col items-start gap-5', className)}>
      <p
        className={cn(
          'flex items-center gap-3 font-mono text-[11px] font-medium leading-[normal] tracking-[2.2px] sm:text-[13px] sm:tracking-[2.86px]',
          gradient ? 'text-vip-gold-text' : 'text-vip-body',
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src='/figma/vip/dot-gold.svg' alt='' width={7} height={7} className='size-[7px] shrink-0' />
        {eyebrow}
      </p>
      <h2
        id={id}
        className='flex flex-col items-start gap-1 font-heading text-[34px] font-bold leading-[0.96] tracking-[-0.02em] sm:text-[44px] xl:text-[52px]'
      >
        <span className='text-vip-fg'>{line1}</span>
        <span
          className={cn(
            'px-[0.27em] pt-[0.04em] text-[#0a0a0a]',
            gradient
              ? 'bg-linear-to-r from-vip-gold-light to-vip-gold-deep'
              : 'bg-vip-gold',
          )}
        >
          {line2}
        </span>
      </h2>
      {intro && (
        <p
          className={cn(
            'text-[16px] leading-7 text-vip-muted sm:text-[18px]',
            introWidth === 680 ? 'max-w-[680px]' : 'max-w-[700px]',
          )}
        >
          {intro}
        </p>
      )}
    </div>
  )
}
