import type { Metadata } from "next";
import PlayerSettingsClient from "./client";

export const metadata: Metadata = {
  title: "Settings | Golafly",
};

export default function PlayerSettingsPage() {
  return <PlayerSettingsClient />;
}
