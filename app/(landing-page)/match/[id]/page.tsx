import type { Metadata } from "next";
import { MatchDetailClient } from "./client";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  return {
    title: `Match Details | Matchday Builder`,
    description: "Full match profile — stadium, landmarks, travel overview, and booking.",
  };
}

export default function MatchDetailPage({ params }: { params: { id: string } }) {
  return <MatchDetailClient id={params.id} />;
}
