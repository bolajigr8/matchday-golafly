import {
  // BarChart3,      — Comparisons, see the commented nav entry below
  ClipboardList,
  FileText,
  LayoutDashboard,
  LayoutTemplate,
  Settings,
  Users,
} from "lucide-react";
import { Routes } from "@/routes";

/* ONE definition of the scouting nav, used by the sidebar and the mobile
   drawer. They must never disagree about what exists or what order it sits in.

   FLAT, and no search box — same rule as the admin nav.

   SIX ENTRIES.

   Templates is back. Evaluations are scored against a template chosen from
   the player's position (features/scout/templates.ts), so a scout needs to see
   which attributes each position is scored on. The templates are hardcoded —
   the screen is read-only on purpose.

   Comparisons stays COMMENTED OUT: it would rank players on numbers the
   backend cannot reproduce, and with position templates two players at
   different positions are no longer scored on the same attributes anyway.

   Messages and Notifications are gone entirely; the scouting API has no
   endpoints for either. */

export interface ScoutNavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const SCOUT_NAV: ScoutNavItem[] = [
  { href: Routes.scoutDashboard, label: "Dashboard", icon: LayoutDashboard },
  { href: Routes.scoutPlayers, label: "Assigned Players", icon: Users },
  { href: Routes.scoutEvaluations, label: "Evaluations", icon: ClipboardList },
  { href: Routes.scoutTemplates, label: "Templates", icon: LayoutTemplate },
  { href: Routes.scoutReports, label: "Reports", icon: FileText },
  // { href: Routes.scoutComparisons, label: "Comparisons", icon: BarChart3 },
  { href: Routes.scoutSettings, label: "Settings", icon: Settings },
];

/** Dashboard is an exact match; everything else matches its subtree, so
 *  /scout/players/42 keeps Assigned Players lit. */
export const isScoutNavActive = (pathname: string, href: string): boolean => {
  if (href === Routes.scoutDashboard) return pathname === href;
  return pathname.startsWith(href);
};
