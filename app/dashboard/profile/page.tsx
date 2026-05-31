import type { Metadata } from 'next'
import { ProfileClient } from './client'

export const metadata: Metadata = { title: 'My Profile' }

export default function ProfilePage() {
  return <ProfileClient />
}
