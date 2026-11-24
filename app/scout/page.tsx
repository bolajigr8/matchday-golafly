import { redirect } from "next/navigation";
import { Routes } from "@/routes";

export default function ScoutIndexPage() {
  redirect(Routes.scoutDashboard);
}
