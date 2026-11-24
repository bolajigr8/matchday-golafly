"use client";

import { useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { makeQueryClient } from "@/lib/query-client";
import { CartProvider } from "@/features/cart/context";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { TicketQuantityDialog } from "@/components/tickets/ticket-quantity-dialog";
import { LandingReturnSync } from "@/components/landing-return-sync";
import { PwaRegister } from "@/components/pwa-register";
import { PwaInstallPrompt } from "@/components/pwa-install-prompt";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(makeQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      <CartProvider>
        {children}
        <CartDrawer />
        <TicketQuantityDialog />
        <LandingReturnSync />
        <PwaRegister />
        <PwaInstallPrompt />
      </CartProvider>
      <Toaster position="top-right" richColors closeButton />
    </QueryClientProvider>
  );
}
