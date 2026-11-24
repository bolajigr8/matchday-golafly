import type { Metadata } from "next";
import SettingsClient from "./client";

export const metadata: Metadata = {
  title: "Settings | Golafly Scouting",
  description: "Your scouting profile, security and notification preferences.",
};

export default function ScoutSettingsPage() {
  return <SettingsClient />;
}
