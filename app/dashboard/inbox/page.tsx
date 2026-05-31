import type { Metadata } from 'next'
import { InboxClient } from './client'

export const metadata: Metadata = { title: 'Inbox' }

export default function InboxPage() {
  return <InboxClient />
}
