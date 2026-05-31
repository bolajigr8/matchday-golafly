// app/layout.tsx
import type { Metadata } from 'next'
import { Inter, Space_Grotesk, JetBrains_Mono } from 'next/font/google'
import { ThemeProvider } from '@/components/theme-provider'
import { Providers } from '@/components/providers'
import { GoogleTranslateProvider } from '@/components/google-translate'
import './globals.css'

const spaceGrotesk = Space_Grotesk({
  variable: '--font-heading',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
})
const inter = Inter({
  variable: '--font-sans',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
})
const jetbrainsMono = JetBrains_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Matchday Builder — Your Full Football Experience',
  description:
    'Tickets · Hotel · Flights — book your complete matchday in one place.',
  icons: { icon: [{ url: '/favicon-new.png', type: 'image/png' }] },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang='en'
      suppressHydrationWarning
      className={`${spaceGrotesk.variable} ${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className='min-h-full flex flex-col bg-background text-foreground'>
        <Providers>
          <ThemeProvider
            attribute='class'
            defaultTheme='system'
            enableSystem
            disableTransitionOnChange
          >
            <GoogleTranslateProvider />
            {children}
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  )
}
