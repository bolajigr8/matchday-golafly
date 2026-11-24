import type { Metadata } from "next";
import PlayerProfileClient from "./client";

export const metadata: Metadata = {
  title: "Player profile | Golafly Scouting",
};

/* Next 16: params is a Promise in dynamic routes. Awaited here in the server
   component and handed to the client as a plain string, so the client never
   has to deal with the async shape. */
export default async function ScoutPlayerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PlayerProfileClient playerId={id} />;
}
