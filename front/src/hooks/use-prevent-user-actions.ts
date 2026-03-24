import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function usePreventUserActions() {
  // This hook is used to prevent user actions like right-click, keyboard shortcuts, etc.
  const { back } = useRouter();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const detectDevTools = () => {
    const t0 = Date.now();
    eval("debugger"); // This will trigger the devtools to open
    const t1 = Date.now();
    console.log(`Devtools opened in ${t1 - t0}ms`);
    if (t1 - t0 > 100) {
      console.warn("Devtools detected!");
      // Redirect to the previous page or show a warning
      back();
      alert("Devtools detected! Please close them to continue.");
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.location.href.includes("localhost")) return;

    const preventDefaultAction = (e: Event) => {
      e.preventDefault();
      return false;
    };

    const preventKeyboardShortcuts = (e: KeyboardEvent) => {
      if (
        (e.ctrlKey && e.shiftKey && e.key === "I") ||
        e.key === "F12" ||
        (e.ctrlKey && e.key === "u") ||
        (e.ctrlKey && e.key === "s") ||
        (e.ctrlKey && e.key === "a") ||
        (e.ctrlKey && e.key === "c") ||
        (e.ctrlKey && e.key === "v") ||
        (e.ctrlKey && e.key === "x")
      ) {
        e.preventDefault();
        alert(
          "Ação não permitida. Por favor, não use atalhos de teclado enquanto estiver no editor."
        );
        return false;
      }
    };

    // Prevent context menu (right-click)
    document.addEventListener("contextmenu", preventDefaultAction);
    // Prevent keyboard shortcuts
    document.addEventListener("keydown", preventKeyboardShortcuts);

    const devToolsCheckInterval = setInterval(detectDevTools, 5000);

    return () => {
      console.log("Cleaning up event listeners");
      document.removeEventListener("contextmenu", preventDefaultAction);
      document.removeEventListener("keydown", preventKeyboardShortcuts);
      clearInterval(devToolsCheckInterval);
    };
  }, [back, detectDevTools]);
}
