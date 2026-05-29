import type { Metadata } from "next";
import { CheckoutClient } from "./client";

export const metadata: Metadata = {
  title: "Checkout | Matchday Builder",
  description: "Complete your matchday booking — contact info, payment, and confirmation.",
};

export default function CheckoutPage() {
  return <CheckoutClient />;
}
