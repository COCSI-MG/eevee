"use client";

import { useEffect, useState } from "react";

export function useDelayedVisibility(active: boolean, delayMs: number): boolean {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!active) {
      setIsVisible(false);
      return;
    }

    const timeout = setTimeout(() => setIsVisible(true), delayMs);
    return () => clearTimeout(timeout);
  }, [active, delayMs]);

  return isVisible;
}
