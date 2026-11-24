import { redirect } from "next/navigation";
import { Routes } from "@/routes";

export default function FanIndexPage() {
  redirect(Routes.dashboard);
}
