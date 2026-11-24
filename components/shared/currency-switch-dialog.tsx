"use client";

import { Coins } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

/* Replaces the old `window.confirm(...)` the currency switcher used to
 * fire when the cart already holds items — a native browser confirm looks
 * jarring next to the rest of the app's UI and gives no room to show the
 * currencies involved. This is a small, on-brand dialog for that one
 * decision: "prices are about to be re-quoted, continue?" */

interface CurrencySwitchDialogProps {
  open: boolean;
  fromLabel: string;
  toLabel: string;
  /** Number of items currently in the cart — this dialog should only ever
   *  be opened when this is > 0, but we still say the actual count rather
   *  than a generic "your cart has items" so the message can't read as
   *  boilerplate to someone who (correctly) has nothing in their cart. */
  itemCount: number;
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
}

export function CurrencySwitchDialog({
  open,
  fromLabel,
  toLabel,
  itemCount,
  onConfirm,
  onOpenChange,
}: CurrencySwitchDialogProps) {
  const itemWord = itemCount === 1 ? "item" : "items";
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[90%] max-w-[90%] rounded-2xl sm:w-full sm:max-w-[380px]">
        <DialogHeader>
          <div className="mb-1 flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Coins className="size-4.5" strokeWidth={2} />
          </div>
          <DialogTitle>Switch to {toLabel}?</DialogTitle>
          <DialogDescription>
            You have {itemCount} {itemWord} in your cart priced in{" "}
            {fromLabel}. Switching will re-quote {itemCount === 1 ? "it" : "them"} to{" "}
            {toLabel} at the current exchange rate.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="sm:flex-1"
          >
            Keep {fromLabel}
          </Button>
          <Button
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
            className="sm:flex-1"
          >
            Switch to {toLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
