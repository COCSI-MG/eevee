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
  retryLabel = "Tentar novamente",
  isRetrying = false,
  className,
}: QueryErrorStateProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-destructive bg-destructive/10 p-6",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 h-5 w-5 text-destructive" />
        <div className="space-y-3">
          <div className="space-y-1">
            <h3 className="font-medium text-destructive">{title}</h3>
            <p className="text-sm text-destructive">{description}</p>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={onRetry}
            disabled={isRetrying}
            className="border-destructive text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            {isRetrying ? <Loader2Icon className="mr-2 h-4 w-4 animate-spin" /> : null}
            {retryLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
