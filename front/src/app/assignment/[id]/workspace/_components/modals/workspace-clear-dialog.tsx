"use client";

import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { Loader2, RotateCcw } from "lucide-react";
import React from "react";

interface WorkspaceClearDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void | Promise<void>;
  isClearing: boolean;
}

export default function WorkspaceClearDialog({
  open,
  onOpenChange,
  onConfirm,
  isClearing
}: WorkspaceClearDialogProps) {
  const handleConfirm = async () => {
    await Promise.resolve(onConfirm());
    onOpenChange(false);
  };

  const ConfirmIcon = isClearing ? Loader2 : RotateCcw;
  const confirmIconeClass = isClearing ? "animate-spin" : ""
  const confirmLabel = isClearing ? "Limpando..." : "Confirmar limpeza";

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>

        <AlertDialogHeader>
          <AlertDialogTitle>Limpar workspace?</AlertDialogTitle>

          <AlertDialogDescription>
            Você vai perder todo conteúdo do trabalho até aqui. O workspace será recriado com o boilerplate inicial da atividade.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isClearing}>Cancelar</AlertDialogCancel>

          <Button variant="destructive" onClick={() => void handleConfirm()} disabled={isClearing}>
            <ConfirmIcon
              className={`mr-1 size-4 ${confirmIconeClass}`}
            />

            {confirmLabel}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
