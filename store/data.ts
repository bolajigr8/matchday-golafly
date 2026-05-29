import type { SocialIconKey } from '@/components/social-icons'

/* ─── Social links ────────────────────────────────────────────── */
export interface SocialLink {
  name: SocialIconKey
  href: string
}

export const SOCIAL_LINKS: SocialLink[] = [
  { name: 'Instagram', href: 'https://www.instagram.com/golafly/' },
  {
    name: 'Facebook',
    href: 'https://www.facebook.com/profile.php?id=61589922166546',
  },
  { name: 'LinkedIn', href: 'https://www.linkedin.com/company/68992893' },
  { name: 'Twitter', href: 'https://x.com/golafly?s=20' },
  { name: 'TikTok', href: 'https://www.tiktok.com/@golafly' },
  { name: 'WhatsApp', href: 'https://wa.me/34667068018' },
]

/* ─── Navbar links ────────────────────────────────────────────── */
export const NAV_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Flights', href: '/flights' },
  { label: 'Stays', href: '/stays' },
] as const

/* ─── Footer nav columns ──────────────────────────────────────── */
export const FOOTER_COLUMNS = [
  {
    heading: 'Program',
    links: [
      { label: 'Football Tourism', href: '/program/football-tourism' },
      { label: 'Sports Marketing', href: '/program/sports-marketing' },
      { label: 'Player Management', href: '/program/player-management' },
    ],
  },
  {
    heading: 'Tourism',
    links: [
      { label: 'Trials & Showcase', href: '/tourism/trials' },
      { label: 'Match-day Experience', href: '/tourism/matchday' },
      { label: 'Iconic Football Venues', href: '/tourism/venues' },
    ],
  },
  {
    heading: 'Company',
    links: [
      { label: 'About Us', href: '/about' },
      { label: 'Blog', href: '/blog' },
      { label: 'FAQ', href: '/faq' },
      { label: 'Careers', href: '/careers' },
    ],
  },
  {
    heading: 'Legal',
    links: [
      { label: 'Terms & Conditions', href: '/legal/terms' },
      { label: 'Privacy Policy', href: '/legal/privacy' },
      { label: 'Refund Policy', href: '/legal/refund' },
    ],
  },
] as const

/* ─── Offices ─────────────────────────────────────────────────── */
export const OFFICES = [
  {
    city: 'London',
    lines: ['128 City Road · EC1V 2NX', 'United Kingdom'],
  },
  {
    city: 'Barcelona',
    lines: ['C/ Cal Ciso 69 · 08038', 'Spain'],
  },
] as const

/* ─── Contact ─────────────────────────────────────────────────── */
export const CONTACT = {
  email: 'contact@golafly.com',
  phone: '+1 123 466 7899',
  whatsapp: 'https://wa.me/34667068018',
} as const

/* ─── Brand ───────────────────────────────────────────────────── */
export const BRAND = {
  name:    "Golafly",
  tagline: "Global football development, tourism, and sports marketing. Connecting talent, brands, and fans to real opportunities worldwide.",
  logo:    "/logo.png",
  legal:   "© 2026 Golafly Ltd. All rights reserved.",
  badges:  ["FIFA Licensed", "Ethical Representation", "Transparent Fees"],
} as const;
