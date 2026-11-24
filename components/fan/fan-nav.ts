import { House, Receipt, Settings, Ticket } from "lucide-react";
import { Routes } from "@/routes";

/* ONE definition of the fan nav, used by both the sidebar and the mobile tab
   bar. They must never disagree about what exists or what order it sits in.

     Home     the roll-up and the empty state
     Tickets  match tickets
     Ledgers  every flight, stay and eSIM order, with a detail page per order
     Settings keeps the account reachable without a second login

   The sidebar and tab bar take a nav list, so the player dashboard renders the
   same shell with components/player/player-nav.ts. */

export interface FanNavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  /** Backing endpoint does not exist yet — renders a dot, never a count. */
  pending?: boolean;
}

export const FAN_NAV: FanNavItem[] = [
  { href: Routes.dashboard, label: "Home", icon: House },
  { href: Routes.dashboardTickets, label: "Tickets", icon: Ticket },
  { href: Routes.dashboardLedgers, label: "Ledgers", icon: Receipt },
  { href: Routes.dashboardSettings, label: "Settings", icon: Settings },
];

/** The home entry is an exact match; everything else matches its subtree. */
export const isNavActive = (pathname: string, href: string, home: string): boolean =>
  href === home ? pathname === href : pathname.startsWith(href);

export const isFanNavActive = (pathname: string, href: string): boolean =>
  isNavActive(pathname, href, Routes.dashboard);
