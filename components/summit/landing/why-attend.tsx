import Image from 'next/image'

/* Figma "Why attend": the photo from a past summit beside the reasons and
   three numbers. Dark in both themes. */
const NUMBERS = [
  ['150K+', 'industry members'],
  ['30+', 'summits since 2016'],
  ['11', 'host countries'],
]

export function SummitWhyAttend() {
  return (
    <section id='why' className='scroll-mt-28 bg-[#0a0a0a] dark:bg-[#131313]'>
      <div className='page-container flex flex-col gap-10 pb-10 pt-16 lg:flex-row lg:items-center lg:gap-14 lg:pt-[120px]'>
        <div className='relative aspect-[620/520] w-full overflow-hidden rounded-[28px] lg:w-[51%] lg:shrink-0'>
          <Image src='/figma/summit/why-attend.png' alt='Delegates at a World Football Summit event' fill sizes='(min-width: 1024px) 620px, 100vw' className='object-cover' />
        </div>
        <div className='flex min-w-0 flex-1 flex-col gap-6'>
          <p className='font-mono text-[11.5px] font-medium leading-[normal] tracking-[1.84px] text-wfs-lime'>02 · WHY GO</p>
          <h2 className='font-display text-[52px] leading-[0.9] text-[#f7f7f5] dark:text-[#ededed] sm:text-[72px] sm:leading-[64.8px]'>
            THE ROOM WHERE
            <br />
            FOOTBALL DEALS HAPPEN.
          </h2>
          <p className='max-w-[520px] text-[16px] leading-[1.6] text-[#a8aba6] dark:text-[#a0a0a0] sm:text-[17px] sm:leading-[27.2px]'>
            Clubs, leagues, federations, brands and investors from around the world, in one stadium for two days. Meet the people
            you email all year, in person.
          </p>
          <dl className='grid grid-cols-3 gap-x-3'>
            {NUMBERS.map(([value, label]) => (
              <div key={label} className='flex flex-col gap-1 border-t-2 border-[#121212] pt-[18px] dark:border-[#e6e6e6]'>
                <dd className='font-display text-[40px] leading-[1.2] text-[#f7f7f5] dark:text-[#ededed] sm:text-[56px]'>{value}</dd>
                <dt className='text-[12.5px] leading-[1.3] text-[#a8aba6] dark:text-[#a0a0a0] sm:text-[13.5px] sm:leading-[normal]'>{label}</dt>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  )
}
