import type { Metadata } from "next";
import { PlayerMobileNav, PlayerSidebar } from "@/components/player/player-shell";
import { NO_INDEX } from '@/lib/seo'
import { ThemeToggle } from "@/components/ui/theme-toggle";

export const metadata: Metadata = {
  robots: NO_INDEX,
  title: "Player | Golafly",
  description: "Your football profile, CV and scout report.",
};

/* The player shell — the fan dashboard's layout (app/dashboard/layout.tsx),
   with the player nav. Sidebar on desktop, bottom tab bar under `md`, content
   pane as the scroll container so the sidebar stays put. proxy.ts sends a
   visitor without a session to /login before this renders. */
export default function PlayerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-dvh overflow-hidden bg-background">
      <PlayerSidebar />

      <main className="relative min-w-0 flex-1 overflow-y-auto">
        {/* The sidebar carries the switch from md up; phones get it here. */}
        <ThemeToggle className="absolute right-3 top-3 z-10 md:hidden" />
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-[320px]"
          style={{
            background:
              "radial-gradient(ellipse at 85% -20%, color-mix(in oklch, var(--brand) 12%, transparent), transparent 62%)",
          }}
        />
        <div className="relative mx-auto w-full max-w-[1100px] px-4 pb-24 pt-6 sm:px-6 md:pb-8">
          {children}
        </div>
      </main>

      <PlayerMobileNav />
    </div>
  );
}
