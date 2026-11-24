"use client";

import { usePathname, useSelectedLayoutSegment } from "next/navigation";
import { Footer } from "@/components/footer";
import { LandingFooter } from "@/components/landing/landing-footer";
import { useLandingHost } from "@/lib/site-runtime";
import { isVipFlowPath } from "@/features/vip/routes";
import { isSummitFlowPath, isSummitPath } from "@/features/summit/routes";
import { SummitFooter } from "@/components/summit/footer";

/* Mirrors ConditionalHeader: the two surfaces that own their whole viewport
   get no marketing chrome at either end of the page. */
const FAN_AUTH_PATHS = ["/login", "/register", "/register/player", "/forgot-password", "/reset-password", "/verify-email", "/scouting-camp", "/scouting-camp/thank-you"];

export function ConditionalFooter() {
  const pathname = usePathname();
  const segment = useSelectedLayoutSegment();
  const onLandingHost = useLandingHost();

  // The landing page renders its own footer inside the page.
  if (segment === "lp") return null;

  if (pathname.startsWith("/studio")) return null;
  // The summit's booking steps end with their own one-line footer.
  if (isSummitFlowPath(pathname)) return null;
  // Its landing page: the site footer in the summit's (light) colours.
  if (isSummitPath(pathname)) return <SummitFooter />;
  if (pathname.startsWith("/admin")) return null;
  if (pathname.startsWith("/scout")) return null;
  /* Fan and player dashboards. Segment match, so a marketing page such as
     /players keeps its footer. */
  if (["/fan", "/player"].some(p => pathname === p || pathname.startsWith(`${p}/`))) return null;
  if (FAN_AUTH_PATHS.includes(pathname)) return null;
  // VIP booking flow brings its own VIP footer (app/vip/[match]/layout.tsx).
  if (isVipFlowPath(pathname)) return null;

  // Booking pages on a landing hostname: the short footer, not the whole
  // site's link list (those links would leave the booking).
  if (onLandingHost) return <LandingFooter />;

  return <Footer />;
}
