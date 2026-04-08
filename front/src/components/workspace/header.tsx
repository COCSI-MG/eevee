"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import {
  Code,
  Info,
  Play,
  Save,
  Loader2,
  SendHorizonal,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Assignment } from "@/app/interface/scheduler-api/assignment";

interface WorkspaceHeaderProps {
  assignment: Pick<Assignment, "title" | "description">;
  onRunClick: () => void;
  onSubmitClick: () => void;
  onSaveClick: () => void;
  isRunningSync?: boolean;
  isSubmittingCorrection?: boolean;
  isSaving?: boolean;
}

const WorkspaceHeader: React.FC<WorkspaceHeaderProps> = ({
  assignment,
  onRunClick,
  onSubmitClick,
  onSaveClick,
  isRunningSync = false,
  isSubmittingCorrection = false,
  isSaving = false,
}) => {
  const { back } = useRouter();
  const isActionDisabled = isSaving || isRunningSync || isSubmittingCorrection;

  return (
    <header className="flex items-center justify-between p-3 border-b border-slate-700">
      <div className="flex items-center gap-2">
        <div className="flex items-center space-x-2 cursor-pointer" onClick={() => back()}>
          <Code className="h-5 w-5" />
          <span className="font-bold text-lg">EEVEE</span>
        </div>

        <Dialog>
          <DialogTrigger asChild>
            <Info className="ml-4 h-4 w-4 text-slate-400 cursor-pointer" />
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold">
                {assignment?.title}
              </DialogTitle>
            </DialogHeader>
            <div className="p-4 text-sm text-slate-300">
              {assignment?.description || "Nenhuma descrição fornecida."}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center">
        <Button variant="ghost" size="sm" onClick={() => back()}>
          Voltar 
        </Button>
        <Button variant="ghost" size="sm">
          Ajuda
        </Button>

        <div className="flex items-center gap-2 ml-4">
          <Button
            size={"sm"}
            className="bg-green-600 hover:bg-green-700 text-white"
            onClick={onRunClick}
            disabled={isActionDisabled}
          >
            {isRunningSync ? (
              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
            ) : (
              <Play className="w-4 h-4 mr-1" />
            )}
            {isRunningSync ? "Running..." : "Run"}
          </Button>

          <Button
            size={"sm"}
            className="bg-blue-600 hover:bg-blue-700 text-white"
            onClick={onSubmitClick}
            disabled={isActionDisabled}
          >
            {isSubmittingCorrection ? (
              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
            ) : (
              <SendHorizonal className="w-4 h-4 mr-1" />
            )}
            {isSubmittingCorrection
              ? "Enviando..."
              : "Enviar para Correção"}
          </Button>

          <Button
            size={"sm"}
            variant={"outline"}
            onClick={onSaveClick}
            disabled={isSaving || isRunningSync || isSubmittingCorrection}
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-1" />
            )}
            {isSaving ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </div>
    </header>
  );
};

export default WorkspaceHeader;
