import { useEffect } from "react";

export function usePreventUserActions() {
  // This hook is used to prevent user actions like right-click, keyboard shortcuts, etc.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.location.href.includes('localhost')) return;
    const preventDefaultAction = (e: Event) => {
      e.preventDefault();
      return false;
    };
    const preventKeyboardShortcuts = (e: KeyboardEvent) => {
      // Prevent Ctrl+Shift+I, F12, Ctrl+U, Ctrl+C on exercise panel
      if (
        (e.ctrlKey && e.shiftKey && e.key === 'I') ||
        e.key === 'F12' ||
        (e.ctrlKey && e.key === 'u') ||
        (e.ctrlKey && e.key === 's') ||
        (e.ctrlKey && e.key === 'c') ||
        (e.ctrlKey && e.key === 'a')
      ) {
        e.preventDefault();
        return false;
      }
    };
    // Prevent context menu (right-click)
    document.addEventListener('contextmenu', preventDefaultAction);
    // Prevent keyboard shortcuts
    document.addEventListener('keydown', preventKeyboardShortcuts);
    return () => {
      document.removeEventListener('contextmenu', preventDefaultAction);
      document.removeEventListener('keydown', preventKeyboardShortcuts);
    };
  }, []);
}