import type { FanTone } from "@/features/fan/ledgers";
import { reviewState, type PlayerEvaluation } from "@/features/scout/evaluation";

/* Where the player's scout report stands, in the player's words.
 *
 * The admin's review loop (pending, needs revision, rejected) is internal to
 * Golafly — a player sees "being reviewed" for all of it, and the report
 * itself only once an admin has approved it. */
export function reportState(evaluation: PlayerEvaluation | null | undefined): {
  label: string;
  tone: FanTone;
  title: string;
  body: string;
} {
  const state = reviewState(evaluation);
  if (state === "approved") {
    return { label: "Ready", tone: "good", title: "Your scout report", body: "" };
  }
  if (state === "not_started") {
    return {
      label: "Not evaluated",
      tone: "neutral",
      title: "No scout report yet",
      body: "Once a Golafly scout has evaluated you and the report is approved, it appears here.",
    };
  }
  return {
    label: "In review",
    tone: "info",
    title: "Your report is being reviewed",
    body: "A Golafly scout has evaluated you. Your report appears here as soon as it has been approved.",
  };
}
