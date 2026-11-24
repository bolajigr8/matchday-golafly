import { NextRequest } from 'next/server';

const ALLOWED_HOSTS = new Set(['cdn.footballticketnet.com']);
const MAX_BYTES = 3_000_000;

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get('url') ?? '';

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return new Response('Invalid url', { status: 400 });
  }

  if (
    url.protocol !== 'https:' ||
    !ALLOWED_HOSTS.has(url.hostname) ||
    !url.pathname.startsWith('/seating-plans/') ||
    !url.pathname.endsWith('.svg')
  ) {
    return new Response('Url not allowed', { status: 400 });
  }

  const upstream = await fetch(url, { next: { revalidate: 86_400 } });
  if (!upstream.ok) return new Response('Upstream error', { status: 502 });

  const text = await upstream.text();
  if (text.length > MAX_BYTES) return new Response('Too large', { status: 413 });

  return new Response(text, {
    headers: {
      'content-type': 'image/svg+xml; charset=utf-8',
      'cache-control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800',
      'x-content-type-options': 'nosniff',
      // if someone opens this URL directly, nothing in the SVG can execute
      'content-security-policy': "default-src 'none'; style-src 'unsafe-inline'",
    },
  });
}
