import type { Metadata } from "next";
import { StaysClient } from "./client";

export const metadata: Metadata = {
  title: "Stays | Matchday Builder",
  description: "Find and book hotels near your football matchday venue.",
};

export default function StaysPage() {
  return <StaysClient />;
}
