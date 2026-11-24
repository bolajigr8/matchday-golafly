import type { MetadataRoute } from 'next'

// Web app manifest ("add to home screen"): the Golafly Matchday ticket on
// an ink plate, same artwork as app/icon.png.
//
// The maskable icons are the same artwork padded into Android's safe zone on
// the ink colour, so Android can crop them to a circle or squircle without
// cutting the ticket. Keep "any" and "maskable" as separate entries: a single
// "any maskable" icon is cropped badly on one or the other.
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'Golafly Matchday',
    short_name: 'Matchday',
    description: 'Tickets · Hotel · Flights — book your complete matchday in one place.',
    lang: 'en',
    dir: 'ltr',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#fafaf7',
    theme_color: '#050606',
    categories: ['sports', 'travel', 'shopping'],
    icons: [
      { src: '/brand/golafly-matchday-icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/brand/golafly-matchday-icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/brand/golafly-matchday-maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
      { src: '/brand/golafly-matchday-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    // Long-press the home-screen icon. /fan/dashboard sends a signed-out
    // visitor to the login page.
    shortcuts: [
      { name: 'Matches', url: '/matches', icons: [{ src: '/brand/golafly-matchday-icon-192.png', sizes: '192x192' }] },
      { name: 'Competitions', url: '/tournaments', icons: [{ src: '/brand/golafly-matchday-icon-192.png', sizes: '192x192' }] },
      { name: 'My tickets', url: '/fan/dashboard', icons: [{ src: '/brand/golafly-matchday-icon-192.png', sizes: '192x192' }] },
    ],
  }
}
