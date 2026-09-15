"use client";

import * as React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { buttonVariants, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export interface ConfirmationAlertDialogMessage {
  content: React.ReactNode;
  emphasis?: boolean;
}

export interface ConfirmationAlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: React.ReactNode;
  messages: readonly ConfirmationAlertDialogMessage[];
  confirmLabel: string;
  pendingLabel: string;
  cancelLabel?: string;
  isPending?: boolean;
  onConfirm: () => void;
  actionVariant?: ButtonProps["variant"];
}

export default function ConfirmationAlertDialog({
  open,
  onOpenChange,
  title,
  messages,
  confirmLabel,
  pendingLabel,
  cancelLabel = "Cancelar",
  isPending = false,
  onConfirm,
  actionVariant = "default",
}: ConfirmationAlertDialogProps) {
  const handleOpenChange = (nextOpen: boolean) => {
    if (!isPending) onOpenChange(nextOpen)

  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>

          <AlertDialogTitle>{title}</AlertDialogTitle>

          <AlertDialogDescription className="space-y-2">
            {messages.map(({ content, emphasis }, index) => (
              <span
                key={index}
                className={cn("block", emphasis && "font-medium text-foreground")}
              >
                {content}
              </span>
            ))}
          </AlertDialogDescription>

        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>
            {cancelLabel}
          </AlertDialogCancel>

          <AlertDialogAction
            type="button"
            className={buttonVariants({ variant: actionVariant })}
            disabled={isPending}
            onClick={(event) => {
              event.preventDefault();
              onConfirm();
            }}
          >
            {isPending && (<Loader2 className="mr-1 h-4 w-4 animate-spin" aria-hidden />)}

            {isPending ? pendingLabel : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>

      </AlertDialogContent>
    </AlertDialog>
  );
}
