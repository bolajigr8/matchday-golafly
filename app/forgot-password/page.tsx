import type { Metadata } from "next";
import ForgotPasswordClient from "./client";
import { NO_INDEX } from '@/lib/seo'

export const metadata: Metadata = {
  robots: NO_INDEX,
  title: "Reset your password | Golafly",
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordClient />;
}
