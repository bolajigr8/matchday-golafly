"use client";

import { useEffect } from "react";

import { ShoppingCart } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { isBuildingView } from "@/features/vip/contract";
import { useVipPackageQuery } from "@/features/vip/hooks";
import { clearVipSession, useVipSession } from "@/features/vip/session";
import { isVipSwitchedOff } from "@/features/vip/errors";
import { useCart } from "@/features/cart/context";

/* Navbar cart trigger: icon + live count badge with a pop animation,
   plus a neon pulse ring the moment an item is added. */
export function CartButton({ className }: { className?: string }) {
  const { count: siteCount, openCart, justAddedKey, hydrated } = useCart();
  /* A VIP package lives in the server basket but not in the drawer's item
     list, so its lines are added to the badge here. */
  const vipSession = useVipSession();
  const vipQ = useVipPackageQuery(vipSession?.packageId ?? null);
  const vipPkg = vipQ.data;
  /* A package the backend no longer has (404: removed, or the basket was
     cleared elsewhere) is forgotten everywhere, and counts nothing. Not
     while VIP is switched off (an empty 404 on every VIP route): the
     package is still in the basket for when VIP comes back. */
  const vipGone = vipQ.error?.status === 404 && !isVipSwitchedOff(vipQ.error);
  useEffect(() => {
    if (vipGone) clearVipSession();
  }, [vipGone]);
  const vipCount =
    !vipSession || vipQ.isError ? 0 : vipPkg && isBuildingView(vipPkg) ? vipPkg.items.length : vipPkg ? 0 : 1;
  const count = siteCount + vipCount;

  return (
    <motion.button
      type="button"
      onClick={openCart}
      aria-label={`Open cart${count > 0 ? `, ${count} item${count === 1 ? "" : "s"}` : ""}`}
      className={cn(
        "relative inline-flex items-center justify-center rounded-full border border-navbar-border p-2 transition-all hover:bg-black/5 dark:hover:bg-white/5",
        className,
      )}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.92 }}
    >
      <ShoppingCart className="size-4" strokeWidth={1.75} />

      {/* Neon pulse ring on add */}
      <AnimatePresence>
        {justAddedKey && (
          <motion.span
            key={justAddedKey}
            className="pointer-events-none absolute inset-0 rounded-full ring-2 ring-primary"
            initial={{ opacity: 0.8, scale: 0.9 }}
            animate={{ opacity: 0, scale: 1.9 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          />
        )}
      </AnimatePresence>

      {/* Count badge */}
      <AnimatePresence>
        {hydrated && count > 0 && (
          <motion.span
            key={count}
            className="absolute -right-1.5 -top-1.5 flex min-w-[18px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold leading-none text-primary-foreground shadow-[0_0_10px_var(--brand-glow)]"
            initial={{ scale: 0, y: -4 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0 }}
            transition={{ type: "spring", stiffness: 600, damping: 22 }}
          >
            {count}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
