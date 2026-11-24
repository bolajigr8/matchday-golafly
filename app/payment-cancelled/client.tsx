"use client";

import PaymentResult from "@/components/payment/payment-result";

export default function PaymentCancelledClient() {
  return (
    <section className="bg-lp-bg min-h-[80vh] py-20">
      <PaymentResult
        type="cancelled"
        title="Payment Cancelled"
        message="Your payment process was cancelled. No charges have been made."
        actionText="Back to Home"
        actionHref="/"
      />
    </section>
  );
}
