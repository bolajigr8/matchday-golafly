import type { Metadata } from "next";
import MatchTicketOrderClient from "./client";

export const metadata: Metadata = {
  title: "Match ticket order | Golafly Admin",
  description: "A single matchday ticket order.",
};

export default async function AdminMatchTicketOrderPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  return <MatchTicketOrderClient orderId={orderId} />;
}
