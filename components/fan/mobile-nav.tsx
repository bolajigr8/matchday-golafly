"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Routes } from "@/routes";
import { FAN_NAV, isNavActive, type FanNavItem } from "./fan-nav";

/* App-style bottom tab bar. The desktop sidebar is hidden below `md` and this
   takes over — same destinations, same order, from the same nav list. Shared
   by the fan and player dashboards. */

export function FanMobileNav({
  nav = FAN_NAV,
  home = Routes.dashboard,
}: {
  nav?: FanNavItem[];
  home?: string;
}) {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-sidebar-border bg-sidebar/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
      <div
        className="grid"
        style={{ gridTemplateColumns: `repeat(${nav.length}, minmax(0, 1fr))` }}
      >
        {nav.map(item => {
          const active = isNavActive(pathname, item.href, home);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className="flex h-[62px] flex-col items-center justify-center gap-1"
            >
              <span
                className={cn(
                  "relative flex h-[26px] w-[46px] items-center justify-center rounded-full transition-colors",
                  active
                    ? "bg-[color-mix(in_oklch,var(--brand)_20%,transparent)] text-brand-text"
                    : "text-muted-foreground",
                )}
              >
                <Icon className="size-[19px]" />
                {item.pending && (
                  <i className="absolute right-2 top-px size-1.5 rounded-full bg-[var(--status-warn)]" />
                )}
              </span>
              <span
                className={cn(
                  "text-[10px] leading-none",
                  active ? "font-bold text-brand-text" : "text-muted-foreground",
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
