import { Metadata } from "next";
import PaymentCancelledClient from "./client";
import { NO_INDEX } from '@/lib/seo'

export const metadata: Metadata = {
  robots: NO_INDEX,
  title: "Payment Cancelled | Golafly Academy",
  description: "The payment for your Golafly Academy application was cancelled.",
};

export default function PaymentCancelledPage() {
  return <PaymentCancelledClient />;
}
