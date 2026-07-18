"use client"

import * as React from "react"
import { createPortal } from "react-dom"

import { cn } from "@/lib/utils"

type TooltipPosition = "top" | "bottom" | "left" | "right"
type TooltipSize = "sm" | "md" | "lg"

export interface TooltipProps {
  message: string
  position?: TooltipPosition
  size?: TooltipSize
  ariaLabel?: string
  className?: string
  delayMs?: number
  closeDelayMs?: number
}

const sizeStyles: Record<TooltipSize, string> = {
  sm: "h-4 w-4 text-[10px]",
  md: "h-5 w-5 text-xs",
  lg: "h-6 w-6 text-sm",
}

const contentSizeStyles: Record<TooltipSize, string> = {
  sm: "max-w-[200px] text-[11px]",
  md: "max-w-xs text-xs",
  lg: "max-w-sm text-sm",
}

const arrowStyles: Record<TooltipPosition, string> = {
  top: "-bottom-1 left-1/2 -translate-x-1/2 border-b border-r",
  bottom: "-top-1 left-1/2 -translate-x-1/2 border-t border-l",
  left: "-right-1 top-1/2 -translate-y-1/2 border-t border-r",
  right: "-left-1 top-1/2 -translate-y-1/2 border-b border-l",
}

const VIEWPORT_MARGIN = 8
const GAP = 6

function choosePlacement(
  preferred: TooltipPosition,
  trigger: DOMRect,
  tip: { width: number; height: number },
  vw: number,
  vh: number,
): TooltipPosition {
  const fits = (p: TooltipPosition) => {
    if (p === "top") return trigger.top - tip.height - GAP >= VIEWPORT_MARGIN
    if (p === "bottom")
      return trigger.bottom + tip.height + GAP <= vh - VIEWPORT_MARGIN
    if (p === "left")
      return trigger.left - tip.width - GAP >= VIEWPORT_MARGIN
    return trigger.right + tip.width + GAP <= vw - VIEWPORT_MARGIN
  }
  if (fits(preferred)) return preferred
  const opposites: Record<TooltipPosition, TooltipPosition> = {
    top: "bottom",
    bottom: "top",
    left: "right",
    right: "left",
  }
  if (fits(opposites[preferred])) return opposites[preferred]
  const space = (p: TooltipPosition) =>
    p === "top"
      ? trigger.top
      : p === "bottom"
        ? vh - trigger.bottom
        : p === "left"
          ? trigger.left
          : vw - trigger.right
  return (["top", "bottom", "left", "right"] as TooltipPosition[]).sort(
    (a, b) => space(b) - space(a),
  )[0]
}

function getCoords(
  placement: TooltipPosition,
  trigger: DOMRect,
  tip: { width: number; height: number },
) {
  if (placement === "top")
    return {
      top: trigger.top - tip.height - GAP,
      left: trigger.left + trigger.width / 2 - tip.width / 2,
    }
  if (placement === "bottom")
    return {
      top: trigger.bottom + GAP,
      left: trigger.left + trigger.width / 2 - tip.width / 2,
    }
  if (placement === "left")
    return {
      top: trigger.top + trigger.height / 2 - tip.height / 2,
      left: trigger.left - tip.width - GAP,
    }
  return {
    top: trigger.top + trigger.height / 2 - tip.height / 2,
    left: trigger.right + GAP,
  }
}

const Tooltip: React.FC<TooltipProps> = ({
  message,
  position = "top",
  size = "md",
  ariaLabel = "Mais informações",
  className,
  delayMs = 300,
  closeDelayMs = 0,
}) => {
  const reactId = React.useId()
  const tooltipId = `tooltip-${reactId}`

  const triggerRef = React.useRef<HTMLButtonElement>(null)
  const tooltipRef = React.useRef<HTMLDivElement>(null)

  const [mounted, setMounted] = React.useState(false)
  const [open, setOpen] = React.useState(false)
  const [coords, setCoords] = React.useState<{
    top: number
    left: number
    placement: TooltipPosition
  }>({ top: 0, left: 0, placement: position })

  const openTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const closeTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearTimers = () => {
    if (openTimer.current) {
      clearTimeout(openTimer.current)
      openTimer.current = null
    }
    if (closeTimer.current) {
      clearTimeout(closeTimer.current)
      closeTimer.current = null
    }
  }

  const measure = React.useCallback(() => {
    const trigger = triggerRef.current
    const tip = tooltipRef.current
    if (!trigger || !tip) return
    const rect = trigger.getBoundingClientRect()
    const tipRect = tip.getBoundingClientRect()
    const placement = choosePlacement(
      position,
      rect,
      { width: tipRect.width, height: tipRect.height },
      window.innerWidth,
      window.innerHeight,
    )
    const { top, left } = getCoords(placement, rect, {
      width: tipRect.width,
      height: tipRect.height,
    })
    setCoords({ top, left, placement })
  }, [position])

  const handleOpen = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current)
      closeTimer.current = null
    }
    if (openTimer.current || open) return
    openTimer.current = setTimeout(() => {
      openTimer.current = null
      setOpen(true)
    }, delayMs)
  }

  const handleClose = () => {
    if (openTimer.current) {
      clearTimeout(openTimer.current)
      openTimer.current = null
    }
    if (closeTimer.current || !open) return
    closeTimer.current = setTimeout(() => {
      closeTimer.current = null
      setOpen(false)
    }, closeDelayMs)
  }

  React.useEffect(() => {
    setMounted(true)
    return () => clearTimers()
  }, [])

  React.useEffect(() => {
    if (!open) return

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    const onScroll = () => setOpen(false)
    const onResize = () => setOpen(false)
    const onMouseDown = (e: MouseEvent) => {
      const t = e.target as Node
      if (triggerRef.current?.contains(t)) return
      if (tooltipRef.current?.contains(t)) return
      setOpen(false)
    }

    window.addEventListener("keydown", onKey)
    window.addEventListener("scroll", onScroll, { capture: true, passive: true })
    window.addEventListener("resize", onResize)
    document.addEventListener("mousedown", onMouseDown)

    return () => {
      window.removeEventListener("keydown", onKey)
      window.removeEventListener("scroll", onScroll, true)
      window.removeEventListener("resize", onResize)
      document.removeEventListener("mousedown", onMouseDown)
    }
  }, [open])

  React.useEffect(() => {
    if (open) measure()
  }, [open, measure])

  return (
    <span className={cn("relative inline-flex", className)}>
      <button
        ref={triggerRef}
        type="button"
        aria-label={ariaLabel}
        aria-describedby={open ? tooltipId : undefined}
        onMouseEnter={handleOpen}
        onMouseLeave={handleClose}
        onFocus={handleOpen}
        onBlur={handleClose}
        className={cn(
          "inline-flex items-center justify-center rounded-full border bg-background text-muted-foreground",
          "transition-colors hover:bg-accent hover:text-accent-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          sizeStyles[size],
        )}
      >
        <span aria-hidden="true" className="font-semibold leading-none">
          ?
        </span>
      </button>

      {mounted &&
        createPortal(
          <div
            ref={tooltipRef}
            id={tooltipId}
            role="tooltip"
            aria-hidden={!open}
            data-state={open ? "open" : "closed"}
            data-placement={coords.placement}
            style={{
              position: "fixed",
              top: coords.top,
              left: coords.left,
              visibility: open ? "visible" : "hidden",
            }}
            className={cn(
              "z-50 rounded-md border bg-popover px-3 py-1.5 text-popover-foreground shadow-md",
              "pointer-events-none",
              "transition-opacity duration-150",
              open ? "opacity-100" : "opacity-0",
              contentSizeStyles[size],
            )}
          >
            {message}
            <span
              aria-hidden="true"
              className={cn(
                "absolute h-2 w-2 rotate-45 border bg-popover",
                arrowStyles[coords.placement],
              )}
            />
          </div>,
          document.body,
        )}
    </span>
  )
}

Tooltip.displayName = "Tooltip"

const InfoTooltip = Tooltip

export { Tooltip, InfoTooltip }
