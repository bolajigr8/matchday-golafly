// components/shared/page-title-band.tsx
//
// Compact page title (the page's <h1>) for search pages whose content is
// rendered in the browser (/flights, /stays). A server component, rendered
// by the page outside any Suspense boundary, so the heading is always in
// the raw HTML (SEO re-crawl, Nov 2026). Same band background as the search
// bars below it, so title + search read as one header.

export function PageTitleBand({
  title,
  subtitle,
}: {
  title: string
  subtitle?: string
}) {
  return (
    <div className='bg-card/60'>
      <div className='page-container pt-6 pb-1 sm:pt-8'>
        <h1 className='font-heading text-[22px] font-extrabold uppercase leading-[1.1] tracking-tight text-foreground sm:text-[30px]'>
          {title}
        </h1>
        {subtitle && (
          <p className='mt-1 text-[13px] text-muted-foreground sm:text-[14px]'>
            {subtitle}
          </p>
        )}
      </div>
    </div>
  )
}
