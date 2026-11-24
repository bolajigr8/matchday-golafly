"use client";

import { FanMobileNav } from "@/components/fan/mobile-nav";
import { FanSidebar } from "@/components/fan/sidebar";
import { Routes } from "@/routes";
import { PLAYER_NAV } from "./player-nav";

/* The fan shell with the player nav, bound on the CLIENT side.
 *
 * The nav items carry lucide icon components, and a server layout cannot pass
 * functions into client components as props — React refuses to serialise them
 * ("Functions cannot be passed directly to Client Components"). The fan layout
 * never hits this because FAN_NAV is a default inside the client component;
 * these wrappers do the same for the player nav. */

export function PlayerSidebar() {
  return (
    <FanSidebar nav={PLAYER_NAV} home={Routes.playerDashboard} tagline="Your football, on record." />
  );
}

export function PlayerMobileNav() {
  return <FanMobileNav nav={PLAYER_NAV} home={Routes.playerDashboard} />;
}
