import { useEffect } from "react";

const BLOCKED_POINTER_EVENTS = [
  "contextmenu",
  "dragstart",
  "dragover",
  "drop",
  "selectstart",
] as const;

interface UseContextMenuGuardOptions {
  enabled: boolean;
}

export function useContextMenuGuard({ enabled }: UseContextMenuGuardOptions) {
  useEffect(() => {
    if (!enabled) {
      return;
    }

    const preventPointerAction = (event: Event) => {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      if (event instanceof DragEvent && event.dataTransfer) {
        event.dataTransfer.dropEffect = "none";
      }

      return false;
    };

    BLOCKED_POINTER_EVENTS.forEach((eventName) => {
      window.addEventListener(eventName, preventPointerAction, true);
      document.addEventListener(eventName, preventPointerAction, true);
    });

    return () => {
      BLOCKED_POINTER_EVENTS.forEach((eventName) => {
        window.removeEventListener(eventName, preventPointerAction, true);
        document.removeEventListener(eventName, preventPointerAction, true);
      });
    };
  }, [enabled]);
}
