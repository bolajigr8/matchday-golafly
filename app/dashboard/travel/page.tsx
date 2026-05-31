import type { Metadata } from 'next'
import { TravelClient } from './client'

export const metadata: Metadata = { title: 'Travel' }

export default function TravelPage() {
  return <TravelClient />
}
