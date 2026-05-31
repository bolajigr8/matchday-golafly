import type { Metadata } from "next";
import { ExtrasClient } from "./client";

export const metadata: Metadata = {
  title: "Build Your Bundle | Matchday Builder",
  description: "Add a hotel and flights to complete your football matchday experience.",
};

export default function ExtrasPage() {
  return <ExtrasClient />;
}
