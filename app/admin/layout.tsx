"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminNavContext } from "@/components/admin/admin-nav-context";
import { Routes } from "@/routes";

/* The repo's first nested layout. Sidebar + content pane, no top bar —
   ConditionalHeader and ConditionalFooter both bail out on /admin, so this
   owns the whole viewport below <body>.

   Client, because the rail collapse and the mobile drawer are local UI state
   that every page underneath needs to be able to open. */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  /* Login is the one admin route with no shell — same escape-hatch shape as
     ConditionalHeader. A nested layout would still compose with this one, so
     the check has to live here. */
  if (pathname === Routes.adminLogin) {
    return <div className="flex min-h-dvh flex-1 flex-col">{children}</div>;
  }

  return (
    <AdminNavContext.Provider value={{ openNav: () => setMobileOpen(true) }}>
      {/* fixed inset-0, not h-dvh. The admin shell owns the whole viewport, and
          sizing it from the root layout's flex chain (body is min-h-full
          flex-col, wrapping children in another flex-1 column) left the
          sidebar short of the bottom with its edge line stopping mid-page.
          Taking it out of flow makes the height exact.

          overflow-hidden here + overflow-y-auto on <main> makes the CONTENT
          PANE the scroll container rather than the window, which is what pins
          the sidebar and makes the page header's `sticky top-0` stick to the
          top of the pane instead of riding up over the stat cards. */}
      <div className="fixed inset-0 flex overflow-hidden bg-background">
        <AdminSidebar collapsed={collapsed} onToggleCollapsed={() => setCollapsed(c => !c)} />

        {/* Under lg the sidebar becomes an overlay drawer. The sticky content
            header is the mobile top bar — no separate global bar is ever in
            the DOM. */}
        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              type="button"
              aria-label="Close navigation"
              onClick={() => setMobileOpen(false)}
              className="absolute inset-0 bg-foreground/40 backdrop-blur-[2px]"
            />
            <div className="absolute inset-y-0 left-0 flex w-[280px] flex-col bg-sidebar shadow-[var(--lift-3)]">
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="absolute right-2 top-2 flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-sidebar-accent"
                aria-label="Close navigation"
              >
                <X className="size-4" />
              </button>
              <div className="flex flex-1 flex-col [&>aside]:flex [&>aside]:w-full">
                <AdminSidebar collapsed={false} onToggleCollapsed={() => setCollapsed(c => !c)} />
              </div>
            </div>
          </div>
        )}

        <main className="flex min-w-0 flex-1 flex-col overflow-y-auto">{children}</main>
      </div>
    </AdminNavContext.Provider>
  );
}
