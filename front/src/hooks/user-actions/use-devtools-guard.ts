import { useEffect } from "react";

interface UseDevToolsGuardOptions {
  onDetected: () => void;
}

const DEVTOOLS_CHECK_INTERVAL_MS = 5000;
const DEVTOOLS_DELAY_THRESHOLD_MS = 100;

export function useDevToolsGuard({ onDetected }: UseDevToolsGuardOptions) {
  useEffect(() => {
    const detectDevTools = () => {
      const t0 = Date.now();
      eval("debugger"); // This will trigger the devtools to open
      const t1 = Date.now();

      console.log(`Devtools opened in ${t1 - t0}ms`);

      if (t1 - t0 > DEVTOOLS_DELAY_THRESHOLD_MS) {
        console.warn("Devtools detected!");
        onDetected();
      }
    };

    const devToolsCheckInterval = setInterval(
      detectDevTools,
      DEVTOOLS_CHECK_INTERVAL_MS,
    );

    return () => {
      clearInterval(devToolsCheckInterval);
    };
  }, [onDetected]);
}
