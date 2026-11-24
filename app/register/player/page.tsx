import type { Metadata } from "next";
import PlayerRegistrationForm from "@/components/register-player/player-registration-form";
import { NO_INDEX } from '@/lib/seo'

export const metadata: Metadata = {
  robots: NO_INDEX,
  title: "Register as a Player | Golafly",
  description:
    "Build your football profile, choose a Golafly program and take your spot in your position.",
};

export default function RegisterPlayerPage() {
  return <PlayerRegistrationForm />;
}
