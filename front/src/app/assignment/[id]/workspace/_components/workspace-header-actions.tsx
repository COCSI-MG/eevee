"use client";

import { Button } from "@/components/ui/button";
import { Loader2, Play, RotateCcw, Save, SendHorizonal } from "lucide-react";
import React from "react";
import WorkspaceClearDialog from "./modals/workspace-clear-dialog";

interface WorkspaceHeaderActionsProps {
  onRunClick: () => void;
  onSubmitClick: () => void;
  onSaveClick: () => void;
  onClearClick: () => void | Promise<void>;
  isRunningSync?: boolean;
  isSubmittingCorrection?: boolean;
  isSaving?: boolean;
  isClearing?: boolean;
  canClear?: boolean;
  isSubmissionClosed?: boolean;
}

export default function WorkspaceHeaderActions({
  onRunClick,
  onSubmitClick,
  onSaveClick,
  onClearClick,
  isRunningSync = false,
  isSubmittingCorrection = false,
  isSaving = false,
  isClearing = false,
  canClear = true,
  isSubmissionClosed = false
}: WorkspaceHeaderActionsProps) {

  const [isClearDialogOpen, setIsClearDialogOpen] = React.useState(false);
  const isActionDisabled = isSaving || isRunningSync || isSubmittingCorrection || isClearing;

  return (
    <div className="flex items-center gap-2 ml-4">
      <Button
        size="sm"
        variant="outline"
        onClick={() => setIsClearDialogOpen(true)}
        disabled={isActionDisabled || !canClear}
      >
          {isClearing ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <RotateCcw className="w-4 h-4 mr-1" />}
          {isClearing ? "Limpando..." : "Limpar"}
      </Button>

      <WorkspaceClearDialog
        open={isClearDialogOpen}
        onOpenChange={setIsClearDialogOpen}
        onConfirm={onClearClick}
        isClearing={isClearing}
      />

      <Button
        size="sm"
        className="bg-success hover:bg-success/90 text-success-foreground"
        onClick={onRunClick}
        disabled={isActionDisabled}
      >
        {isRunningSync ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Play className="w-4 h-4 mr-1" />}
        {isRunningSync ? "Executando..." : "Executar"}
      </Button>

      <Button
        size="sm"
        className="bg-primary hover:bg-primary/90 text-primary-foreground"
        onClick={onSubmitClick}
        disabled={isActionDisabled || isSubmissionClosed}
      >
        {isSubmittingCorrection ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <SendHorizonal className="w-4 h-4 mr-1" />}
        {isSubmittingCorrection ? "Enviando..." : isSubmissionClosed ? "Prazo encerrado" : "Enviar para Correção"}
      </Button>

      <Button
        size="sm"
        variant="outline"
        onClick={onSaveClick}
        disabled={isActionDisabled}
      >
        {isSaving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
        {isSaving ? "Salvando..." : "Salvar"}
      </Button>
    </div>
  );
}
