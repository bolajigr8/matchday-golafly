/* Seed data for the admin dashboard.
 *
 * IMPORTANT: this is placeholder content, not a data layer. The Golafly
 * frontend's /dashboard overview had no API behind it either — all six stat
 * cards were hardcoded there too — so nothing is being lost by starting here.
 * The real endpoints already exist in `services/applications.ts`,
 * `services/programs.ts` and `services/offers.ts`; wiring them up is the next
 * piece of work, and every screen below is shaped to accept the real payload.
 *
 * Follows the store/ convention: UPPER_SNAKE consts, one exported interface
 * per shape.
 */

export interface AdminPlayer {
  id: string
  initials: string
  name: string
  email: string
  position: string
  nationality: string
  level: string
  registered: string
  status: string
}

export const ADMIN_PLAYERS: AdminPlayer[] = [
  {
    id: 'plr_1',
    initials: 'AO',
    name: 'Adaeze Okonkwo',
    email: 'adaeze.okonkwo@example.com',
    position: 'Midfielder',
    nationality: 'Nigeria',
    level: 'U19',
    registered: '2026-07-14',
    status: 'Signed',
  },
  {
    id: 'plr_2',
    initials: 'MS',
    name: 'Marco Silva',
    email: 'marco.silva@example.com',
    position: 'Forward',
    nationality: 'Portugal',
    level: 'U17',
    registered: '2026-07-11',
    status: 'Pending',
  },
  {
    id: 'plr_3',
    initials: 'JT',
    name: 'Joseph Tembo',
    email: 'j.tembo@example.com',
    position: 'Goalkeeper',
    nationality: 'Zambia',
    level: 'U21',
    registered: '2026-07-09',
    status: 'Under review',
  },
  {
    id: 'plr_4',
    initials: 'LM',
    name: 'Lukas Meyer',
    email: 'lukas.meyer@example.com',
    position: 'Defender',
    nationality: 'Germany',
    level: 'U19',
    registered: '2026-07-02',
    status: 'Inactive',
  },
]

export interface AdminOffer {
  id: string
  title: string
  category: string
  deadline: string
  status: string
}

export const ADMIN_OFFERS: AdminOffer[] = [
  { id: 'ofr_1', title: 'Summer Trials 2026', category: 'Football Tourism', deadline: '2026-08-30', status: 'Active' },
  { id: 'ofr_2', title: 'Elite Scouting Camp', category: 'Player Management', deadline: '2026-09-14', status: 'Active' },
  { id: 'ofr_3', title: 'Brand Ambassador Drive', category: 'Sports Marketing', deadline: '2026-07-31', status: 'Closing' },
  { id: 'ofr_4', title: 'Lagos Academy Intake', category: 'Academy', deadline: '2026-06-30', status: 'Closed' },
  { id: 'ofr_5', title: 'Winter Tour Placements', category: 'Football Tourism', deadline: '2026-11-20', status: 'Draft' },
]

export interface AdminProgram {
  id: string
  title: string
  subcategory: string
  dates: string
  status: string
}

export const ADMIN_PROGRAMS: AdminProgram[] = [
  { id: 'prg_1', title: 'Football Tourism — Spain', subcategory: 'Tours', dates: 'Aug 4 – Aug 18', status: 'Published' },
  { id: 'prg_2', title: 'Player Management Intro', subcategory: 'Representation', dates: 'Sep 1 – Sep 30', status: 'Published' },
  { id: 'prg_3', title: 'Sports Marketing Lab', subcategory: 'Brand', dates: 'Oct 12 – Oct 26', status: 'Draft' },
  { id: 'prg_4', title: 'Academy Scouting Week', subcategory: 'Scouting', dates: 'Jul 7 – Jul 14', status: 'Archived' },
  { id: 'prg_5', title: 'Winter Trials — Portugal', subcategory: 'Tours', dates: 'Dec 2 – Dec 16', status: 'Pending' },
]

export interface AdminAcademy {
  id: string
  name: string
  location: string
  ageRange: string
  price: string
  status: string
}

export const ADMIN_ACADEMIES: AdminAcademy[] = [
  { id: 'acd_1', name: 'Lagos Elite U17', location: 'Lagos, NG', ageRange: '15–17', price: '€ 1,240.00', status: 'Active' },
  { id: 'acd_2', name: 'Porto Development', location: 'Porto, PT', ageRange: '13–16', price: '€ 980.00', status: 'Active' },
  { id: 'acd_3', name: 'Nairobi Goalkeeping', location: 'Nairobi, KE', ageRange: '14–18', price: '€ 640.00', status: 'Closing' },
  { id: 'acd_4', name: 'Accra Youth Camp', location: 'Accra, GH', ageRange: '12–15', price: '€ 520.00', status: 'Inactive' },
  { id: 'acd_5', name: 'Madrid Winter Clinic', location: 'Madrid, ES', ageRange: '16–19', price: '€ 1,680.00', status: 'Draft' },
]

export interface AdminTransaction {
  id: string
  initials: string
  customer: string
  email: string
  product: string
  amount: string
  date: string
  status: string
}

export const ADMIN_TRANSACTIONS: AdminTransaction[] = [
  { id: 'txn_1', initials: 'AO', customer: 'Adaeze Okonkwo', email: 'adaeze.okonkwo@example.com', product: 'Academy entry', amount: '€ 1,240.00', date: '2026-07-14', status: 'Paid' },
  { id: 'txn_2', initials: 'MS', customer: 'Marco Silva', email: 'marco.silva@example.com', product: 'Trial package', amount: '€ 118.50', date: '2026-07-13', status: 'Failed' },
  { id: 'txn_3', initials: 'GL', customer: 'Golafly Ltd', email: 'billing@golafly.com', product: 'Sponsorship', amount: '€ 97,310.25', date: '2026-07-12', status: 'Paid' },
  { id: 'txn_4', initials: 'JT', customer: 'Joseph Tembo', email: 'j.tembo@example.com', product: 'Brochure', amount: '€ 11.11', date: '2026-07-10', status: 'Refunded' },
]

export interface AdminPartnerApplication {
  id: string
  initials: string
  name: string
  email: string
  country: string
  role: string
  appliedOn: string
  experience: string
  motivation: string
  status: string
}

export const ADMIN_PARTNER_APPLICATIONS: AdminPartnerApplication[] = [
  {
    id: 'pap_1',
    initials: 'AO',
    name: 'Adaeze Okonkwo',
    email: 'adaeze.okonkwo@example.com',
    country: 'Nigeria',
    role: 'Regional scout',
    appliedOn: '2026-07-14',
    experience: '6 years',
    motivation:
      'Has run a grassroots scouting network in Lagos since 2020 and placed four players into European academies. Requesting regional partner status to formalise referrals.',
    status: 'Pending',
  },
  {
    id: 'pap_2',
    initials: 'MS',
    name: 'Marco Silva',
    email: 'marco.silva@example.com',
    country: 'Portugal',
    role: 'Academy partner',
    appliedOn: '2026-07-12',
    experience: '9 years',
    motivation: 'Runs a licensed academy in Porto and wants a formal placement pathway.',
    status: 'Under review',
  },
  {
    id: 'pap_3',
    initials: 'KN',
    name: 'Kwame Nkrumah',
    email: 'kwame.n@example.com',
    country: 'Ghana',
    role: 'Regional scout',
    appliedOn: '2026-07-09',
    experience: '4 years',
    motivation: 'Existing referral partner applying to formalise the relationship.',
    status: 'Accepted',
  },
  {
    id: 'pap_4',
    initials: 'EM',
    name: 'Elena Moreau',
    email: 'elena.moreau@example.com',
    country: 'France',
    role: 'Agency',
    appliedOn: '2026-07-04',
    experience: '12 years',
    motivation: 'Agency representation enquiry.',
    status: 'Rejected',
  },
]
