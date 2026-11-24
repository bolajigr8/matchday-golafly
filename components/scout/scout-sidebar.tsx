"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import {
  ChevronsUpDown,
  LogOut,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Sun,
  Trophy,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Routes } from "@/routes";
import { useFanLogout } from "@/features/fan/hooks";
import { scoutInitials } from "@/features/scout/session";
import { countsFor, useAssignedPlayers, useScoutSession } from "@/features/scout/hooks";
import { SCOUT_NAV, isScoutNavActive } from "./scout-nav";

/* The scouting sidebar.
 *
 * Reuses the ADMIN visual language, not the fan's: a scout works the way an
 * admin does — all day, at a desk, in tables — so 30px rows, 1px edges and a
 * subtle accent wash for active, rather than the fan's 42px rows and solid
 * lime pills. That decision is recorded in the design bundle too; see the
 * Golafly Scouting project on claude.ai/design.
 *
 * Like the admin shell there is NO top bar: everything a global bar would
 * carry lives here, top to bottom — brand, nav, the scout's own published
 * count, utility, user. The breadcrumb and page actions live in the page
 * header inside the pane.
 *
 * Sign-out is the shared one. There is a single session behind /dashboard and
 * /scout, so a scouting-specific logout that cleared different state would
 * leave the two dashboards disagreeing about whether anyone is signed in.
 */

export function ScoutSidebar({
  collapsed,
  onToggleCollapsed,
}: {
  collapsed: boolean;
  onToggleCollapsed: () => void;
}) {
  const pathname = usePathname();
  const { user } = useScoutSession();
  const logout = useFanLogout();
  const { theme, setTheme } = useTheme();

  /* The one number a scout is measured on, derived from the SAME cached list
     every screen reads (features/scout/hooks.ts). On every route but the
     players table this is a cache hit, not a second request — and because it
     is the same list, the sidebar can never claim a different total from the
     table the scout is looking at.

     Undefined while it loads: a count that renders 0 and then jumps to 7 is
     worse than one that arrives once. */
  const players = useAssignedPlayers();
  const counts = players.data ? countsFor(players.data.data) : undefined;

  const name = user?.name ?? "Your account";
  const approved = counts?.approved;

  return (
    <aside
      data-print-hide
      className={cn(
        "hidden shrink-0 flex-col border-r border-sidebar-border bg-sidebar lg:flex",
        collapsed ? "w-[72px]" : "w-[264px]",
      )}
    >
      {/* Brand */}
      <div className="border-b border-[var(--edge)] px-3 py-3">
        <Link href={Routes.scoutDashboard} className="flex items-center gap-2">
          <span className="font-heading text-[13px] font-bold tracking-[0.08em] text-brand-text">
            {collapsed ? "GF" : "GOLAFLY"}
          </span>
          {!collapsed && (
            <span className="rounded-[5px] bg-muted px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Scouting
            </span>
          )}
        </Link>
      </div>

      {/* Nav. Flat — no group headings, no search box. */}
      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-2">
        {SCOUT_NAV.map(item => {
          const active = isScoutNavActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              title={collapsed ? item.label : undefined}
              className={cn(
                "flex h-[30px] items-center gap-2.5 rounded-md text-[12.5px] transition-colors",
                collapsed ? "justify-center px-0" : "px-2.5",
                active
                  ? "bg-sidebar-accent font-semibold text-brand-text"
                  : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground",
              )}
            >
              <Icon className="size-[15px] shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Approved evaluations — the one number a scout is measured on, so it
          lives where they always see it. Hidden on the rail, where there is no
          room for it to mean anything. */}
      {!collapsed && approved !== undefined && (
        <div className="mx-2 mb-2 rounded-md border border-[var(--edge)] bg-muted p-2.5">
          <span className="flex items-center gap-1.5 font-mono text-[9px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
            <Trophy className="size-3" />
            Scouting impact
          </span>
          <span className="mt-1 block font-heading text-[21px] font-bold leading-none tabular-nums">
            {approved}
          </span>
          <span className="mt-0.5 block text-[10px] text-muted-foreground">
            evaluation{approved === 1 ? "" : "s"} approved
          </span>
        </div>
      )}

      {/* Utility */}
      <div className="flex items-center gap-1 border-t border-[var(--edge)] px-2 py-2">
        <button
          type="button"
          onClick={onToggleCollapsed}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="flex size-[26px] items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-sidebar-accent"
        >
          {collapsed ? (
            <PanelLeftOpen className="size-[15px]" />
          ) : (
            <PanelLeftClose className="size-[15px]" />
          )}
        </button>
        {!collapsed && (
          <button
            type="button"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label="Toggle theme"
            className="flex size-[26px] items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-sidebar-accent"
          >
            <Sun className="size-[13px] dark:hidden" />
            <Moon className="hidden size-[13px] dark:block" />
          </button>
        )}
      </div>

      {/* User */}
      <div className="border-t border-[var(--edge)] p-2">
        <div
          className={cn(
            "flex items-center gap-2.5 rounded-md px-1.5 py-1.5",
            collapsed && "justify-center px-0",
          )}
        >
          <span className="flex size-[26px] shrink-0 items-center justify-center rounded-full bg-muted font-mono text-[9.5px] font-semibold text-muted-foreground">
            {scoutInitials(user?.name)}
          </span>
          {!collapsed && (
            <>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[12px] font-semibold leading-tight">
                  {name}
                </span>
                <span className="block truncate text-[10.5px] text-muted-foreground">
                  {user?.role ? titleCase(user.role) : "Scout"}
                </span>
              </span>
              <ChevronsUpDown className="size-[13px] shrink-0 text-muted-foreground" />
            </>
          )}
        </div>
        <button
          type="button"
          onClick={logout}
          title={collapsed ? "Sign out" : undefined}
          className={cn(
            "mt-0.5 flex h-[30px] w-full items-center gap-2.5 rounded-md text-[12.5px] text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground",
            collapsed ? "justify-center px-0" : "px-2.5",
          )}
        >
          <LogOut className="size-[15px] shrink-0" />
          {!collapsed && "Sign out"}
        </button>
      </div>
    </aside>
  );
}

/** "club_representative" → "Club representative". The API's role strings are
 *  snake_case machine values; this is the only place one is shown to a human. */
function titleCase(role: string): string {
  const spaced = role.replace(/[_-]+/g, " ").trim();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1).toLowerCase();
}
