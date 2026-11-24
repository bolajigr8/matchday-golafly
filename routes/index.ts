export enum QueryParams {
  tab = 'tab',
  program = 'program',
  programSubcategoryId = 'subcategoryId',
  position = 'position',
}

export type ProgramType =
  | 'football-tourism'
  | 'sports-marketing'
  | 'player-management'

export class Routes {
  static home = '/'
  static footballTourism = '/program/football-tourism'
  static playerManagement = '/program/player-management'
  static sportsMarketing = '/program/sports-marketing'
  static trialShowCase = '/tourism/trials'
  static matchdayExperiences = '/program/football-tourism'
  static iconicVenues = '/program/football-tourism'
  static blog = '/blog'

  static about = '/about'
  static legalTerms = '/legal/terms'
  static legalPrivacy = '/legal/privacy'
  static legalRefund = '/legal/refund'

  /* Golafly Internship. Positions come from Sanity; see sanity/internship.ts. */
  static internship = '/internship'
  static internshipApply = '/internship/apply'
  static internshipPosition(slug: string) {
    return `${this.internship}/${slug}`
  }
  static internshipApplyFor(slug: string) {
    return `${this.internshipApply}?${QueryParams.position}=${slug}`
  }

  static applyNow = '/apply-now'

  /* Public product pages the fan dashboard links out to. They already existed
     as folders under app/; they just had no entry here because nothing linked
     to them programmatically before. */
  static matches = '/matches'
  static flights = '/flights'
  static stays = '/stays'
  static travel = '/travel'
  static helpFaqs = '/help-faqs'
  static support = '/support'
  /* eSIM has no standalone page — it is bought as a builder extra. */
  static builderExtras = '/builder/extras'

  /* Fan account + dashboard. A different audience and a different guard from
     the admin below: separate cookie, separate login, separate axios
     instance. Lives at the root because it is part of the public product,
     not a back office. */
  static login = '/login'
  static register = '/register'
  static forgotPassword = '/forgot-password'
  static resetPassword = '/reset-password'
  static verifyEmail = '/verify-email'
  /* Every account type lives under its own prefix — /fan, /player, /scout —
     so the guards in proxy.ts can never overlap. The old /dashboard/* paths
     redirect here (next.config.ts). */
  static fan = '/fan'
  static dashboard = '/fan/dashboard'
  static dashboardTickets = '/fan/tickets'
  static dashboardLedgers = '/fan/ledgers'
  static dashboardSettings = '/fan/settings'

  static dashboardTicket(id: string | number) {
    return `${this.dashboardTickets}/${id}`
  }

  static dashboardLedger(id: string | number) {
    return `${this.dashboardLedgers}/${id}`
  }

  /* Player dashboard — same shell as the fan dashboard, for accounts whose
     role is "player". */
  static player = '/player'
  static playerDashboard = '/player/dashboard'
  static playerProfile = '/player/profile'
  static playerScoutReport = '/player/scout-report'
  static playerSettings = '/player/settings'

  /* Scouting dashboard — GOL-SCOUT-EPIC-01.
   *
   * NO /scout/login. One /login and one /register serve every role; the
   * account's own role decides which dashboard it lands on after auth, and
   * proxy.ts keeps a scout out of /admin. So this list has destinations only.
   *
   * Club representatives land here too, on the same screens as scouts. They
   * do the same work on the same assigned players; what differs is permission,
   * and permission is a filter on one dashboard rather than a reason to build
   * a fourth one. */
  static scout = '/scout'
  static scoutDashboard = '/scout/dashboard'
  static scoutPlayers = '/scout/players'
  static scoutEvaluations = '/scout/evaluations'
  static scoutReports = '/scout/reports'
  static scoutComparisons = '/scout/comparisons'
  static scoutTemplates = '/scout/templates'
  static scoutSettings = '/scout/settings'

  /** A player's profile inside the scouting dashboard. */
  static scoutPlayer(id: string | number) {
    return `${this.scoutPlayers}/${id}`
  }

  /** One evaluation, optionally opened at a given step. */
  static scoutEvaluation(id: string | number, step?: string) {
    const base = `${this.scoutEvaluations}/${id}`
    return step ? `${base}?step=${step}` : base
  }

  /** A published or draft report. */
  static scoutReport(id: string | number) {
    return `${this.scoutReports}/${id}`
  }

  /* Admin dashboard — ported from the Golafly frontend. Lives under /admin so
     it cannot collide with the marketing routes (/program is already taken). */
  static admin = '/admin'
  static adminLogin = '/admin/login'
  static adminDashboard = '/admin/dashboard'
  /* Match-ticket inventory: fixtures, allocations, sell-through. Distinct
     from Orders, which is the ledger of what SOLD — no amount of filtering a
     ledger produces a row for a seat nobody has bought yet. */
  static adminTickets = '/admin/tickets'
  /* Sold matchday ticket orders — distinct from Tickets (inventory still
     unsold) and from Orders (flights, eSIMs, stays). */
  static adminMatchTickets = '/admin/match-tickets'
  /* VIP packages (hospitality): list + one package (Release, held refunds). */
  static adminVipPackages = '/admin/vip-packages'
  static adminVipPackage(id: string) {
    return `/admin/vip-packages/${encodeURIComponent(id)}`
  }
  static adminMatchTicket(orderId: number | string) {
    return `${this.adminMatchTickets}/${orderId}`
  }
  static adminOffers = '/admin/offers'
  static adminPrograms = '/admin/programs'
  /* One program's spots and registered players. */
  static adminProgram(id: number | string) {
    return `/admin/programs/${id}`
  }
  static adminAcademy = '/admin/academy'
  static adminPlayers = '/admin/players'
  /* Scouts and their player assignments. Sits beside Players because it is the
     same register seen from the other end: Players is who registered, Scouts
     is who is evaluating them. */
  static adminScouts = '/admin/scouts'
  /* Internship applications from /internship/apply. */
  static adminInternships = '/admin/internships'
  static adminTransactions = '/admin/transactions'
  /* Travel products — distinct from Transactions, which is programme/offer
     money. Orders is flights, eSIMs and stays; Operations is the stays
     back-office (cancellations, supplier reconciliation). */
  static adminOrders = '/admin/orders'
  static adminOperations = '/admin/operations'
  /* Booking resolution: paid bookings the supplier couldn't complete, waiting
     on CS to rebook, enter by hand, retry (eSIM) or refund. */
  static adminActionRequired = '/admin/action-required'
  static adminPartnerApplications = '/admin/partner-applications'
  /* Golafly API merchants (the golafly-merchant portal): review, approve,
     disable, create. */
  static adminMerchants = '/admin/merchants'
  static adminSettings = '/admin/settings'

  static adminWithTab(route: string, tab: string) {
    return `${route}?${QueryParams.tab}=${tab}`
  }

  static applyNowWithProgram(program: ProgramType) {
    return `${this.applyNow}?${QueryParams.program}=${program}`
  }

  static applyNowWithProgramSubcategory(
    program: ProgramType,
    subcategoryId: number,
  ) {
    return `${this.applyNow}?${QueryParams.program}=${program}&${QueryParams.programSubcategoryId}=${subcategoryId}`
  }
}
