import { cn } from '@/lib/utils'

interface FlagProps {
  /** ISO 3166-1 alpha-2 country code, case-insensitive. `eu` is also valid. */
  code?: string | null
  className?: string
  /**
   * Only for the rare case where the flag is the sole label. Leave unset and
   * the flag is treated as decorative (see below).
   */
  title?: string
  /**
   * Load only when scrolled near. For long lists (the ~250-country
   * citizenship picker), where loading every flag at once would cost ~2 MB.
   */
  lazy?: boolean
}

/**
 * A country flag, as a real image.
 *
 * The site used to carry flag EMOJI in its data ('🇬🇧', '🇪🇸', …). Windows ships
 * no flag-emoji font, so the browser falls back to drawing the two regional
 * indicator letters the emoji is built from — every flag on the site read as
 * "GB", "FR", "ES". These are static 4:3 SVGs from lipis/flag-icons (MIT),
 * served from public/flags.
 *
 * Plain <img>, not next/image: the pipeline does not optimise SVG, and the
 * project does not enable `dangerouslyAllowSVG`. Sizing is in `em` so a flag
 * tracks whatever font-size it is dropped into — 4:3 exactly, so nothing crops.
 *
 * Decorative by default: a flag here always sits beside the name it belongs to
 * (the language, the city, the destination), so repeating it for a screen
 * reader would only add noise.
 */
export function Flag({ code, className, title, lazy }: FlagProps) {
  // Not every row has a country — the "Global eSIM" plan and the bank offer on
  // /offers are deliberately flagless.
  if (!code) return null

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/flags/${code.toLowerCase()}.svg`}
      alt={title ?? ''}
      aria-hidden={title ? undefined : true}
      width={16}
      height={12}
      // Not lazy by default. These are icon-sized SVGs, and the ones that
      // matter most live inside closed dropdowns — lazy-loading defers the
      // fetch until the panel opens and the flags visibly pop in. Long lists
      // opt in with `lazy`.
      loading={lazy ? 'lazy' : undefined}
      decoding='async'
      className={cn(
        'inline-block h-[0.9em] w-[1.2em] shrink-0 rounded-[2px] object-cover align-[-0.12em]',
        className,
      )}
    />
  )
}
