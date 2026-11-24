import type { Metadata } from "next";
import { Suspense } from "react";
import EvaluationClient from "./client";

export const metadata: Metadata = {
  title: "Evaluation | Golafly Scouting",
};

export default async function ScoutEvaluationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  /* The client reads useSearchParams, so it needs a boundary. */
  return (
    <Suspense fallback={null}>
      <EvaluationClient evaluationId={id} />
    </Suspense>
  );
}
