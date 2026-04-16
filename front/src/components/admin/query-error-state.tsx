"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AlertCircle, Loader2Icon } from "lucide-react";

interface QueryErrorStateProps {
  title: string;
  description: string;
  onRetry: () => void;
  retryLabel?: string;
  isRetrying?: boolean;
  className?: string;
}

export default function QueryErrorState({
  title,
  description,
  onRetry,
  retryLabel = "Try again",
  isRetrying = false,
  className,
}: QueryErrorStateProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-red-800 bg-red-950/20 p-6",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 h-5 w-5 text-red-300" />
        <div className="space-y-3">
          <div className="space-y-1">
            <h3 className="font-medium text-red-100">{title}</h3>
            <p className="text-sm text-red-200/80">{description}</p>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={onRetry}
            disabled={isRetrying}
            className="border-red-800 text-red-100 hover:bg-red-900/30 hover:text-red-50"
          >
            {isRetrying ? <Loader2Icon className="mr-2 h-4 w-4 animate-spin" /> : null}
            {retryLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
