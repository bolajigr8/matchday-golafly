"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname, useSelectedLayoutSegment } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { EcosystemBar } from "@/components/ecosystem-bar";
import { CartButton } from "@/components/cart/cart-button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { MatchdayLogo } from "@/components/brand/matchday-logo";
import { LandingHeader } from "@/components/landing/landing-header";
import { ResellerBanner } from "@/components/reseller-banner";
import { BlackFridayBar } from "@/components/promo/black-friday";
import { useLandingHost } from "@/lib/site-runtime";
import { isVipFlowPath } from "@/features/vip/routes";
import { cn } from "@/lib/utils";
import { SummitBuilderHeader, SummitHeader } from "@/components/summit/header";
import { isSummitFlowPath, isSummitPath } from "@/features/summit/routes";

const CHECKOUT_PATHS = [
  "/builder/seats",
  "/builder/extras",
  "/builder/checkout",
  "/builder/checkout-tickets",
  "/builder/pay",
  "/builder/confirmed",
];

/* Minimal header shown on the focused checkout flow pages.
   Has the logo (back to home) and a cart trigger so the buyer can still
   see what's in their cart mid-checkout, but no other navigation links. */
function CheckoutHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm">
      {/* Reseller notice, pinned with the header (Google Ads policy). */}
      <ResellerBanner />
      <div className="page-container flex h-14 items-center justify-between">
        <Link
          href="/"
          aria-label="Golafly Matchday — home"
          className="flex items-center rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
        >
          <MatchdayLogo size="sm" />
        </Link>
        <div className="flex items-center gap-3 sm:gap-4">
          <ThemeToggle />
          <CartButton />
          <Link
            href="/"
            className="flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" />
            Back to home
          </Link>
        </div>
      </div>
    </header>
  );
}

/* Scroll position as an external store: the header only needs "past the
   first few pixels or not", and reading it this way needs no effect + state
   pair (and renders `false` on the server, matching the top of the page). */
function subscribeScroll(onChange: () => void) {
  window.addEventListener("scroll", onChange, { passive: true });
  return () => window.removeEventListener("scroll", onChange);
}
/* Hysteresis: fold the strip only past FOLD_AT, unfold it only back near the
   very top. Folding shrinks the sticky header by the strip's height (~37px),
   which moves the page and the browser's scroll anchoring with it; with one
   threshold (it used to be 8px) that shift flipped the state back and forth
   and the header shook at that point. The gap between the two thresholds is
   wider than the strip, so the shift can never undo the fold. */
const FOLD_AT = 72;
const UNFOLD_AT = 4;
let folded = false;
const isScrolled = () => {
  const y = window.scrollY;
  if (!folded && y > FOLD_AT) folded = true;
  else if (folded && y < UNFOLD_AT) folded = false;
  return folded;
};
const notScrolled = () => false;

/* Public pages, top to bottom: reseller notice, Golafly family strip
   (desktop only), navbar. All three sit in one sticky block; once the page
   scrolls, the family strip folds away smoothly so only the notice and the
   navbar stay pinned. */
function PublicHeader() {
  const scrolled = useSyncExternalStore(subscribeScroll, isScrolled, notScrolled);
  const headerRef = useRef<HTMLElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);

  /* The strip's natural height (0 on phones, where it is hidden), kept in
     --strip-h on the header. While the strip folds, the header's
     margin-bottom grows by exactly the height the strip loses (same duration,
     same easing), so the header's total footprint never changes. The content
     below therefore never moves, the browser never corrects the scroll
     position (scroll anchoring), and nothing fights a slow scroll: that
     correction, frame by frame, was the shake near the end of the fold. */
  useEffect(() => {
    const header = headerRef.current;
    const strip = stripRef.current;
    if (!header || !strip) return;
    const publish = () =>
      header.style.setProperty("--strip-h", `${strip.offsetHeight}px`);
    publish();
    const ro = new ResizeObserver(publish);
    ro.observe(strip);
    return () => ro.disconnect();
  }, []);

  return (
    <header
        ref={headerRef}
        // Under the pinned Black Friday bar while it shows (--bf-bar-h, components/promo/black-friday).
        style={{
          top: "var(--bf-bar-h, 0px)",
          marginBottom: scrolled ? "var(--strip-h, 0px)" : "0px",
        }}
        className={cn(
          "sticky top-0 z-50 border-b border-navbar-border bg-navbar/95 backdrop-blur-md transition-[box-shadow,margin-bottom] duration-300 ease-out motion-reduce:transition-none supports-[backdrop-filter]:bg-navbar/92",
          scrolled && "shadow-[var(--lift-2)]",
        )}
      >
        {/* Reseller notice, always first and always pinned (Google Ads policy). */}
        <ResellerBanner />
        {/* Family strip: folds to zero height on scroll (grid-rows 1fr → 0fr
            animates the real height), and is inert while hidden so its
            links can't be tabbed to. */}
        <div
          inert={scrolled}
          className={cn(
            "grid transition-[grid-template-rows,opacity] duration-300 ease-out motion-reduce:transition-none",
            scrolled ? "grid-rows-[0fr] opacity-0" : "grid-rows-[1fr] opacity-100",
          )}
        >
          <div className="min-h-0 overflow-hidden">
            {/* Measured (natural height, even while folded) for --strip-h. */}
            <div ref={stripRef}>
              <EcosystemBar />
            </div>
          </div>
        </div>
        <div className="page-container">
          <Navbar />
        </div>
      </header>
  );
}

/* Auth screens own the full viewport, like /studio and /admin do. Kept as a
   list rather than a prefix so /dashboard-adjacent marketing pages are never
   caught by accident. */
const FAN_AUTH_PATHS = ["/login", "/register", "/register/player", "/forgot-password", "/reset-password", "/verify-email", "/scouting-camp", "/scouting-camp/thank-you"];

export function ConditionalHeader() {
  const pathname = usePathname();
  // Landing sites (app/lp/[site]) bring their own header inside the page. The
  // segment comes from the route that was actually rendered, so it is "lp"
  // even though the address bar still says "/" (proxy.ts rewrites to it).
  const segment = useSelectedLayoutSegment();
  const onLandingHost = useLandingHost();
  if (segment === "lp") return null;

  // Sanity Studio takes over the full viewport — no marketing chrome.
  if (pathname.startsWith("/studio")) return null;

  // World Football Summit: its own header (Figma "Summit · Header"), and a
  // slim one on its booking steps.
  if (isSummitFlowPath(pathname)) return <SummitBuilderHeader />;
  if (isSummitPath(pathname)) return <SummitHeader />;

  // The admin and scouting dashboards bring their own sidebar shells — no
  // navbar, no footer. Leaving the marketing chrome in place does not just
  // look wrong: both shells are `fixed inset-0`, so a footer left in the
  // document flow adds scroll height behind them and the sidebar stops
  // filling the viewport.
  if (pathname.startsWith("/admin")) return null;
  if (pathname.startsWith("/scout")) return null;

  // Same for the fan dashboard. And the auth screens own the whole viewport
  // deliberately: they already carry the GOLAFLY wordmark, so leaving the
  // navbar in place stacked two brands on top of each other and offered a
  // half-dozen escape routes out of a two-field form.
  // Segment match on /fan and /player (the fan and player dashboards), so a
  // marketing page such as /players keeps its navbar.
  const inAccountShell = ["/fan", "/player"].some(
    p => pathname === p || pathname.startsWith(`${p}/`),
  );
  if (inAccountShell || FAN_AUTH_PATHS.includes(pathname)) return null;

  // VIP booking flow (/vip/<match>/…) brings its own VIP header from
  // app/vip/[match]/layout.tsx. The /vip landing page keeps the site header.
  if (isVipFlowPath(pathname)) return null;

  const isCheckout = CHECKOUT_PATHS.some(p => pathname === p || pathname.startsWith(p + "?"));

  // Every page that sells tickets shows the reseller notice (Google Ads
  // event-ticket policy). On the main site and checkout it lives INSIDE the
  // sticky header, so it stays on screen while scrolling.
  if (isCheckout) return <CheckoutHeader />;

  // Any other page reached on a landing hostname (the cart, a 404 ...): the
  // landing navbar, not the whole site's menu.
  if (onLandingHost) {
    return (
      <>
        <ResellerBanner />
        <LandingHeader />
      </>
    );
  }

  // Black Friday bar (only during the sale): pinned at the very top, with the
  // reseller notice + navbar pinned right under it.
  return (
    <>
      <BlackFridayBar />
      <PublicHeader />
    </>
  );
}
