import type { Metadata } from "next";
import { Suspense } from "react";
import ProgramPlayersClient from "./client";

export const metadata: Metadata = {
  title: "Program players | Golafly Admin",
  description: "A program's spots per position and the players registered on it.",
};

export default async function AdminProgramPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <Suspense fallback={null}>
      <ProgramPlayersClient programId={Number(id)} />
    </Suspense>
  );
}
