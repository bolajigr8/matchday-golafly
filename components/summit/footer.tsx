import Link from 'next/link'
import { Footer } from '@/components/footer'
import { CONTACT } from '@/store/data'
import { Routes } from '@/routes'

/* Figma landing "Footer": the site footer, in the summit's colours: light
   in light mode, dark in dark mode (the site's own footer is dark in both).
   Same component, so the newsletter form and every link keep working; only
   the colour variables change, inside `.wfs-footer` (app/globals.css). */
export function SummitFooter() {
  return (
    <div className='wfs-footer'>
      <Footer />
    </div>
  )
}

/* Figma booking steps "Footer": one line, 72px. */
export function SummitFlowFooter() {
  const link = 'rounded-sm font-medium text-wfs-text hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wfs-lime'
  return (
    <footer className='border-t border-wfs-line bg-wfs-surface'>
      <div className='page-container flex flex-col gap-3 py-7 text-[12.5px] leading-[normal] text-wfs-muted md:flex-row md:items-center md:justify-between'>
        <p>© 2026 Golafly Ltd · Official travel partner of World Football Summit</p>
        <nav aria-label='Help and legal' className='flex flex-wrap gap-x-5 gap-y-2'>
          <Link href='/help-faqs' className={link}>Help &amp; FAQs</Link>
          <Link href={Routes.legalTerms} className={link}>Terms</Link>
          <Link href={Routes.legalPrivacy} className={link}>Privacy</Link>
          <Link href={Routes.legalRefund} className={link}>Refund policy</Link>
          <a href={CONTACT.whatsapp} target='_blank' rel='noopener noreferrer' className={link}>WhatsApp us</a>
        </nav>
      </div>
    </footer>
  )
}
