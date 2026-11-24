import type { Metadata } from "next";
import { ScoutingCampThankYou } from "@/components/scouting-camp/thank-you";
import { campFontClass } from "@/components/scouting-camp/fonts";

export const metadata: Metadata = {
  title: "You're on the list | Golafly Scouting Camp",
  robots: { index: false, follow: false },
};

/* Google Ads conversion page. When the client provides their conversion tag
   (AW-XXXXXXXXX/label), fire it here — e.g. with next/script. */
export default function ScoutingCampThankYouPage() {
  return <ScoutingCampThankYou fontClass={campFontClass} backPath="/scouting-camp" />;
}
