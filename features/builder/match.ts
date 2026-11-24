/* ─── Builder match resolution ─────────────────────────────────────
   The matchday builder (Seats → Extras → Checkout → Confirmed) is
   entered from several surfaces that use different match datasets:
     • store/matchday.ts  MATCHES        (ids "1".."6")  — home + /match/[id]
     • store/matches.ts   WC_MATCHES     (ids "wc*")     — /matches World Cup
     • store/matches.ts   CLUB_MATCHES   (ids "cl*")     — /matches club fixtures
   This resolver takes an id from the `?match=` param (or sessionStorage)
   and returns one normalized shape the builder steps can rely on —
   mirroring golafly builder.html's getInitialMatch() fallback.

   When NEXT_PUBLIC_MATCHDAY_TICKETS_LIVE=true (features/matchday/config),
   none of this file is used for match resolution — every id is a real
   MatchDay event_id and gets mapped via fromLiveEvent() instead (see
   features/builder/use-builder-match.ts, which is where the two paths
   actually branch). This file stays purely mock-only and unchanged. */
import { MATCHES } from "@/store/matchday";
import { WC_MATCHES, CLUB_MATCHES } from "@/store/matches";
import { priceToNumber } from "@/features/cart/context";
import { formatEventDateTime } from "@/features/matchday/format";
import type { MatchdayEvent } from "@/features/matchday/types";
import { eventFromPrice } from '@/features/price-breakdown/helpers'

export interface BuilderMatch {
  id: string;
  home: string;
  away: string;
  /** Human-readable display string (e.g. "3 Apr 2027, 15:00" for a live
   *  event, or "Jun 11, 2026" for mock data). For DISPLAY ONLY — never
   *  re-parse this with `new Date(...)`. `Intl.DateTimeFormat` output is
   *  locale-formatted text, not a machine-readable date, and re-parsing it
   *  is exactly the bug this file used to have: a live fixture's real date
   *  of 3 Apr 2027 was silently turning into "2 Apr 2026" downstream
   *  (lib/match-destinations.ts) because some browsers/engines don't
   *  parse "3 Apr 2027, 15:00" back into the date it displays. Use
   *  `dateISO` below for anything that needs to compute with the date. */
  date: string;
  /** Raw ISO-8601 date/time straight from the API (e.g.
   *  "2027-04-03T15:00:00"), untouched by any display formatting — safe to
   *  pass to `new Date(...)`. Only set for live events (fromLiveEvent);
   *  undefined for mock data, where `date` itself is already the only
   *  value available and callers should fall back to it. */
  dateISO?: string;
  venue: string;
  /**
   * The "from" price shown on the match card and CTA button.
   *
   * NULLABLE — MatchDay Update doc: min_price.price can be null when the
   * fixture's currency cannot be converted. fromLiveEvent() maps null to
   * null here so callers must guard before rendering (e.g.
   * app/match/[id]/client.tsx's price display). Mock paths always produce
   * a number.
   */
  priceFrom: number | null;
  kickoff?: string;
  image?: string;
  /** Real tournament/competition name — only ever set for a live event
   *  (fromLiveEvent, from event.tour.name). The mock arrays carry their
   *  own separate `league` field on the raw Match record instead (see
   *  app/match/[id]/client.tsx's mockExtra), so this stays undefined on
   *  the mock path rather than duplicating that. */
  competition?: string;
  /** City extracted from the real venue data — only set for live events. */
  venueCity?: string;
  /** Country name from the real venue data — only set for live events. */
  venueCountry?: string;
  /** Venue capacity as the API returns it (a string, or null) — only set
   *  for live events. Used by the match detail page's real Stadium
   *  section; left undefined on the mock path rather than guessed. */
  venueCapacity?: string | null;
  /** The venue's own photo specifically (not the team-image fallback
   *  chain `image` above uses) — only set for live events, and only when
   *  the API actually has one. */
  venueImage?: string | null;
  /**
   * The currency code the priceFrom is expressed in.
   * Only set for live events (from min_price.currency_code).
   * Undefined on the mock path — callers may fall back to "EUR" for
   * display on mock data only; real data must always read this field.
   */
  priceCurrency?: string;
}

function fromMatch(m: (typeof MATCHES)[number]): BuilderMatch {
  return {
    id: m.id,
    home: m.team1,
    away: m.team2,
    date: m.date,
    venue: m.venue,
    priceFrom: priceToNumber(m.price),
    image: m.image || undefined,
  };
}

function fromWc(m: (typeof WC_MATCHES)[number]): BuilderMatch {
  return {
    id: m.id,
    home: m.home,
    away: m.away,
    date: m.date,
    venue: m.venue,
    priceFrom: m.priceFrom,
    kickoff: m.kickoff,
    image: m.banner,
  };
}

function fromClub(m: (typeof CLUB_MATCHES)[number]): BuilderMatch {
  return {
    id: m.id,
    home: m.home,
    away: m.away,
    date: m.date,
    venue: m.venue,
    priceFrom: m.priceFrom ?? 0,
    image: m.img,
  };
}

/** Maps a real GET /events result onto the same BuilderMatch shape the
 *  whole builder already renders — see features/builder/use-builder-match.ts.
 *  `image` prefers the venue's photo, falling back to either team's crest;
 *  the API has no equivalent of the demo data's hero photography, so a
 *  generic placeholder is used further upstream when none of these exist.
 *
 *  FIX: venue is now "Venue Name, City" (comma-separated) so that
 *  getMatchTripDefaults/resolveMatchDestination in lib/match-destinations.ts
 *  can extract the city and auto-fill flight/hotel/eSIM searches. Without
 *  the city suffix, extractCityFromVenue() returns null → "couldn't
 *  auto-fill a destination for this match" warning in extras/client.tsx.
 *
 *  priceFrom is null when event.min_price.price is null (fixture whose
 *  currency cannot be converted). Callers must guard before display. */
export function fromLiveEvent(event: MatchdayEvent): BuilderMatch {
  const venueFull = event.venue.venue_city_name
    ? `${event.venue.venue_name}, ${event.venue.venue_city_name}`
    : event.venue.venue_name;
  return {
    id: String(event.id),
    home: event.team1.name,
    away: event.team2.name,
    date: formatEventDateTime(event.date),
    // Bug fix: previously only the display-formatted date above was kept,
    // and lib/match-destinations.ts was fed THAT string and tried to
    // `new Date()` it again to compute flight/hotel default dates. A
    // formatted string like "3 Apr 2027, 15:00" is not guaranteed to
    // parse back into the same date — this is what caused the flight
    // departure default to silently show the wrong year for live
    // fixtures. `dateISO` carries the original, untouched ISO string so
    // any date arithmetic downstream is done on real, reliable data.
    dateISO: event.date ?? undefined,
    venue: venueFull,
    // min_price.price is nullable since the MatchDay Update doc.
    priceFrom: eventFromPrice(event.min_price),
    priceCurrency: event.min_price.currency_code,
    image: event.venue.venue_image || event.team1.image || event.team2.image || undefined,
    competition: event.tour.name,
    venueCity: event.venue.venue_city_name || undefined,
    venueCountry: event.venue.venue_country_name || undefined,
    venueCapacity: event.venue.capacity,
    venueImage: event.venue.venue_image,
  };
}

/** The default match opened when the builder is entered without an id. */
export const DEFAULT_BUILDER_MATCH: BuilderMatch = fromMatch(MATCHES[0]);

/** Resolve a match id (from any dataset) to a normalized BuilderMatch.
 *  Mock-only — see the file header for the live counterpart. */
export function resolveBuilderMatch(id: string | null | undefined): BuilderMatch {
  if (!id) return DEFAULT_BUILDER_MATCH;

  const match = MATCHES.find(m => m.id === id);
  if (match) return fromMatch(match);

  const wc = WC_MATCHES.find(m => m.id === id);
  if (wc) return fromWc(wc);

  const club = CLUB_MATCHES.find(m => m.id === id);
  if (club) return fromClub(club);

  return DEFAULT_BUILDER_MATCH;
}
