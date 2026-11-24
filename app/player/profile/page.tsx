import type { Metadata } from "next";
import PlayerProfileClient from "./client";

export const metadata: Metadata = {
  title: "Profile | Golafly",
};

export default function PlayerProfilePage() {
  return <PlayerProfileClient />;
}
