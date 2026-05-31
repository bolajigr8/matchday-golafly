import type { Metadata } from "next";
import { ConfirmedClient } from "./client";

export const metadata: Metadata = {
  title: "Booking Confirmed! | Matchday Builder",
  description: "Your football matchday experience is booked. Download your e-tickets.",
};

export default function ConfirmedPage() {
  return <ConfirmedClient />;
}
