import type { Metadata } from 'next'
import { TicketsClient } from './client'

export const metadata: Metadata = { title: 'My Tickets' }

export default function TicketsPage() {
  return <TicketsClient />
}
