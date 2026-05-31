import type { Metadata } from "next";
import { FlightsClient } from "./client";

export const metadata: Metadata = {
  title: "Flights | Matchday Builder",
  description: "Search and compare flights to your next football matchday destination.",
};

export default function FlightsPage() {
  return <FlightsClient />;
}
