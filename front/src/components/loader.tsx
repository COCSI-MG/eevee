'use client';

import { Progress } from "@/components/ui/progress";
import { useEffect, useState } from "react";

interface LoaderProps {
  text?: string;
  fullScreen?: boolean;
}

export default function Loader({ text = "Carregando...", fullScreen = true }: LoaderProps) {
  const [progress, setProgress] = useState(13);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => (prev >= 90 ? 100 : prev + 10));
    }, 500);

    return () => clearInterval(timer);
  }, []);

  const containerClass = fullScreen 
    ? "flex flex-col items-center justify-center min-h-screen w-full gap-4 px-8"
    : "flex flex-col items-center justify-center w-full gap-4 py-8 px-8";

  return (
    <div className={containerClass}>
      <div className="w-full max-w-md space-y-2">
        <Progress value={progress} className="h-2" />
        <p className="text-sm text-muted-foreground text-center">{text}</p>
      </div>
    </div>
  );
}