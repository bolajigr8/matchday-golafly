"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Routes } from "@/routes";
import { fanInitial } from "@/features/fan/session";
import { useFanLogout, useHydratedFan } from "@/features/fan/hooks";
import { FAN_NAV, isNavActive, type FanNavItem } from "./fan-nav";

/* The account sidebar. Hidden under `md`, where components/fan/mobile-nav.tsx
   takes over with the same destinations.

   Shared by the fan and player dashboards — same shell, different nav. Rows
   are 42px, active is a solid lime pill you can spot without reading, and the
   person's own name is the first thing on the page: this is their account,
   not a console. No collapse rail. */

export function FanSidebar({
  nav = FAN_NAV,
  home = Routes.dashboard,
  tagline = "Matchday, sorted.",
}: {
  nav?: FanNavItem[];
  home?: string;
  tagline?: string;
}) {
  const pathname = usePathname();
  const { user } = useHydratedFan();
  const logout = useFanLogout();

  /* `user` is null until hydrate() runs after mount — see store/fan-auth.ts.
     The fallbacks are what both the server and the first client render show. */
  const name = user?.name ?? "Your account";
  const email = user?.email ?? "";

  return (
    <aside className="hidden w-[264px] shrink-0 flex-col gap-4 border-r border-sidebar-border bg-sidebar px-4 pb-4 pt-5 md:flex">
      <div>
        <Link href={home} className="block">
          <span className="block font-heading text-base font-bold tracking-tight text-sidebar-foreground">
            GOLAFLY
          </span>
          <span className="mt-0.5 block font-mono text-[9.5px] text-muted-foreground">
            {tagline}
          </span>
        </Link>
      </div>

      <div className="flex items-center gap-3 rounded-[20px] bg-card p-[11px] shadow-[0_0_0_1px_var(--edge-strong)]">
        <span className="flex size-[42px] shrink-0 items-center justify-center rounded-full bg-brand font-heading text-[17px] font-bold text-brand-foreground shadow-[0_0_0_1px_var(--brand-edge)]">
          {fanInitial(user?.name)}
        </span>
        <span className="min-w-0">
          <span className="block truncate font-heading text-[13px] font-bold text-foreground">
            {name}
          </span>
          {email && (
            <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">
              {email}
            </span>
          )}
        </span>
      </div>

      <nav className="flex flex-col gap-1">
        {nav.map(item => {
          const active = isNavActive(pathname, item.href, home);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex h-[42px] items-center gap-3 rounded-[14px] px-[13px] text-[13.5px] transition-colors",
                active
                  ? "bg-brand font-bold text-brand-foreground shadow-[0_0_0_1px_var(--brand-edge)]"
                  : "font-medium text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground",
              )}
            >
              <Icon className="size-[18px] shrink-0" />
              <span>{item.label}</span>
              {item.pending && (
                <i
                  title="Awaiting endpoint"
                  className={cn(
                    "ml-auto size-[7px] rounded-full",
                    active ? "bg-brand-foreground/55" : "bg-[var(--status-warn)]",
                  )}
                />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-[var(--edge)] pt-2.5">
        <ThemeToggle
          withLabel
          className="h-[42px] w-full justify-start rounded-[14px] px-[13px] text-[13.5px] font-medium text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
        />
        <button
          type="button"
          onClick={logout}
          className="flex h-[42px] w-full items-center gap-3 rounded-[14px] px-[13px] text-[13.5px] font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
        >
          <LogOut className="size-[18px] shrink-0" />
          Log out
        </button>
      </div>
    </aside>
  );
}
