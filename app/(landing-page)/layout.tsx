// app/(site)/layout.tsx
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <header className='sticky top-0 z-50 px-3 pt-3 sm:px-5 sm:pt-4'>
        <Navbar />
      </header>
      <div className='flex flex-1 flex-col'>{children}</div>
      <Footer />
    </>
  )
}
