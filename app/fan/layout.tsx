import type { Metadata } from "next";
import { FanSidebar } from "@/components/fan/sidebar";
import { FanMobileNav } from "@/components/fan/mobile-nav";
import { NO_INDEX } from '@/lib/seo'
import { ThemeToggle } from "@/components/ui/theme-toggle";

export const metadata: Metadata = {
  robots: NO_INDEX,
  title: "Dashboard | Golafly",
  description: "Your match tickets and travel, in one place.",
};

/* The fan shell. Sidebar on desktop, bottom tab bar under `md`.
 *
 * Server component: it holds no state of its own. The admin layout is a client
 * component because it owns a collapse rail and a drawer; the fan shell has
 * neither, so nothing here needs to ship to the browser.
 *
 * A visitor without a session never reaches this — proxy.ts redirects to
 * /login first, which is what stops the shell flashing before a client-side
 * redirect could run. */
export default function FanDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    /* h-dvh + overflow-hidden, NOT min-h-dvh. The sidebar has to fill the
       viewport exactly and stay put while you read; making the CONTENT PANE
       the scroll container (overflow-y-auto on <main>) is what pins it. With
       min-h-dvh the whole window scrolled, so the sidebar's right edge line
       ran out partway down the page and the nav slid up out of reach. */
    <div className="flex h-dvh overflow-hidden bg-background">
      <FanSidebar />

      <main className="relative min-w-0 flex-1 overflow-y-auto">
        {/* The sidebar carries the switch from md up; phones get it here. */}
        <ThemeToggle className="absolute right-3 top-3 z-10 md:hidden" />
        {/* Lime wash, top-right. Purely decorative, sits behind everything and
            never tints text. */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-[320px]"
          style={{
            background:
              "radial-gradient(ellipse at 85% -20%, color-mix(in oklch, var(--brand) 12%, transparent), transparent 62%)",
          }}
        />
        {/* pb-24 on mobile so content clears the fixed tab bar. */}
        <div className="relative mx-auto w-full max-w-[1100px] px-4 pb-24 pt-6 sm:px-6 md:pb-8">
          {children}
        </div>
      </main>

      <FanMobileNav />
    </div>
  );
}
