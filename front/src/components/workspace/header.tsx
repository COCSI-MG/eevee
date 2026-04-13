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
      <div className="flex items-center gap-4">
        <div className="flex items-center space-x-2 cursor-pointer" onClick={() => back()}>
          <Code className="h-5 w-5" />
          <span className="font-bold text-lg">EEVEE</span>
        </div>

        <Dialog>
          <DialogTrigger asChild>
            <button
              className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-slate-600 hover:border-slate-400 hover:bg-slate-700/50 transition-all duration-200 group"
              title="Visualizar descrição completa da tarefa"
            >
              <Info className="h-4 w-4 text-slate-400 group-hover:text-slate-200 transition-colors" />
              <span className="text-xs font-medium text-slate-400 group-hover:text-slate-200 transition-colors">
                Ver Descrição
              </span>
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[70vh]">
            <DialogHeader>
              <DialogTitle className="text-2xl font-semibold text-slate-100">
                {assignment?.title}
              </DialogTitle>
            </DialogHeader>
            <div className="mt-6 space-y-4">
              <div className="p-6 bg-slate-800/50 rounded-lg border border-slate-700 max-h-96 overflow-y-auto">
                <p className="text-slate-200 leading-relaxed whitespace-pre-wrap text-base space-y-3">
                  {assignment?.description || "Nenhuma descrição fornecida."}
                </p>
              </div>
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
