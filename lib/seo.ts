// lib/seo.ts
//
// One place for the site's canonical host and the noindex setting.
//
// Canonical rules (from the SEO brief, Oct 2026):
//   • every indexable page has exactly one <link rel="canonical"> in the
//     server HTML — set through Next metadata `alternates.canonical`;
//   • absolute URL on https://golafly.com — no www, no http;
//   • no query string (we only ever pass the path, so ?utm_… is dropped);
//   • no trailing slash except the homepage;
//   • each page points to itself;
//   • no canonical on the 404 page — so the ROOT layout must never set one
//     (child pages would inherit it), only individual pages do.
//
// The host is fixed on purpose rather than read from an env var: staging
// or preview copies of the site should still point Google at golafly.com.

import type { Metadata } from 'next'

export const SITE_URL = 'https://golafly.com'

/** `alternates` for a page's own path, e.g. canonical('/matches'). */
export function canonical(path: string): NonNullable<Metadata['alternates']> {
  const clean = path.split(/[?#]/)[0]
  return { canonical: clean === '/' ? '/' : clean.replace(/\/+$/, '') }
}

/** For pages that must not appear in search (login, checkout, dashboards). */
export const NO_INDEX: Metadata['robots'] = { index: false, follow: true }

/** Canonical for a /team/<slug> or /tournament/<slug> page whose catalogue
 *  could not be loaded (API down). Without it the page would ship with NO
 *  canonical — the same gap the brief flagged on match pages. Only a plain,
 *  lower-case, non-numeric slug is trusted; anything else (case/accent
 *  variants, old numeric ids) returns undefined, because a wrong canonical
 *  is worse than none. */
export function canonicalForSlug(
  base: string,
  param: string,
): Metadata['alternates'] | undefined {
  let slug: string
  try {
    slug = decodeURIComponent(param)
  } catch {
    return undefined
  }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || /^\d+$/.test(slug)) return undefined
  return canonical(`${base}/${slug}`)
}
