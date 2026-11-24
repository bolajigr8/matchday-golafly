import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  /* The deploy box does not have the RAM to run Next's built-in type check:
     the build compiles fine and then gets SIGKILLed by the kernel's OOM killer
     during "Running TypeScript". Raising --max-old-space-size makes it worse,
     because V8 then grows past physical memory before collecting.
   *
   * This skips the check entirely — it does not suppress errors, it never runs
   * tsc. So the check has to happen elsewhere: `npm run typecheck` does exactly
   * what the build used to, and must stay part of CI or pre-deploy. Without
   * that, type errors ship silently.
   *
   * Revisit once the server has more memory or swap. */
  typescript: {
    ignoreBuildErrors: true,
  },

  /* Each account type has its own prefix: /fan, /player, /scout. The fan
     dashboard used to live at /dashboard, and those links are already out in
     booking-confirmation emails, so they keep working. Temporary (307), not
     permanent: a cached 308 cannot be taken back if a route moves again.
     First match wins, so the specific paths come before the catch-all. */
  async redirects() {
    return [
      { source: '/dashboard', destination: '/fan/dashboard', permanent: false },
      {
        source: '/dashboard/travel',
        destination: '/fan/ledgers',
        permanent: false,
      },
      {
        source: '/dashboard/:path+',
        destination: '/fan/:path+',
        permanent: false,
      },
      {
        source: '/player-dashboard',
        destination: '/player/dashboard',
        permanent: false,
      },
      {
        source: '/player-dashboard/:path+',
        destination: '/player/dashboard',
        permanent: false,
      },

      /* ── SEO: one host ─────────────────────────────────────────────
         www.golafly.com → golafly.com, keeping the path. (http → https
         must be done by the server/proxy in front of Next; see the SEO
         notes. Next can't see the original scheme reliably.) */
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.golafly.com' }],
        destination: 'https://golafly.com/:path*',
        permanent: true,
      },

      /* ── SEO: old golafly.com URLs → their new pages ───────────────
         These were in the old site's sitemap and are still in Google's
         index. Permanent (308, treated like a 301 by Google) so their
         ranking moves to the new page instead of being lost to a 404. */
      {
        source: '/trial-showcase',
        destination: '/tourism/trials',
        permanent: true,
      },
      {
        source: '/football-tourism',
        destination: '/program/football-tourism',
        permanent: true,
      },
      {
        source: '/player-management',
        destination: '/program/player-management',
        permanent: true,
      },
      {
        source: '/sports-marketing',
        destination: '/program/sports-marketing',
        permanent: true,
      },
      { source: '/faq', destination: '/help-faqs', permanent: true },
      // Best match — confirm with the SEO lead; change the destination if
      // a closer page exists.
      {
        source: '/matchday-experiences',
        destination: '/matches',
        permanent: true,
      },
      { source: '/iconic-venues', destination: '/matches', permanent: true },
      {
        source: '/stadium-advertising',
        destination: '/program/sports-marketing',
        permanent: true,
      },
      {
        source: '/football-activations',
        destination: '/program/sports-marketing',
        permanent: true,
      },
      {
        source: '/brand-sponsorship',
        destination: '/program/sports-marketing',
        permanent: true,
      },
    ]
  },

  /* ── SEO: keep private areas out of search ────────────────────────
     An X-Robots-Tag header works on every page type, including the
     client-component layouts (admin, scout) that can't export metadata.
     Public auth pages (/login etc.) also carry a <meta name="robots">
     tag from their own metadata (lib/seo.ts NO_INDEX). */
  async headers() {
    const noindex = [{ key: 'X-Robots-Tag', value: 'noindex' }]
    const pwa = [
      /* PWA service worker. It must never be served from a cache, or a
         broken worker could not be replaced; the browser re-checks it on
         every visit. Service-Worker-Allowed lets it control the whole site. */
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/javascript; charset=utf-8',
          },
          { key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' },
          { key: 'Service-Worker-Allowed', value: '/' },
        ],
      },
      /* The offline fallback page: not a page to find through search. */
      { source: '/offline.html', headers: noindex },
    ]
    const privateAreas = [
      '/admin/:path*',
      '/scout/:path*',
      '/fan/:path*',
      '/player/:path*',
      '/builder/:path*',
      '/studio/:path*',
      '/api/:path*',
      '/cart',
      '/login',
      '/register/:path*',
      '/forgot-password',
      '/reset-password',
      '/payment-success',
      '/payment-cancelled',
      '/flights/select',
      '/flights/manage',
      '/scouting-camp/thank-you',
    ].map((source) => ({ source, headers: noindex }))
    return [...pwa, ...privateAreas]
  },

  /* There is deliberately no `eslint` key here, and adding one is an error.
   *
   * Next 16 removed `next lint` and the `eslint` config option with it, and
   * `next build` no longer runs linting at all — so there is nothing left to
   * disable. Setting `eslint: { ignoreDuringBuilds: true }` does not skip
   * anything; it just makes every build print
   *   ⚠ Unrecognized key(s) in object: 'eslint'
   * See node_modules/next/dist/docs/01-app/03-api-reference/05-config/03-eslint.md
   * ("`next lint` removal") and .../upgrading/version-16.md.
   *
   * Linting therefore has to happen elsewhere, same as the type check above:
   * `npm run lint` is the whole check, and it must stay in CI or pre-deploy or
   * lint errors ship silently. */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.sanity.io',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'https',
        hostname: 'localhost',
      },
      {
        protocol: 'https',
        hostname: 'api.golafly.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'cdn.footballticketnet.com',
      },
    ],
  },
}

export default nextConfig
