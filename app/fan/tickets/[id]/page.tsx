import type { Metadata } from "next";
import TicketOrderClient from "./client";

export const metadata: Metadata = {
  title: "Match tickets | Golafly",
};

export default async function FanTicketOrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <TicketOrderClient id={Number(id)} />;
}
