import type { Metadata } from "next";
import LedgerDetailClient from "./client";

export const metadata: Metadata = {
  title: "Order | Golafly",
};

export default async function FanLedgerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <LedgerDetailClient id={Number(id)} />;
}
