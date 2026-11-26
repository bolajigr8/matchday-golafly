// lib/brevo/matchday.ts
//
// Match details for the Brevo email journey: a ticket order only knows the
// event id, teams and date, so the stadium, city, kick-off time and the
// contact's MATCH_DATE come from the event itself (server side).

import type { SyncOrderPayload } from '@/lib/brevo/types'
import { getServerEvent } from '@/lib/matchday-server'
import { kickoffUtc } from '@/lib/email/timezones'
import { cityGuide } from '@/lib/brevo/city-guides'
import { matchPath } from '@/lib/slug'

/** The contact date attribute the "days before the match" automations read
 *  (created in Brevo as a Date attribute). */
export const MATCH_DATE_ATTR = process.env.BREVO_ATTR_MATCH_DATE || 'MATCH_DATE'

/** Text contact attributes for the "days before the match" emails: those
 *  automations start from the contact's MATCH_DATE, so the email can only
 *  read the contact, not the booking event. Each must exist in Brevo
 *  (Contacts > Settings > Contact attributes, type Text). */
export const MATCH_TEXT_ATTRS = {
  MATCH_NAME: 'match',
  MATCH_HOME_TEAM: 'home_team',
  MATCH_AWAY_TEAM: 'away_team',
  MATCH_STADIUM: 'stadium',
  MATCH_CITY: 'city',
  MATCH_KICKOFF: 'kickoff_time',
  MATCH_DATE_TEXT: 'match_date_text',
  MATCH_BOOKING_REF: 'booking_reference',
} as const

/** Added 19 Nov 2026 for the redesigned emails (countdown, city guide). Kept
 *  apart from the attributes above: if Brevo doesn't know one of these yet,
 *  the contact is saved with the older match attributes instead of none
 *  (app/api/brevo/sync-order/route.ts). Each must exist in Brevo, type Text. */
export const MATCH_EXTRA_ATTRS = {
  MATCH_KICKOFF_UTC: 'kickoff_utc',
  MATCH_CITY_PHOTO: 'city_photo_url',
  MATCH_TIP_SEE: 'city_tip_see',
  MATCH_TIP_BITE: 'city_tip_bite',
  MATCH_TIP_ROUTE: 'city_tip_route',
} as const

/** The contact attributes of the current match (date + texts) for a
 *  paid/confirmed booking with a real date; {} otherwise. */
export function matchContactAttributes(
  body: SyncOrderPayload,
  matchDay: string | null,
): Record<string, string> {
  if (body.product !== 'matchday' || !matchDay || !JOURNEY_STATUSES.has(body.status)) return {}
  const out: Record<string, string> = { [MATCH_DATE_ATTR]: matchDay }
  for (const [attr, key] of Object.entries({ ...MATCH_TEXT_ATTRS, ...MATCH_EXTRA_ATTRS })) {
    const v = body.meta?.[key]
    /* Always written (blank when unknown) so an older match's value is
       never left behind on the contact. */
    out[attr] = v === undefined || v === null ? '' : String(v)
  }
  return out
}

/** Statuses that start (or keep) the match email journey. */
export const JOURNEY_STATUSES = new Set<SyncOrderPayload['status']>(['paid', 'confirmed'])

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://golafly.com').replace(/\/$/, '')

/** "2027-03-06T21:00:00" → { day: "2027-03-06", time: "21:00" }. The API's
 *  kick-off is the stadium's local time, so it is read as written. */
export function splitLocal(iso: unknown): { day: string; time: string } | null {
  if (typeof iso !== 'string') return null
  const m = iso.match(/^(\d{4}-\d{2}-\d{2})(?:[T ](\d{2}:\d{2}))?/)
  return m ? { day: m[1], time: m[2] ?? '' } : null
}

/** "Saturday 6 March 2027" for a YYYY-MM-DD day. */
export function longDay(day: string): string {
  const d = new Date(`${day}T12:00:00Z`)
  return Number.isNaN(d.getTime())
    ? day
    : d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
}

/** Ticket orders: add what the match emails need (stadium, city, kick-off …)
 *  from the event itself, so the email journey never depends on what the
 *  browser happened to know. Never throws. */
export async function matchdayDetails(body: SyncOrderPayload): Promise<{
  meta: Record<string, string | number | boolean>
  matchDay: string | null
}> {
  const meta: Record<string, string | number | boolean> = {}
  let local = splitLocal(body.meta?.match_date)
  let localIso: unknown = body.meta?.match_date
  let country: unknown
  let city: unknown
  let homeId: number | undefined
  let awayId: number | undefined
  const id = Number(body.meta?.event_id)
  if (Number.isFinite(id) && id > 0) {
    try {
      const res = await getServerEvent(id)
      if (res.status === 'found') {
        const ev = res.event
        if (ev.venue?.venue_name) meta.stadium = ev.venue.venue_name
        if (ev.venue?.venue_city_name) meta.city = ev.venue.venue_city_name
        if (ev.venue?.venue_country_name) meta.country = ev.venue.venue_country_name
        if (ev.tour?.name) meta.competition = ev.tour.name
        if (ev.team1?.name && !body.meta?.home_team) meta.home_team = ev.team1.name
        if (ev.team2?.name && !body.meta?.away_team) meta.away_team = ev.team2.name
        meta.fixture_status = ev.postponed ? 'postponed' : ev.date ? 'scheduled' : 'date to be confirmed'
        local = ev.postponed ? null : (splitLocal(ev.date) ?? local)
        localIso = ev.postponed ? null : (ev.date ?? localIso)
        country = ev.venue?.venue_country_name
        city = ev.venue?.venue_city_name
        homeId = ev.team1?.id
        awayId = ev.team2?.id
        /* Link back to the match page (abandoned-checkout reminder, and any
           email that wants a "see the match" button). */
        meta.match_url = `${SITE_URL}${matchPath(ev)}`
      }
    } catch {
      /* the match API is down: send what we have */
    }
  }
  if (local) {
    meta.match_day = local.day
    meta.match_date_text = longDay(local.day)
    if (local.time) meta.kickoff_time = local.time
  }
  meta.tickets_url = `${SITE_URL}/fan/tickets`
  meta.site_url = SITE_URL

  /* Redesigned emails (19 Nov 2026). Booking email: club crests + the live
     countdown are images served by golafly.com (app/api/email/*), so the
     template only drops these links into <img src>. The team id gives the
     club's real crest; without it the link still shows the initials badge. */
  const utc = local?.time ? kickoffUtc(localIso, country, city) : null
  if (utc) meta.kickoff_utc = utc
  meta.countdown_url = `${SITE_URL}/api/email/countdown?kickoff=${encodeURIComponent(utc ?? '')}`
  const home = (meta.home_team ?? body.meta?.home_team) as string | undefined
  const away = (meta.away_team ?? body.meta?.away_team) as string | undefined
  const crestUrl = (id: number | undefined, name: string) =>
    `${SITE_URL}/api/email/crest?${id ? `id=${id}&` : ''}team=${encodeURIComponent(name)}`
  if (home) meta.home_crest_url = crestUrl(homeId, home)
  if (away) meta.away_crest_url = crestUrl(awayId, away)
  /* "Discover your matchday city" (14 days before): photo + three tips. */
  const guide = cityGuide(meta.city as string | undefined, meta.stadium as string | undefined)
  meta.city_photo_url = guide.photo
  meta.city_tip_see = guide.see
  meta.city_tip_bite = guide.bite
  meta.city_tip_route = guide.route
  return { meta, matchDay: local?.day ?? null }
}
