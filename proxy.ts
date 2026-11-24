import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import {
  isLandingOwnPath,
  mainOriginForHost,
  siteKeyFromHost,
} from '@/lib/sites'
import {
  FAN_HOME,
  PLAYER_HOME,
  PLAYER_ROLES,
  SCOUTING_ROLES,
  homeForRole,
  normaliseRole,
} from '@/features/scout/roles'

/* Next 16 renamed Middleware to Proxy; the file convention is proxy.ts at the
 * project root with a named `proxy` export.
 *
 * This is an OPTIMISTIC check only — it tests that a session cookie exists, not
 * that it is valid. The docs are explicit that Proxy is not a session
 * management or authorization solution, and it cannot be: the token is only
 * verifiable by the Golafly API. Its job is to stop an unauthenticated visitor
 * seeing the dashboard shell flash before a client-side redirect. Real
 * enforcement is the API rejecting the request with a 401, which the axios
 * interceptors turn into a cleared session.
 *
 * TWO independent SESSIONS. The admin and the public side are different
 * audiences with different cookies and different login pages, and they must
 * not share either: an admin token must never open the fan dashboard, and
 * signing out of one must not sign the other out of the same browser.
 *
 * THREE guarded prefixes, though. /dashboard and /scout are the same session —
 * one /login serves every non-admin role, and the role on the account decides
 * which of the two it lands on. So the scout guard tests the same cookie and
 * additionally reads the role out of the user cookie.
 *
 * Reading a role from a cookie is NOT authorization, and nothing here pretends
 * otherwise: the cookie is client-writable, so a determined visitor can put
 * `"role":"scout"` in it and reach the shell. What stops them is the API,
 * which scopes every scouting response to the bearer token and 401s otherwise.
 * The check exists so an ordinary fan who follows a link to /scout gets an
 * explanation instead of a dashboard full of failed requests.
 */

/* Must stay byte-identical to the constants in features/admin/session.ts and
 * features/fan/session.ts, and must contain no character that
 * encodeURIComponent escapes — js-cookie encodes the name on write, Next's
 * cookie API does not on read, so a `:` here silently breaks every
 * authenticated request. Duplicated rather than imported because proxy.ts runs
 * in the edge runtime and importing either session module would drag js-cookie
 * in with it. */
const ADMIN_TOKEN_COOKIE = 'golafly_admin_token'
const FAN_TOKEN_COOKIE = 'golafly_fan_token'
const FAN_USER_COOKIE = 'golafly_fan_user'

/* SCOUTING_ROLES is imported rather than redeclared. The cookie names above
 * must stay duplicated — importing the session modules would drag js-cookie
 * into the edge runtime — but features/scout/roles.ts has no imports at all,
 * so the role list can be shared. One list, so the guard and the client can
 * never disagree about who is a scout. */

interface Guard {
  /** Path prefix this guard owns. */
  prefix: string
  cookie: string
  login: string
  /** Where a signed-in visitor gets sent if they open the login page. */
  home: string
  /** When set, the session's role must be one of these to pass. */
  roles?: readonly string[]
  /** Where a signed-in visitor of the WRONG role is sent instead. */
  wrongRole?: string
}

const GUARDS: Guard[] = [
  {
    prefix: '/admin',
    cookie: ADMIN_TOKEN_COOKIE,
    login: '/admin/login',
    home: '/admin/dashboard',
  },
  /* /scout before /dashboard is not significant — the prefixes do not overlap
     — but /scout carries the extra role test, so it is listed first to keep
     the stricter guard visible. */
  {
    prefix: '/scout',
    cookie: FAN_TOKEN_COOKIE,
    login: '/login',
    home: '/scout/dashboard',
    roles: SCOUTING_ROLES as readonly string[],
    wrongRole: FAN_HOME,
  },
  /* Players get their own dashboard, on the same session cookie as fans and
     scouts. A player-role check like /scout's. */
  {
    prefix: '/player',
    cookie: FAN_TOKEN_COOKIE,
    login: '/login',
    home: PLAYER_HOME,
    roles: PLAYER_ROLES as readonly string[],
    wrongRole: FAN_HOME,
  },
  {
    prefix: '/fan',
    cookie: FAN_TOKEN_COOKIE,
    login: '/login',
    home: FAN_HOME,
  },
]

/* The role off the user cookie, or null if it is absent or unreadable.
 *
 * features/fan/session.ts writes this with js-cookie, which percent-encodes
 * the VALUE on write; Next's cookie API does not decode on read, so the JSON
 * arrives escaped and has to be run through decodeURIComponent first. The
 * token cookie never hits this because its value is URL-safe already — which
 * is exactly why the bug would have shown up only on the role check. */
function roleFromCookie(raw: string | undefined): string | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(decodeURIComponent(raw)) as { role?: unknown }
    return normaliseRole(parsed.role)
  } catch {
    /* A corrupt cookie is the same as no cookie: let them through to the app,
       where the API is the real authority. Bouncing on unparseable JSON would
       lock a scout out of their own dashboard over a cookie we mangled. */
    return null
  }
}

/* Email verification: the session cookie says `email_verified: false` for an
   account that has not entered its emailed code yet. Only an explicit false
   counts; older cookies without the field pass (the API still gates them). */
function unverifiedFromCookie(raw: string | undefined): boolean {
  if (!raw) return false
  try {
    const parsed = JSON.parse(decodeURIComponent(raw)) as { email_verified?: unknown }
    return parsed.email_verified === false
  } catch {
    return false
  }
}

/* The fan's login and register pages sit OUTSIDE /dashboard, so they need
   their own entry in the matcher. Visiting them with a live session should
   land on the dashboard rather than showing a form the fan does not need. */
const FAN_AUTH_ROUTES = ['/login', '/register']

/* Paths the ORIGINAL matcher covered. On the main site (golafly.com) nothing
 * outside these is touched, so every other page behaves exactly as before the
 * landing sites were added: the matcher below is wider only so landing
 * hostnames can be seen. */
const MAIN_SITE_PATHS = /^\/(admin|scout|fan|player)(\/|$)|^\/(login|register)$/

/* LANDING SITES (lib/sites.ts) — championsleague.golafly.com and friends.
 *
 *  /                       → rewritten to /lp/<key>; the address bar keeps "/"
 *  /builder/*, /payment-*,
 *  /cart                   → served as they are: the whole booking stays on the
 *                            landing hostname, so the cart and the checkout
 *                            state (both stored per-origin in the browser)
 *                            are not lost halfway
 *  /lp/*                   → not reachable directly; back to "/"
 *  anything else           → the same path on the main site (About, Blog,
 *                            Legal, login …): a landing page is not a mirror
 *                            of the whole website
 */
function landingSite(request: NextRequest, key: string) {
  const { pathname, search } = request.nextUrl
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host')

  if (pathname === '/lp' || pathname.startsWith('/lp/')) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    url.search = ''
    return NextResponse.redirect(url)
  }

  if (pathname === '/') {
    const url = request.nextUrl.clone()
    url.pathname = `/lp/${key}`
    return NextResponse.rewrite(url)
  }

  if (isLandingOwnPath(pathname)) return NextResponse.next()

  return NextResponse.redirect(
    new URL(`${pathname}${search}`, mainOriginForHost(host)),
  )
}

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl

  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host')
  const landingKey = siteKeyFromHost(host)
  if (landingKey) return landingSite(request, landingKey)

  /* Main site. The landing route only exists behind a landing hostname. */
  if (pathname === '/lp' || pathname.startsWith('/lp/')) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    url.search = ''
    return NextResponse.redirect(url)
  }
  if (!MAIN_SITE_PATHS.test(pathname)) return NextResponse.next()

  /* Signed in and opening /login or /register → straight to their dashboard.
     WHICH dashboard is the role's call, not the route's: one login serves
     every non-admin role, so a scout who revisits /login must land on /scout,
     not on the fan dashboard they have no reason to see.

     Forgot/reset are deliberately NOT here: someone with a live session may
     still legitimately want to change their password from an emailed link. */
  if (FAN_AUTH_ROUTES.includes(pathname)) {
    if (request.cookies.get(FAN_TOKEN_COOKIE)?.value) {
      const role = roleFromCookie(request.cookies.get(FAN_USER_COOKIE)?.value)
      const url = request.nextUrl.clone()
      url.pathname = homeForRole(role)
      url.search = ''
      return NextResponse.redirect(url)
    }
    return NextResponse.next()
  }

  const guard = GUARDS.find(
    /* Segment match, so '/player' does not also guard '/players'. */
    (g) => pathname === g.prefix || pathname.startsWith(g.prefix + '/'),
  )
  if (!guard) return NextResponse.next()

  const hasSession = Boolean(request.cookies.get(guard.cookie)?.value)
  const isLoginRoute = pathname === guard.login

  if (!hasSession && !isLoginRoute) {
    const url = request.nextUrl.clone()
    url.pathname = guard.login
    /* Carry where they were headed so login can send them back. The login
       page only honours same-origin paths — see features/fan/hooks.ts. */
    url.search = `?next=${encodeURIComponent(pathname + search)}`
    return NextResponse.redirect(url)
  }

  if (hasSession && isLoginRoute) {
    const url = request.nextUrl.clone()
    url.pathname = guard.home
    url.search = ''
    return NextResponse.redirect(url)
  }

  /* Signed in but the email is not verified yet: every account API answers
     403 until it is, so send them to enter the code (fans, scouts, players;
     the admin has its own session). Booking pages are not guarded here. */
  if (
    hasSession &&
    guard.cookie === FAN_TOKEN_COOKIE &&
    unverifiedFromCookie(request.cookies.get(FAN_USER_COOKIE)?.value)
  ) {
    const url = request.nextUrl.clone()
    url.pathname = '/verify-email'
    url.search = `?next=${encodeURIComponent(pathname + search)}`
    return NextResponse.redirect(url)
  }

  /* Signed in, but is this prefix for them? Only /scout asks.
   *
   * A null role passes. The role is optional on the API's user object, and an
   * older session cookie predating this guard has no role field at all —
   * bouncing those would sign every existing scout out of a dashboard they
   * had been using, to fix a check that the API already enforces properly. */
  if (hasSession && guard.roles) {
    const role = roleFromCookie(request.cookies.get(FAN_USER_COOKIE)?.value)
    if (role && !guard.roles.includes(role)) {
      const url = request.nextUrl.clone()
      /* Their OWN dashboard, not always the fan's: a player who opens a
         /scout link belongs on /player/dashboard. */
      url.pathname = homeForRole(role)
      /* `denied` lets the destination explain what happened rather than
         silently landing them somewhere they did not ask for. */
      url.search = `?denied=${encodeURIComponent(guard.prefix)}`
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.next()
}

export const config = {
  /* Every page, so a landing hostname can be recognised. The pages that used
     to be listed here (admin, scout, fan, player, login, register) are still
     the only ones the main site's logic acts on: see MAIN_SITE_PATHS.
     Excluded: /api, Next's own assets and anything with a file extension
     (images, fonts, robots.txt, sitemap.xml). */
  matcher: ['/((?!api|_next/static|_next/image|.*\\..*).*)'],
}
