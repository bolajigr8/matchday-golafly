import type { Metadata } from "next";
import { CartClient } from "./client";
import { NO_INDEX } from '@/lib/seo'

export const metadata: Metadata = {
  robots: NO_INDEX,
  title: "Your Cart | Golafly",
  description: "Review your matchday selections — tickets, stadium tours, hospitality and travel extras — before checkout.",
};

export default function CartPage() {
  return <CartClient />;
}
