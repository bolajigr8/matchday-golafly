"use client"

import * as React from "react"
import { Info } from "lucide-react"
import { Tooltip as TooltipPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

/* z-[100]: the bubble is portaled to <body>, so it has to sit above the
   cart drawer (z-[61]) and the seat-map fullscreen (z-[70]).

   Radix tooltip, styled from the design tokens. Each Tooltip carries its own
   Provider so a single one can be dropped anywhere without wiring a provider
   at the root. */

function TooltipProvider({
  delayDuration = 150,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Provider>) {
  return <TooltipPrimitive.Provider delayDuration={delayDuration} {...props} />
}

function Tooltip(props: React.ComponentProps<typeof TooltipPrimitive.Root>) {
  return (
    <TooltipProvider>
      <TooltipPrimitive.Root data-slot="tooltip" {...props} />
    </TooltipProvider>
  )
}

function TooltipTrigger(props: React.ComponentProps<typeof TooltipPrimitive.Trigger>) {
  return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />
}

function TooltipContent({
  className,
  sideOffset = 6,
  children,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Content>) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        data-slot="tooltip-content"
        sideOffset={sideOffset}
        className={cn(
          "z-[100] max-w-[260px] rounded-md bg-foreground px-2.5 py-2 text-[11px] font-normal normal-case leading-snug tracking-normal text-background shadow-[var(--lift-1)] animate-in fade-in-0 zoom-in-95",
          className,
        )}
        {...props}
      >
        {children}
        <TooltipPrimitive.Arrow className="fill-foreground" />
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  )
}

/** A small "i" that explains the label beside it. A real button, so it is
 *  reachable by keyboard and the explanation is read out on focus. */
function InfoTip({
  label,
  children,
  className,
}: {
  /** What the tip explains — becomes the button's accessible name. */
  label: string
  children: React.ReactNode
  className?: string
}) {
  /* Controlled so a tap or click opens it too: Radix alone only reacts to
     hover and keyboard focus, which phones never fire. */
  const [open, setOpen] = React.useState(false)
  return (
    <Tooltip open={open} onOpenChange={setOpen}>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={`What is ${label}?`}
          className={cn(
            "inline-flex size-3.5 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground focus-visible:text-foreground focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--brand-edge)]",
            className,
          )}
        >
          <Info className="size-3.5" />
        </button>
      </TooltipTrigger>
      <TooltipContent>{children}</TooltipContent>
    </Tooltip>
  )
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider, InfoTip }
