import type { Metadata } from "next";
import { ScoutingCampLanding } from "@/components/scouting-camp/landing";
import { campFontClass } from "@/components/scouting-camp/fonts";
/* The Golafly Scouting Camp crest — the same file the footer and the
   homepage "Golafly family" band show. (BRAND has no `logo` field, which
   is why the header logo used to render empty.) */
const CAMP_LOGO = "/brand/golafly-scouting-camp.png";

/* Google Ads landing page — noindex and not linked from the site, per the
   client's brief. */
export const metadata: Metadata = {
  title: "Golafly Scouting Camp | 10–19 Jan 2027 | Register",
  description:
    "Golafly Scouting Camp, 10–19 January 2027. Train, play and get evaluated by professional scouts. Register now.",
  robots: { index: false, follow: false },
};

export default function ScoutingCampPage() {
  return (
    <ScoutingCampLanding
      fontClass={campFontClass}
      thankYouPath="/scouting-camp/thank-you"
      logoSrc={CAMP_LOGO}
    />
  );
}
