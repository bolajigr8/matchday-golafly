import type { Metadata } from "next";
import { SeatsClient } from "./client";

export const metadata: Metadata = {
  title: "Choose Your Seats | Matchday Builder",
  description: "Select your seat category and number of tickets for your football matchday experience.",
};

export default function SeatsPage() {
  return <SeatsClient />;
}
