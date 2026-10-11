import { useEffect } from "react";
import { SecurityViolationReason } from "./types";

interface UseDevToolsGuardOptions {
  enabled: boolean;
  onDetected: (reason: SecurityViolationReason) => void;
}

const DEVTOOLS_CHECK_INTERVAL_MS = 1000;
const DEVTOOLS_DELAY_THRESHOLD_MS = 100;
const DEVTOOLS_VIEWPORT_WIDTH_THRESHOLD_PX = 160;
const DEVTOOLS_VIEWPORT_HEIGHT_THRESHOLD_PX = 320;
const DEVTOOLS_PERFORMANCE_RATIO_THRESHOLD = 10;
const NOISY_DETECTION_CONFIRMATION_COUNT = 3;
const consoleLog = console.log.bind(console);
const consoleTable = console.table?.bind(console);
const consoleClear = console.clear.bind(console);
let largeObjectArray: Record<string, string>[] | null = null;
let maxConsoleLogTime = 0;
let consolePerformanceSamples = 0;

function isFirefox() {
  return /firefox/i.test(navigator.userAgent);
}

function isChromiumBased() {
  return /chrome|chromium|crios|edg/i.test(navigator.userAgent);
}

function getLargeObjectArray() {
  if (largeObjectArray) {
    return largeObjectArray;
  }

  const largeObject: Record<string, string> = {};

  for (let index = 0; index < 500; index += 1) {
    largeObject[String(index)] = String(index);
  }

  largeObjectArray = Array.from({ length: 50 }, () => largeObject);

  return largeObjectArray;
}

function getDevToolsViewportReason(): SecurityViolationReason | null {
  const widthDiff = window.outerWidth - window.innerWidth;
  const heightDiff = window.outerHeight - window.innerHeight;

  if (
    window.outerWidth > 0 &&
    window.outerHeight > 0 &&
    (widthDiff > DEVTOOLS_VIEWPORT_WIDTH_THRESHOLD_PX ||
      heightDiff > DEVTOOLS_VIEWPORT_HEIGHT_THRESHOLD_PX)
  ) {
    return "devtools_viewport";
  }

  return null;
}

function getDevToolsDebuggerReason(): SecurityViolationReason | null {
  const start = performance.now();
  eval("debugger");
  const elapsed = performance.now() - start;

  if (elapsed > DEVTOOLS_DELAY_THRESHOLD_MS) {
    return "devtools_debugger";
  }

  return null;
}

function getDevToolsConsoleReason(
  onInspected: (reason: SecurityViolationReason) => void,
): SecurityViolationReason | null {
  let wasInspected = false;
  const element = document.createElement("div");

  const markAsInspected = () => {
    wasInspected = true;
    onInspected("devtools_console");
  };

  Object.defineProperty(element, "id", {
    get() {
      markAsInspected();
      return "devtools-console-probe";
    },
    configurable: true,
  });

  consoleLog(element);
  consoleClear();

  return wasInspected ? "devtools_console" : null;
}

function getConsolePrintTime(print: (value: unknown) => void) {
  const start = performance.now();

  print(getLargeObjectArray());

  return performance.now() - start;
}

function getDevToolsPerformanceReason(): SecurityViolationReason | null {
  if (!consoleTable || (!isFirefox() && !isChromiumBased())) {
    return null;
  }

  const tablePrintTime = getConsolePrintTime(consoleTable);
  const logPrintTime = Math.max(
    getConsolePrintTime(consoleLog),
    getConsolePrintTime(consoleLog),
  );

  maxConsoleLogTime = Math.max(maxConsoleLogTime, logPrintTime);
  consolePerformanceSamples += 1;
  consoleClear();

  if (
    tablePrintTime === 0 ||
    maxConsoleLogTime === 0 ||
    consolePerformanceSamples < NOISY_DETECTION_CONFIRMATION_COUNT
  ) {
    return null;
  }

  return tablePrintTime >
    maxConsoleLogTime * DEVTOOLS_PERFORMANCE_RATIO_THRESHOLD
    ? "devtools_performance"
    : null;
}

function requiresConsecutiveConfirmation(reason: SecurityViolationReason) {
  return (
    reason === "devtools_console" ||
    reason === "devtools_performance" ||
    reason === "devtools_viewport"
  );
}

export function useDevToolsGuard({
  enabled,
  onDetected,
}: UseDevToolsGuardOptions) {
  useEffect(() => {
    if (!enabled) {
      return;
    }

    let devToolsEpisodeActive = false;
    let clearDetectionCount = 0;
    let isDetectingDevTools = false;
    const detectionCounts = new Map<SecurityViolationReason, number>();

    const reportDevToolsDetected = (reason: SecurityViolationReason) => {
      if (devToolsEpisodeActive) {
        return;
      }

      devToolsEpisodeActive = true;
      clearDetectionCount = 0;
      onDetected(reason);
    };

    const reportConfirmedDevToolsDetected = (
      reason: SecurityViolationReason,
    ) => {
      if (!requiresConsecutiveConfirmation(reason)) {
        reportDevToolsDetected(reason);
        return;
      }

      const nextCount = (detectionCounts.get(reason) ?? 0) + 1;
      detectionCounts.set(reason, nextCount);

      if (nextCount >= NOISY_DETECTION_CONFIRMATION_COUNT) {
        reportDevToolsDetected(reason);
      }
    };

    const detectDevTools = async () => {
      if (isDetectingDevTools) {
        return;
      }

      isDetectingDevTools = true;

      try {
        const reason =
          getDevToolsViewportReason() ??
          getDevToolsConsoleReason(reportConfirmedDevToolsDetected) ??
          getDevToolsPerformanceReason() ??
          getDevToolsDebuggerReason();

        if (reason) {
          clearDetectionCount = 0;
          reportConfirmedDevToolsDetected(reason);
        } else {
          detectionCounts.clear();
          clearDetectionCount += 1;
          if (clearDetectionCount >= 2) {
            devToolsEpisodeActive = false;
          }
        }
      } finally {
        isDetectingDevTools = false;
      }
    };

    const detectDevToolsOnResume = () => {
      if (document.visibilityState === "hidden") {
        return;
      }

      detectDevTools();
    };

    detectDevTools();

    const devToolsCheckInterval = setInterval(
      detectDevTools,
      DEVTOOLS_CHECK_INTERVAL_MS,
    );

    window.addEventListener("focus", detectDevToolsOnResume, true);
    window.addEventListener("resize", detectDevTools, true);
    document.addEventListener("visibilitychange", detectDevToolsOnResume, true);

    return () => {
      clearInterval(devToolsCheckInterval);
      window.removeEventListener("focus", detectDevToolsOnResume, true);
      window.removeEventListener("resize", detectDevTools, true);
      document.removeEventListener(
        "visibilitychange",
        detectDevToolsOnResume,
        true,
      );
    };
  }, [enabled, onDetected]);
}
