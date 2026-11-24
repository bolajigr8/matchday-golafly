"use client";

import { motion } from "framer-motion";
import { Landmark, Plus } from "lucide-react";
import type { StadiumTour } from "@/store/matchday";
import { useCart } from "@/features/cart/context";

export function TourCard({ tour, index = 0 }: { tour: StadiumTour; index?: number }) {
  const { addItem } = useCart();

  const addTour = () =>
    addItem({
      key: `tour:${tour.id}`,
      type: "tour",
      name: `${tour.stadium} Tour`,
      detail: `${tour.club} · ${tour.city} · ${tour.duration}`,
      price: tour.price,
      image: tour.image || undefined,
      href: "/#stadium-tours",
    });

  return (
    <motion.article
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card"
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.45, delay: (index % 3) * 0.07, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4 }}
    >
      {/* Media */}
      <div className="relative h-44 w-full overflow-hidden sm:h-48">
        {tour.image ? (
          <motion.img
            src={tour.image}
            alt={tour.stadium}
            className="h-full w-full object-cover"
            whileHover={{ scale: 1.06 }}
            transition={{ duration: 0.45 }}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-neutral-900 to-neutral-800">
            <Landmark className="h-10 w-10 text-white/15" strokeWidth={1.25} />
          </div>
        )}

        {/* Scrim for chip legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/5 to-black/35" />

        {/* Location chip */}
        <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-black/45 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
          <span aria-hidden>{tour.flag}</span>
          {tour.city}
        </span>

        {/* Rating chip */}
        <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-black/45 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm">
          <span className="text-primary">★</span>
          {tour.rating}
        </span>

        {/* Badge */}
        {tour.badge && (
          <span className="absolute bottom-3 left-3 rounded-full bg-primary px-2.5 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-primary-foreground">
            {tour.badge}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-4 p-5">
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-foreground">{tour.stadium}</h3>
          <p className="text-xs font-mono tracking-wide text-muted-foreground">{tour.club}</p>
        </div>

        <ul className="space-y-2">
          {tour.features.map((f) => (
            <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
              <span className="mt-px font-bold text-primary">›</span>
              <span>{f}</span>
            </li>
          ))}
        </ul>

        {/* Foot */}
        <div className="mt-auto flex items-end justify-between gap-3 pt-2">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
              From · {tour.duration}
            </p>
            <p className="text-foreground">
              <span className="text-2xl font-bold">€{tour.price}</span>
              <span className="ml-1 text-xs text-muted-foreground">/ person</span>
            </p>
          </div>
          <motion.button
            type="button"
            onClick={addTour}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground shadow-md transition-shadow hover:shadow-[0_0_16px_var(--brand-glow)]"
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
            Book Tour
          </motion.button>
        </div>
      </div>
    </motion.article>
  );
}
