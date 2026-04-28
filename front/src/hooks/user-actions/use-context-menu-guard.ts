import { useEffect } from "react";

export function useContextMenuGuard() {
  useEffect(() => {
    const preventContextMenu = (event: Event) => {
      event.preventDefault();
      return false;
    };

    document.addEventListener("contextmenu", preventContextMenu);

    return () => {
      document.removeEventListener("contextmenu", preventContextMenu);
    };
  }, []);
}
