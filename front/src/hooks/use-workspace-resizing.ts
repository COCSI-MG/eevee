import { useEffect, useRef, useState } from "react";

const useWorskpaceResizing = () => {
  const [explorerWidth, setExplorerWidth] = useState(224); // 56 * 4 = 224px
  const [consoleHeight, setConsoleHeight] = useState(128); // 32 * 4 = 128px

  const isResizingRef = useRef(false);
  const resizingElementRef = useRef<"explorer" | "exercise" | "console" | null>(
    null
  );
  const startPositionRef = useRef(0);
  const startSizeRef = useRef(0);

  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizingRef.current || !resizingElementRef.current) return;

    if (resizingElementRef.current === "explorer") {
      const newWidth =
        startSizeRef.current + (e.clientX - startPositionRef.current);
      if (newWidth >= 150 && newWidth <= 400) {
        setExplorerWidth(newWidth);
      }
    } else if (resizingElementRef.current === "console") {
      const newHeight =
        startSizeRef.current - (e.clientY - startPositionRef.current);
      if (newHeight >= 80 && newHeight <= 400) {
        setConsoleHeight(newHeight);
      }
    }
  };

  const handleMouseUp = () => {
    isResizingRef.current = false;
    resizingElementRef.current = null;
    document.body.style.cursor = "default";
    document.body.style.userSelect = "auto";
  };

  const startResize = (
    element: "explorer" | "exercise" | "console",
    e: React.MouseEvent
  ) => {
    isResizingRef.current = true;
    resizingElementRef.current = element;

    if (element === "explorer") {
      startPositionRef.current = e.clientX;
      startSizeRef.current = explorerWidth;
      document.body.style.cursor = "ew-resize";
    } else if (element === "console") {
      startPositionRef.current = e.clientY;
      startSizeRef.current = consoleHeight;
      document.body.style.cursor = "ns-resize";
    }

    document.body.style.userSelect = "none";
    e.preventDefault();
  };

  useEffect(() => {
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  return {
    explorerWidth,
    consoleHeight,
    startResize,
  };
};

export { useWorskpaceResizing };
