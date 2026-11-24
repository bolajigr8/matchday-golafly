import type { Metadata } from 'next'
import { Suspense } from 'react'
import { ApplyNowClient } from './client'
import { canonical } from '@/lib/seo'
import { JsonLd, simplePageSchema } from '@/lib/golafly-schema'
import { metaText } from '@/lib/schema-data'

export const metadata: Metadata = {
  alternates: canonical('/apply-now'),
  title: 'Apply Now: Football Tourism & Player Programmes | Golafly',
  description:
    'Apply for a Golafly programme: football tourism, player management or sports marketing. Submit your details and our team will get back to you by email.',
}

function ApplyNowPageView() {
  return (
    // The form reads ?program= with useSearchParams(), so the server can only
    // send this fallback. It carries the page's <h1> (same markup and spot as
    // in ApplicationForm) so the heading is in the raw HTML (SEO re-crawl,
    // Nov 2026) and nothing shifts when the form takes over.
    <Suspense
      fallback={
        <section className='relative min-h-screen w-full bg-background py-[80px] lg:py-[120px]'>
          <div className='relative z-20 w-full max-w-[900px] mx-auto px-[20px] lg:px-[60px]'>
            <div className='text-center mb-[32px] lg:mb-[40px]'>
              <h1 className='text-[#b4ff39] text-[36px] lg:text-[48px] font-bold mb-[8px] lg:mb-[12px] uppercase tracking-[2px] lg:tracking-[3px] leading-[1.2]'>
                APPLY NOW
              </h1>
              <p className='text-muted-foreground'>Loading application...</p>
            </div>
          </div>
        </section>
      }
    >
      <ApplyNowClient />
    </Suspense>
  )
}

/* JSON-LD (SEO schema plan): built on the server from this page's own
   metadata, so it is in the raw HTML and always matches the meta tags. */
export default function ApplyNowPage() {
  const schema = simplePageSchema({ path: '/apply-now', pageName: 'Apply Now', ...metaText(metadata) })
  return (
    <>
      <JsonLd data={schema} />
      <ApplyNowPageView />
    </>
  )
}
