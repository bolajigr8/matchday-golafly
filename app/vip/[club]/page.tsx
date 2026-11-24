import { redirect } from 'next/navigation'

/* /vip/<club> has no page of its own: show that club's matches on /vip. */
export default async function VipClubPage({ params }: { params: Promise<{ club: string }> }) {
  const { club } = await params
  redirect(`/vip?club=${encodeURIComponent(club)}#pick-your-match`)
}
