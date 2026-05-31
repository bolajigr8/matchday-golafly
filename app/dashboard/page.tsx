import type { Metadata } from 'next'
import { DashboardHomeClient } from './client'

export const metadata: Metadata = { title: 'Home' }

export default function DashboardPage() {
  return <DashboardHomeClient />
}
