import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { CheckoutClient } from "./client";
import { NO_INDEX } from '@/lib/seo'

export const metadata: Metadata = {
  robots: NO_INDEX,
  title: "Checkout | Golafly",
  description: "Pay for one product now, or for everything in your cart.",
};

/**
 * `?offerId=` is express checkout for a single flight (no cart).
 * Any other visit is the unified cart checkout on /builder/pay.
 */
export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const offerId = typeof params.offerId === "string" ? params.offerId : undefined;

  if (offerId) {
    return (
      <Suspense>
        <CheckoutClient />
      </Suspense>
    );
  }

  const query = new URLSearchParams();
  const match = typeof params.match === "string" ? params.match : undefined;
  if (match) query.set("match", match);

  const target = query.toString() ? `/builder/pay?${query}` : "/builder/pay";
  redirect(target);
}
