import type { Metadata } from "next";
import PlayersClient from "./client";

export const metadata: Metadata = {
  title: "Players | Golafly Admin",
  description: "Registered players, scouting assessments and CV downloads.",
};

export default function AdminPlayersPage() {
  return <PlayersClient />;
}
