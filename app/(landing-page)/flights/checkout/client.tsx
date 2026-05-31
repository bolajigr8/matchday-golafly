"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { StepProgress } from "@/components/checkout/step-progress";
import { ORDER_ITEMS } from "@/store/matchday";

const TOTAL = ORDER_ITEMS.reduce((s, i) => s + i.priceNum, 0);

function FormField({ label, placeholder, defaultValue, type = "text", className }: {
  label: string; placeholder?: string; defaultValue?: string; type?: string; className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label className="block font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
        {label}
      </label>
      <motion.input
        type={type}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="w-full rounded-lg border border-border bg-muted px-3 py-2.5 text-[13px] text-foreground placeholder:text-muted-foreground/60 outline-none transition-all focus:border-primary/50 focus:ring-1 focus:ring-primary/30"
        whileFocus={{ scale: 1.01 }}
        transition={{ duration: 0.15 }}
      />
    </div>
  );
}

export function CheckoutClient() {
  return (
    <div className="min-h-screen bg-background">
      <div className="page-container py-10 sm:py-12">
        <StepProgress currentStep={3} />

        <motion.div
          className="mb-6 mt-6 sm:mb-8 sm:mt-8"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.4 }}
        >
          <p className="mb-1 font-mono text-[10px] tracking-[2px] text-primary">Step 3 of 4</p>
          <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-[22px]">Checkout</h1>
        </motion.div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
          {/* ── Form ── */}
          <div className="space-y-6 sm:space-y-8">
            {/* Contact */}
            <motion.fieldset
              className="space-y-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.14, duration: 0.45 }}
            >
              <legend className="mb-3 text-[13px] font-bold text-foreground sm:mb-4">Contact Information</legend>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <FormField label="First Name" defaultValue="Jennifer" />
                <FormField label="Last Name" defaultValue="Hurtado" />
                <FormField label="Email" type="email" defaultValue="jennifer@example.com" />
                <FormField label="Phone" type="tel" placeholder="+1 000 000 0000" />
                <FormField label="Nationality / Passport Country" placeholder="e.g. British, Spanish, Colombian…" className="sm:col-span-2" />
              </div>
            </motion.fieldset>

            {/* Payment */}
            <motion.fieldset
              className="space-y-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.22, duration: 0.45 }}
            >
              <legend className="mb-3 text-[13px] font-bold text-foreground sm:mb-4">Payment Details</legend>
              <div className="space-y-1.5">
                <label className="block font-mono text-[9px] uppercase tracking-wider text-muted-foreground">Card Number</label>
                <div className="flex items-center gap-3 rounded-lg border border-border bg-muted px-3 py-2.5">
                  <span className="text-base leading-none">💳</span>
                  <span className="font-mono text-[13px] tracking-wide text-foreground">•••• •••• •••• 4242</span>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <FormField label="Expiry Date" defaultValue="12 / 28" />
                <FormField label="CVC" placeholder="•••" />
                <FormField label="Name on Card" defaultValue="JENNIFER HURTADO" />
                <FormField label="Billing Country" defaultValue="Colombia" />
              </div>
              <p className="text-[10px] text-muted-foreground">
                🔒 Secured by Stripe · SSL encrypted · PCI DSS compliant · 3D Secure
              </p>
            </motion.fieldset>

            {/* Actions */}
            <motion.div
              className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
            >
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                {/* ✅ Updated: /extras → /flights/extras */}
                <Link href="/flights/extras" className="block rounded-full border border-primary/35 px-6 py-2.5 text-center text-[13px] font-bold text-primary transition-all hover:bg-primary/10">
                  Back
                </Link>
              </motion.div>
              <motion.div className="flex-1" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                {/* ✅ Updated: /confirmed → /flights/confirmed */}
                <Link href="/flights/confirmed" className="block w-full rounded-full bg-primary px-6 py-2.5 text-center text-[14px] font-bold text-primary-foreground shadow-[0_0_12px_rgba(183,255,0,0.4)] transition-all hover:shadow-[0_0_25px_rgba(183,255,0,0.5)]">
                  Complete Purchase — €{TOTAL.toLocaleString("de-DE")}
                </Link>
              </motion.div>
            </motion.div>
          </div>

          {/* ── Order summary ── */}
          <motion.div
            className="lg:sticky lg:top-6 lg:self-start"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.18, duration: 0.5 }}
          >
            <div className="rounded-xl border border-border bg-card p-4">
              <h3 className="mb-4 text-[13px] font-bold text-foreground">Order Summary</h3>
              {ORDER_ITEMS.map((item, i) => (
                <motion.div
                  key={item.id}
                  className="border-b border-border py-3"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.25 + i * 0.08, duration: 0.35 }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-[12px] font-medium text-foreground">{item.label}</p>
                    <p className="shrink-0 text-[12px] font-bold text-primary">{item.price}</p>
                  </div>
                  <p className="text-[10px] text-muted-foreground">{item.detail}</p>
                </motion.div>
              ))}
              <div className="flex items-center justify-between border-t border-border pt-4">
                <span className="font-mono text-[11px] tracking-wide text-muted-foreground">Total</span>
                <span className="text-[22px] font-bold text-foreground">€{TOTAL.toLocaleString("de-DE")}</span>
              </div>
              <div className="mt-3 rounded-lg bg-muted p-3">
                <p className="text-[10px] leading-relaxed text-muted-foreground">
                  Free cancellation until 3 days before match · E-tickets by email · All taxes included
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
