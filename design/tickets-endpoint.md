# Match tickets — the API the Overview needs

**For:** whoever owns `api.golafly.com`.
**Why:** the admin Overview now reports three revenue streams. Two of them already
have endpoints. Match tickets has none, so its panels render em-dashes.

## Where things stand

| Stream | Endpoint | Status |
|---|---|---|
| Camps & programs | `GET /v1/transactions` | ✅ exists. Flat array, unpaginated, every row carries `amount`, `currency`, `payment_status`, `product_type`, `created_at`. The dashboard buckets by period client-side — **no new endpoint needed.** |
| Travel products | `GET /v1/overview` | ✅ exists, and is the model for everything below: `summary.{today,this_week,this_month,all_time}`, `by_type`, `weekly_chart[]`, `product_breakdown`. |
| Match tickets | — | ❌ nothing. `features/tickets/api.ts` returns a mock; `store/matchday.ts` is static seed data. |

Three additions close the gap. They are deliberately shaped to mirror
`/v1/overview` field-for-field, so the frontend needs no new patterns — see
`services/travel-admin.ts`, which the ticket service would be a copy of.

**Convention, throughout:** money in **minor units**, in a field named `*_minor`.
`lib/money.ts` already enforces this and the UI never renders a raw amount. The one
exception `/v1/overview` makes — a pre-formatted major-unit `amount` string
alongside the minor field — is worth keeping for consistency, but the minor field is
the authoritative one.

---

## 1. `GET /v1/tickets/overview`

Feeds the Match tickets card in band 2 of the Overview, and the ticket band of the
stacked revenue chart. Identical envelope to `/v1/overview`.

```jsonc
{
  "data": {
    "currency": "EUR",
    "summary": {
      "today":      { "count": 21,  "amount_minor": 742000,   "amount": "7420.00" },
      "this_week":  { "count": 143, "amount_minor": 4980000,  "amount": "49800.00" },
      "this_month": { "count": 612, "amount_minor": 19640000, "amount": "196400.00" },
      "all_time":   { "count": 4187, "amount_minor": 131900000, "amount": "1319000.00" }
    },
    // The three ticket products. Sub-rows of the Match tickets card.
    "by_type": {
      "ticket":      { "count": 487, "amount_minor": 15490000, "amount": "154900.00" },
      "tour":        { "count": 98,  "amount_minor": 2870000,  "amount": "28700.00" },
      "hospitality": { "count": 27,  "amount_minor": 1280000,  "amount": "12800.00" }
    },
    // Eight most recent complete weeks, oldest first. Drives the ticket band of
    // the stacked chart and the card's sparkline. Same shape as
    // /v1/overview's weekly_chart, so one renderer serves both.
    "weekly_chart": [
      { "label": "23 Jun", "date": "2026-06-23", "count": 61, "amount_minor": 1800000, "amount": "18000.00" }
      // … 7 more
    ],
    "product_breakdown": {
      "by_count":  [{ "product": "ticket", "label": "Match tickets", "count": 487, "percentage": 79.6 }],
      "by_amount": [{ "product": "ticket", "label": "Match tickets", "amount_minor": 15490000, "amount": "154900.00", "percentage": 78.9 }]
    }
  }
}
```

**Period semantics must match `/v1/overview` exactly** — same timezone, same week
start, same "is today inclusive" rule. The Overview adds the three streams into one
`Gross revenue` figure, so if the two endpoints disagree about where a week begins,
that headline number is quietly wrong and nothing on the page reveals it.

## 2. `GET /v1/tickets/fixtures`

Feeds the **Next fixtures** band on the Overview and the whole Tickets page. This is
the one that cannot be derived from order rows: it describes seats **nobody has
bought yet**, and a ledger has no row for those.

```jsonc
{
  "data": [
    {
      "fixture_id": 118,
      "home": "Bayern Munich",
      "away": "PSG",
      "competition": "UCL",
      "venue": "Allianz Arena",
      "city": "Munich",
      "kickoff_at": "2026-09-02T21:00:00+02:00", // absolute + offset; the UI derives "in 16d"
      "allocation": 250,                          // seats we hold
      "sold": 118,
      "unsold": 132,
      "revenue_minor": 7320000,
      "currency": "EUR",
      "seller_split": { "verified": 80, "partner": 38 },
      "confirmed_with_seller": false,             // drives the attention queue
      "fulfilment": { "issued": 76, "pending": 42, "not_issued": 0 },
      "status": "on_sale",                        // on_sale | sold_out | closed | draft
      "by_category": [
        { "category": "Cat 1 Premium", "allocation": 22, "sold": 18 },
        { "category": "Cat 1",         "allocation": 56, "sold": 34 },
        { "category": "Cat 2",         "allocation": 90, "sold": 40 },
        { "category": "Cat 3",         "allocation": 82, "sold": 26 }
      ]
    }
  ]
}
```

Notes on fields that exist for a specific reason:

- **`kickoff_at` absolute with offset**, never a pre-computed "in 16 days". The
  relative string goes stale the moment it is cached, and kickoff is the deadline
  the whole page is organised around.
- **`unsold` sent explicitly** even though it is `allocation - sold`. It is the
  number the page is actually about, and sending it means server and client can
  never disagree about it.
- **`confirmed_with_seller`** is what puts "4 ticket allocations unconfirmed,
  kickoff in < 7 days" in the attention queue. Without it that row cannot exist.
- **`fulfilment` as three counts**, not a single status string. A fixture is
  routinely part-issued, and "42 paid but not issued" is the actionable state.
- **`seller_split`** distinguishes our own verified inventory from official-partner
  listings. Margin and fulfilment risk differ between them.

Query params, matching the page's filters: `?status=on_sale`,
`?competition=UCL`, `?kickoff_within=7d`.

## 2b. The same on `GET /v1/auth/ledgers` — for the fan dashboard

`/v1/auth/ledgers` is the fan-facing sibling of the admin ledgers endpoint: the
same records, scoped to the caller instead of the whole business. It already
serves `flight`, `esim` and `stays`, and the fan dashboard's **Travel** page runs
off it today.

The fan's **Tickets** page needs exactly one thing: **`ledger_type: "ticket"`
included in that same response**, with the summary shape from section 3 below.
No new endpoint, no new auth, no new pagination.

Until then `app/dashboard/tickets/client.tsx` renders an awaiting-endpoint state
that names this contract, and Home shows the same in place of its next-match
hero. Neither shows an empty list — a fan who has just paid for four tickets
being told they have none is a false and alarming claim, and it is the one that
generates support contacts.

**This is the same addition as section 3, on a second endpoint.** Two consumers,
one contract: the admin needs it to report ticket revenue, the fan needs it to
find their seat. Shipping it on only one of the two leaves the other blind.

## 3. `ledger_type: "ticket"` on the existing ledgers endpoint

**This is the cheap one, and the most valuable.** `GET /v1/overview/ledgers` already
serves flights, eSIMs and stays with `?type=`. Adding tickets as a fourth
`ledger_type` means the admin's Orders page gets a Tickets tab for free — same
table, same detail sheet, same filters, same pagination. A dedicated
ticket-orders endpoint would have meant duplicating all four and then watching them
drift.

The only new thing is the `summary` variant, which follows the same pattern as
`FlightLedgerSummary` / `EsimLedgerSummary` / `StaysLedgerSummary` in
`services/travel-admin.ts`:

```jsonc
{
  "ledger_id": 90412,
  "ledger_type": "ticket",
  "payment_status": "paid",
  "customer": { "full_name": "Daniel Mwangi", "email": "d.mwangi@example.com", "phone": "+254…" },
  "pricing": { "amount_minor": 70000, "amount_paid_minor": 70000, "currency": "EUR" },
  "summary": {
    "fixture_id": 118,
    "fixture": "Barcelona v Atlético Madrid",
    "competition": "La Liga",
    "kickoff_at": "2026-08-22T20:00:00+02:00",
    "category": "Cat 1",
    "block": "21",
    "row": "6",
    "quantity": 4,
    "seller": "verified",              // verified | partner
    "fulfilment": "issued",            // issued | pending | not_issued
    "ticket_reference": "GFT-4K2D9X"
  },
  "paid_at": "2026-08-14T09:12:44Z",
  "created_at": "2026-08-14T09:11:02Z"
}
```

`ticket_reference` already exists on the frontend side as `TicketOrderResult.ticket_reference`
(`features/tickets/types.ts`) — the mock generates `GFT-XXXXXX`. Keeping that format
means the mock and the real thing are interchangeable.

---

## Priority, if these land one at a time

1. **`ledger_type: "ticket"`** — smallest change, unblocks the Orders tab entirely.
2. **`/v1/tickets/overview`** — turns the Overview's largest revenue stream from
   em-dashes into a number.
3. **`/v1/tickets/fixtures`** — unblocks the Next fixtures band and the Tickets page.

## What the frontend does in the meantime

Nothing is blocked. `features/tickets/api.ts` was written against the same
`{checkout_url, session_id}` contract every real product uses precisely so it could
be swapped without touching callers. On the admin side the ticket panels render
em-dashes behind an `Awaiting endpoint` pill, the stacked chart draws two bands
instead of three, and the fixtures band is hidden rather than shown empty. See the
**Overview — day one** card in the design system.

Em-dashes rather than zeroes is deliberate: `€0` is a claim that nothing sold, which
is a different and much worse statement than "not measured yet" — and it is exactly
the sort of number that ends up quoted in a meeting.
