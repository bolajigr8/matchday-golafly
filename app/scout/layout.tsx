"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { ScoutSidebar } from "@/components/scout/scout-sidebar";
import { AdminNavContext } from "@/components/admin/admin-nav-context";

/* The scouting shell.
 *
 * Same structure as app/admin/layout.tsx, deliberately: sidebar + content
 * pane, no top bar, `fixed inset-0` so the shell owns the viewport exactly
 * rather than inheriting the root layout's flex chain — which is what left the
 * admin sidebar short of the bottom with its edge line stopping mid-page.
 * `overflow-hidden` here plus `overflow-y-auto` on <main> makes the CONTENT
 * PANE the scroll container, so a page header's `sticky top-0` sticks to the
 * top of the pane instead of riding up over the stat cards.
 *
 * There is NO login escape hatch here, unlike the admin layout. The admin has
 * /admin/login nested under its own prefix; scouting has no login route at all
 * — one shared /login serves every role, and it lives outside this subtree.
 *
 * Reuses AdminNavContext rather than declaring a second identical context: it
 * carries one function, `openNav`, for the page header's mobile menu button,
 * and two contexts with the same shape would just be two things to keep in
 * step. Its name is about the shell it was written for, not an audience.
 */
export default function ScoutLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <AdminNavContext.Provider value={{ openNav: () => setMobileOpen(true) }}>
      <div className="fixed inset-0 flex overflow-hidden bg-background">
        <ScoutSidebar
          collapsed={collapsed}
          onToggleCollapsed={() => setCollapsed(c => !c)}
        />

        {/* Under lg the sidebar becomes an overlay drawer. The sticky content
            header doubles as the mobile top bar — no separate global bar is
            ever in the DOM. */}
        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              type="button"
              aria-label="Close navigation"
              onClick={() => setMobileOpen(false)}
              className="absolute inset-0 bg-foreground/40 backdrop-blur-[2px]"
            />
            <div className="absolute inset-y-0 left-0 flex w-[264px] flex-col bg-sidebar shadow-[var(--lift-3)]">
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="absolute right-2 top-2 z-10 flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-sidebar-accent"
                aria-label="Close navigation"
              >
                <X className="size-4" />
              </button>
              <div className="flex flex-1 flex-col [&>aside]:flex [&>aside]:w-full">
                <ScoutSidebar collapsed={false} onToggleCollapsed={() => setCollapsed(c => !c)} />
              </div>
            </div>
          </div>
        )}

        <main className="flex min-w-0 flex-1 flex-col overflow-y-auto">{children}</main>
      </div>
    </AdminNavContext.Provider>
  );
}
