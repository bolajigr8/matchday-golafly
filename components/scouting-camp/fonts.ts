import localFont from 'next/font/local'

/* The landing page's own type, as in the client's design: Space Grotesk for
   everything, IBM Plex Mono for small labels. Exposed as CSS variables that
   scouting-camp.css reads (--sc-grotesk / --sc-plex).

   Bundled locally from app/fonts so builds never depend on Google Fonts. */
const grotesk = localFont({
  src: '../../app/fonts/space-grotesk-latin-wght-normal.woff2',
  weight: '300 700',
  variable: '--sc-grotesk',
  display: 'swap',
})

const plex = localFont({
  src: [
    {
      path: '../../app/fonts/ibm-plex-mono-latin-400-normal.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../app/fonts/ibm-plex-mono-latin-500-normal.woff2',
      weight: '500',
      style: 'normal',
    },
  ],
  variable: '--sc-plex',
  display: 'swap',
})

export const campFontClass = `${grotesk.variable} ${plex.variable}`
