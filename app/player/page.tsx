import { redirect } from "next/navigation";
import { Routes } from "@/routes";

export default function PlayerIndexPage() {
  redirect(Routes.playerDashboard);
}
