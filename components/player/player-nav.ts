import { ClipboardList, House, Settings, UserRound } from "lucide-react";
import { Routes } from "@/routes";
import type { FanNavItem } from "@/components/fan/fan-nav";

/* The player dashboard's nav — rendered by the same sidebar and tab bar as the
   fan dashboard.

     Home          profile snapshot, evaluation status, CV
     Profile       everything Golafly holds about the player, and the CV
     Scout report  the approved evaluation
     Settings      password and sign-out

   Camp, messages, notifications and videos are gone: the API has no endpoint
   for any of them. */

export const PLAYER_NAV: FanNavItem[] = [
  { href: Routes.playerDashboard, label: "Home", icon: House },
  { href: Routes.playerProfile, label: "Profile", icon: UserRound },
  { href: Routes.playerScoutReport, label: "Scout report", icon: ClipboardList },
  { href: Routes.playerSettings, label: "Settings", icon: Settings },
];
