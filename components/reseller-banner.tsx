/* Reseller notice: the very first strip on every page that sells tickets
   (main site, checkout, landing sites). On the main site and checkout it is
   part of the sticky header block, so it stays on screen while scrolling.

   Golafly is a secondary ticket seller. Google Ads' event-ticket policy
   (support.google.com/adspolicy/answer/7577050) asks for the disclosure to
   sit in the top 20% of every page, in text at least as large as most of
   the page's text, and never in a closable, collapsible or pop-up format.
   So: body-size text (15–16px), always open, part of the server HTML, and
   never hidden at any screen size. */

export const RESELLER_NOTICE =
  'Golafly is a ticket resale marketplace and is not the primary ticket provider. Ticket prices may be higher than face value.'

export function ResellerBanner() {
  return (
    <div
      role='note'
      aria-label='Ticket reseller notice'
      className='relative overflow-hidden bg-[color-mix(in_oklch,var(--primary)_16%,var(--background))] text-foreground dark:bg-navbar dark:bg-[radial-gradient(30%_160%_at_100%_50%,color-mix(in_oklch,var(--primary)_10%,transparent),transparent_70%)]'
    >
      {/* Plain text, no bold or colour accents (kept low-key on purpose; the
          size and position are what the policy asks for). */}
      <p className='page-container py-2 text-center text-[15px] leading-[1.45] text-muted-foreground sm:py-2.5 sm:text-[16px]'>
        {/* Phones: slightly shorter, same three facts. Wording from the SEO /
            Google certification brief (2026-11-12). */}
        <span className='sm:hidden'>
          Golafly is a ticket resale marketplace, not the primary ticket provider. Prices may be higher than face value.
        </span>
        <span className='hidden sm:inline'>{RESELLER_NOTICE}</span>
      </p>

      {/* Tear line along the bottom edge. */}
      <span
        aria-hidden
        className='pointer-events-none absolute inset-x-0 bottom-0 h-px bg-[repeating-linear-gradient(90deg,color-mix(in_oklch,var(--foreground)_35%,transparent)_0_6px,transparent_6px_11px)] dark:bg-[repeating-linear-gradient(90deg,color-mix(in_oklch,var(--primary)_55%,transparent)_0_6px,transparent_6px_11px)]'
      />
    </div>
  )
}
