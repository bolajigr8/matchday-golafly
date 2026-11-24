// features/stays/extra.ts

import { Coffee, Car, Clock, LogOut, ParkingSquare, Shield } from 'lucide-react'

export interface StayExtra {
  id: string
  icon: typeof Coffee
  label: string
  desc: string
  price: number
  per: '/ night' | '/ stay'
}

export const STAY_EXTRAS: StayExtra[] = [
  {
    id: 'breakfast',
    icon: Coffee,
    label: 'Breakfast included',
    desc: 'Daily buffet breakfast for all guests',
    price: 18,
    per: '/ night',
  },
  {
    id: 'transfer',
    icon: Car,
    label: 'Airport transfer',
    desc: 'Private round-trip airport pickup & drop-off',
    price: 45,
    per: '/ stay',
  },
  {
    id: 'earlyin',
    icon: Clock,
    label: 'Early check-in',
    desc: 'Guaranteed room from 9:00 AM on arrival day',
    price: 25,
    per: '/ stay',
  },
  {
    id: 'lateout',
    icon: LogOut,
    label: 'Late check-out',
    desc: 'Keep your room until 4:00 PM on departure',
    price: 25,
    per: '/ stay',
  },
  {
    id: 'parking',
    icon: ParkingSquare,
    label: 'On-site parking',
    desc: 'Secure covered parking, in & out access',
    price: 15,
    per: '/ night',
  },
  {
    id: 'insurance',
    icon: Shield,
    label: 'Travel insurance',
    desc: 'Free cancellation & medical coverage',
    price: 12,
    per: '/ night',
  },
]

export function calcExtrasTotal(ids: string[], nights: number): number {
  return STAY_EXTRAS.filter((e) => ids.includes(e.id)).reduce(
    (sum, e) => sum + (e.per === '/ night' ? e.price * nights : e.price),
    0,
  )
}
