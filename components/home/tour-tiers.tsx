"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { TOUR_TIERS } from "@/store/matchday";
import { useCart } from "@/features/cart/context";
import { SectionHead } from "./section-head";

export function TourTiers() {
  const { addItem } = useCart();

  return (
    <section className="space-y-10 sm:space-y-12">
      <SectionHead
        eyebrow="Choose your access"
        title={
          <>
            Three ways to <span className="text-primary">tour</span>
          </>
        }
        subtitle="From a classic self-guided walk to a private tour led by a club legend — pick the level of access that suits your trip."
      />

      <div className="grid grid-cols-1 gap-5 md:grid-cols-3 lg:gap-6">
        {TOUR_TIERS.map((tier, i) => (
          <motion.div
            key={tier.name}
            className={cn(
              "relative flex flex-col rounded-2xl border bg-card p-6 sm:p-7",
              tier.featured
                ? "border-primary/60 shadow-lg shadow-primary/10 md:-translate-y-3"
                : "border-border",
            )}
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: tier.featured ? -12 : 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.45, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="text-[10px] font-mono uppercase tracking-widest text-primary">{tier.name}</p>

            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-4xl font-bold text-foreground">€{tier.price}</span>
              <span className="text-xs font-mono text-muted-foreground">from / person</span>
            </div>

            <ul className="mt-6 flex-1 space-y-3">
              {tier.features.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" strokeWidth={2.5} />
                  <span>{f}</span>
                </li>
              ))}
            </ul>

            <motion.button
              type="button"
              onClick={() =>
                addItem({
                  key: `tier:${tier.name.toLowerCase()}`,
                  type: "tier",
                  name: `${tier.name} Stadium Tour`,
                  detail: `Access tier · ${tier.features[0]}`,
                  price: tier.price,
                })
              }
              className={cn(
                "mt-7 rounded-full py-3 text-sm font-bold transition-all",
                tier.featured
                  ? "bg-primary text-primary-foreground shadow-md hover:shadow-[0_0_18px_var(--brand-glow)]"
                  : "border border-border text-foreground hover:border-primary/50 hover:text-primary",
              )}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              Select {tier.name}
            </motion.button>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
