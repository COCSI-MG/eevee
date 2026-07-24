"use client"

import * as TooltipPrimitive from "@radix-ui/react-tooltip"

import { cn } from "@/lib/utils"

export interface TooltipProps {
  message: string
}

const Tooltip: React.FC<TooltipProps> = ({ message }) => (
  <TooltipPrimitive.Root>
    <TooltipPrimitive.Trigger
      type="button"
      aria-label="Mais informações"
      className={cn(
        "inline-flex h-5 w-5 items-center justify-center rounded-full border bg-background text-xs text-muted-foreground",
        "transition-colors hover:bg-accent hover:text-accent-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      )}
    >
      <span aria-hidden="true" className="font-semibold leading-none">?</span>
    </TooltipPrimitive.Trigger>
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        className={cn(
          "z-50 max-w-xs rounded-md border bg-popover px-3 py-1.5 text-xs text-popover-foreground shadow-md",
          "data-[state=delayed-open]:animate-in data-[state=closed]:animate-out",
          "data-[state=closed]:fade-out-0 data-[state=delayed-open]:fade-in-0",
        )}
      >
        {message}
        <TooltipPrimitive.Arrow className="fill-popover" />
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  </TooltipPrimitive.Root>
)
Tooltip.displayName = "Tooltip"

const InfoTooltip = Tooltip

export { Tooltip, InfoTooltip }
