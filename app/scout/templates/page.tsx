import type { Metadata } from "next";
import TemplatesClient from "./client";

export const metadata: Metadata = {
  title: "Templates | Golafly Scouting",
  description: "The attributes each position is scored on.",
};

export default function ScoutTemplatesPage() {
  return <TemplatesClient />;
}
