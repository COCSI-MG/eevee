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
  allowedDragAreaSelector?: string;
  allowedDragMimeType?: string;
}

export function useContextMenuGuard({
  enabled,
  allowedDragAreaSelector,
  allowedDragMimeType
}: UseContextMenuGuardOptions) {
  useEffect(() => {
    if (!enabled) {
      return;
    }

    const isAllowedInternalDrag = (event: Event) => {
      if (
        !(event instanceof DragEvent) ||
        !allowedDragAreaSelector ||
        !allowedDragMimeType ||
        !(event.target instanceof Element) ||
        !event.target.closest(allowedDragAreaSelector)
      ) return false

      if (event.type === "dragstart") return true

      return Array.from(event.dataTransfer?.types ?? []).includes(allowedDragMimeType)
    };

    const preventPointerAction = (event: Event) => {
      if (isAllowedInternalDrag(event)) return true

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
  }, [allowedDragAreaSelector, allowedDragMimeType, enabled]);
}
