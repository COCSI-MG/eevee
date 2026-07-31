"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Code,
  Info,
  Play,
  Save,
  Loader2,
  SendHorizonal,
  RotateCcw,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../../../../components/ui/dialog";
import { Assignment } from "@/app/interface/scheduler-api/assignment";

interface WorkspaceHeaderProps {
  assignment: Pick<Assignment, "title" | "description">;
  onRunClick: () => void;
  onSubmitClick: () => void;
  onSaveClick: () => void;
  onClearClick: () => void | Promise<void>;
  isRunningSync?: boolean;
  isSubmittingCorrection?: boolean;
  isSaving?: boolean;
  isClearing?: boolean;
  canClear?: boolean;
}

const WorkspaceHeader: React.FC<WorkspaceHeaderProps> = ({
  assignment,
  onRunClick,
  onSubmitClick,
  onSaveClick,
  onClearClick,
  isRunningSync = false,
  isSubmittingCorrection = false,
  isSaving = false,
  isClearing = false,
  canClear = true,
}) => {
  const { back } = useRouter();
  const [isClearDialogOpen, setIsClearDialogOpen] = React.useState(false);
  const isActionDisabled =
    isSaving || isRunningSync || isSubmittingCorrection || isClearing;

  const handleClearClick = async () => {
    await Promise.resolve(onClearClick());
    setIsClearDialogOpen(false);
  };

  return (
    <header className="flex items-center justify-between p-3 border-b border-slate-700">
      <div className="flex items-center gap-4">
        <div
          className="flex items-center space-x-2 cursor-pointer"
          onClick={() => back()}
        >
          <Code className="h-5 w-5" />
          <span className="font-bold text-lg">EEVEE</span>
        </div>

        <Dialog>
          <DialogTrigger asChild>
            <button
              className="flex items-center gap-2 px-4 py-2 rounded-md bg-blue-600/20 border border-blue-500 hover:border-blue-400 hover:bg-blue-600/30 transition-all duration-200 group font-medium"
              title="Visualizar a pergunta/descrição completa da tarefa"
            >
              <Info className="h-5 w-5 text-blue-400 group-hover:text-blue-300 transition-colors" />
              <span className="text-sm text-blue-300 group-hover:text-blue-200 transition-colors">
                Ver Pergunta
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
          <AlertDialog
            open={isClearDialogOpen}
            onOpenChange={setIsClearDialogOpen}
          >
            <Button
              size={"sm"}
              variant={"outline"}
              onClick={() => setIsClearDialogOpen(true)}
              disabled={isActionDisabled || !canClear}
            >
              {isClearing ? (
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              ) : (
                <RotateCcw className="w-4 h-4 mr-1" />
              )}
              {isClearing ? "Limpando..." : "Limpar"}
            </Button>

            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Limpar workspace?</AlertDialogTitle>
                <AlertDialogDescription>
                  Você vai perder todo conteúdo do trabalho até aqui. O
                  workspace será recriado com o boilerplate inicial da
                  atividade.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isClearing}>
                  Cancelar
                </AlertDialogCancel>
                <Button
                  variant={"destructive"}
                  onClick={() => void handleClearClick()}
                  disabled={isClearing}
                >
                  {isClearing ? (
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  ) : (
                    <RotateCcw className="w-4 h-4 mr-1" />
                  )}
                  Confirmar limpeza
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

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
            {isRunningSync ? "Executando..." : "Executar"}
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
            {isSubmittingCorrection ? "Enviando..." : "Enviar para Correção"}
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
