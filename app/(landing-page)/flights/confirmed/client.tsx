"use client";

import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import { StepProgress } from "@/components/checkout/step-progress";
import { BOOKING_REF, BOOKING_ROWS, TOTAL_PAID } from "@/store/matchday";

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.3 } },
};

const fadeItem: Variants = {
  hidden: { opacity: 0, y: 16 },
  show:   { opacity: 1, y: 0 },
};

export function ConfirmedClient() {
  return (
    <div className="min-h-screen bg-background">
      <div className="page-container py-10 sm:py-12">
        <StepProgress currentStep={4} />

        <motion.div
          className="mx-auto mt-10 max-w-[600px] space-y-6 text-center sm:mt-12 sm:space-y-8"
          variants={container}
          initial="hidden"
          animate="show"
        >
          {/* Success icon */}
          <motion.div
            className="flex justify-center"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 280, damping: 18 }}
          >
            <motion.div
              className="flex size-16 items-center justify-center rounded-[50px] border-2 border-primary/55 bg-primary/18 text-3xl shadow-[0_0_45px_rgba(183,255,0,0.2),0_0_18px_rgba(183,255,0,0.45)] sm:size-20 sm:text-[34px]"
              animate={{
                boxShadow: [
                  "0 0 20px rgba(183,255,0,0.2),0 0 10px rgba(183,255,0,0.3)",
                  "0 0 50px rgba(183,255,0,0.35),0 0 22px rgba(183,255,0,0.55)",
                  "0 0 20px rgba(183,255,0,0.2),0 0 10px rgba(183,255,0,0.3)",
                ],
              }}
              transition={{ repeat: Infinity, duration: 2.4, ease: "easeInOut" }}
            >
              ✓
            </motion.div>
          </motion.div>

          <motion.div className="space-y-2" variants={fadeItem} transition={{ duration: 0.42 }}>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-[26px]">
              You&apos;re Going to Barcelona!
            </h1>
            <p className="text-[13px] text-muted-foreground">
              Booking confirmed · Confirmation sent to your email
            </p>
          </motion.div>

          <motion.div className="space-y-1" variants={fadeItem} transition={{ duration: 0.42 }}>
            <p className="font-mono text-[10px] tracking-[2px] text-muted-foreground">Booking Reference</p>
            <p className="font-mono text-xl font-bold tracking-[1.2px] text-primary sm:text-[24px]">
              {BOOKING_REF}
            </p>
          </motion.div>

          <motion.div
            className="overflow-hidden rounded-xl border border-border bg-card text-left text-[12px]"
            variants={fadeItem}
            transition={{ duration: 0.42 }}
          >
            {BOOKING_ROWS.map(({ label, value }, i) => (
              <motion.div
                key={label}
                className="flex items-center justify-between border-b border-border px-4 py-[9px]"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.55 + i * 0.06, duration: 0.35 }}
              >
                <span className="text-muted-foreground">{label}</span>
                <span className="text-right font-medium text-foreground">{value}</span>
              </motion.div>
            ))}
            <motion.div
              className="flex items-center justify-between px-4 py-[9px]"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.55 + BOOKING_ROWS.length * 0.06, duration: 0.35 }}
            >
              <span className="text-muted-foreground">Total Paid</span>
              <span className="font-bold text-primary">{TOTAL_PAID}</span>
            </motion.div>
          </motion.div>

          <motion.div
            className="flex flex-col items-center justify-center gap-3 sm:flex-row"
            variants={fadeItem}
            transition={{ duration: 0.42 }}
          >
            <motion.button
              type="button"
              className="w-full rounded-full bg-primary px-6 py-2.5 text-[13px] font-bold text-primary-foreground shadow-[0_0_12px_rgba(183,255,0,0.4)] transition-all hover:shadow-[0_0_20px_rgba(183,255,0,0.5)] sm:w-auto"
              whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
            >
              Download E-Tickets
            </motion.button>
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
              <Link href="/" className="block rounded-full border border-primary/35 px-6 py-2.5 text-center text-[13px] font-bold text-primary transition-all hover:bg-primary/10">
                Back to Home
              </Link>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
