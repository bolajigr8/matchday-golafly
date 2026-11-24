import Link from 'next/link'
import { ArrowRight, ChevronDown } from 'lucide-react'
import { JsonLd, pageFaqSchema } from '@/lib/golafly-schema'
import { PAGE_FAQS, type PageFaqPath } from '@/store/page-faqs'

/* "Questions, answered" block for hub and programme pages, plus its
   FAQPage JSON-LD. A server component: the questions AND answers are in the
   raw HTML (SEO), and <details> opens and closes without JavaScript.
   Content lives in store/page-faqs.ts. */

export function PageFaq({ path }: { path: PageFaqPath }) {
  const faqs = PAGE_FAQS[path]
  const schema = pageFaqSchema(path, faqs)
  if (!schema) return null
  const titleId = `faq-title-${path.replace(/\W+/g, '-')}`

  return (
    <section aria-labelledby={titleId} className='border-t border-border bg-background py-16 sm:py-20 lg:py-24'>
      <JsonLd data={schema} />
      <div className='page-container grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-12'>
        <div className='lg:col-span-4'>
          <p className='flex items-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-text'>
            <span aria-hidden className='size-1.5 rounded-full bg-primary' />
            Good to know
          </p>
          <h2
            id={titleId}
            className='mt-3 font-heading text-[28px] font-bold uppercase leading-[1.02] tracking-[-0.01em] text-foreground sm:text-[36px]'
          >
            Questions, answered
          </h2>
          <p className='mt-3 max-w-sm text-[15px] leading-relaxed text-muted-foreground'>
            Can’t find what you’re looking for? Our support team is available 24/7.
          </p>
          <Link
            href='/help-faqs'
            className='group mt-5 inline-flex items-center gap-2 rounded-full text-[14px] font-semibold text-foreground underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary'
          >
            All help &amp; FAQs
            <ArrowRight aria-hidden className='size-4 transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transition-none' />
          </Link>
        </div>

        <div className='lg:col-span-8'>
          <div className='divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card'>
            {faqs.map((item, i) => (
              <details key={item.q} className='group' open={i === 0}>
                <summary className='flex cursor-pointer list-none items-start justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-muted/40 sm:px-6 sm:py-5 [&::-webkit-details-marker]:hidden'>
                  <h3 className='text-[15px] font-semibold leading-snug text-foreground sm:text-[16px]'>
                    {item.q}
                  </h3>
                  <span
                    aria-hidden
                    className='mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground transition-[transform,background-color,color,border-color] duration-200 group-open:rotate-180 group-open:border-primary group-open:bg-primary group-open:text-primary-foreground'
                  >
                    <ChevronDown className='size-3.5' />
                  </span>
                </summary>
                <p className='px-5 pb-5 text-[14px] leading-relaxed text-muted-foreground sm:px-6 sm:text-[15px]'>
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
