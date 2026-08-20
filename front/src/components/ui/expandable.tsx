"use client";

import * as React from "react";
import { Maximize2, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type UseExpandableReturn = {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  open: () => void;
  close: () => void;
};

function useExpandable(): UseExpandableReturn {
  const [isOpen, setIsOpen] = React.useState(false);
  return {
    isOpen,
    setIsOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
  };
}

interface ExpandableTriggerProps {
  onClick: () => void;
  label: string;
  className?: string;
}

function ExpandableTrigger({
  onClick,
  label,
  className,
}: ExpandableTriggerProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={onClick}
      aria-label={label}
      className={cn(
        "text-slate-200 hover:bg-slate-700 hover:text-white",
        className,
      )}
    >
      <Maximize2 className="h-4 w-4 mr-2" />
      <span className="hidden sm:inline">{label}</span>
    </Button>
  );
}

interface ExpandableDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: React.ReactNode;
  minimizeLabel: string;
  contentClassName?: string;
  children: React.ReactNode;
}

function ExpandableDialog({
  open,
  onOpenChange,
  title,
  minimizeLabel,
  contentClassName,
  children,
}: ExpandableDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-800 border-slate-700 w-screen h-screen max-w-none max-h-none rounded-none p-0 flex flex-col gap-0 sm:rounded-none">
        <DialogHeader className="flex flex-row items-center justify-between px-4 py-3 border-b border-slate-700 space-y-0">
          <DialogTitle className="text-white">{title}</DialogTitle>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            aria-label={minimizeLabel}
            className="text-slate-200 hover:bg-slate-700 hover:text-white"
          >
            <Minimize2 className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">{minimizeLabel}</span>
          </Button>
        </DialogHeader>
        <div className={cn("flex-1 min-h-0 p-2 sm:p-4", contentClassName)}>
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export { useExpandable, ExpandableTrigger, ExpandableDialog };
