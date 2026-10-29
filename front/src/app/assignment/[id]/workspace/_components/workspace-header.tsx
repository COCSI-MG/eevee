"use client";

import React from "react";
import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Code, Info } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../../../../components/ui/dialog";
import { Assignment } from "@/app/interface/scheduler-api/assignment";
import { MarkdownContent } from "@/components/shared/markdown-content";
import { formatDateTime } from "@/utils/date";

interface WorkspaceHeaderProps {
  assignment: Pick<Assignment, "title" | "description" | "startDate" | "dueDate">;
  actions: ReactNode;
}

const WorkspaceHeader: React.FC<WorkspaceHeaderProps> = ({
  assignment,
  actions
}) => {
  const { back } = useRouter();

  return (
    <header className="flex shrink-0 flex-wrap items-center justify-between gap-2 p-3 border-b border-border">
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
              className="flex items-center gap-2 px-4 py-2 rounded-md bg-primary/20 border border-primary hover:border-primary hover:bg-primary/20 transition-all duration-200 group font-medium"
              title="Visualizar a pergunta/descrição completa da tarefa"
            >
              <Info className="h-5 w-5 text-primary group-hover:text-primary transition-colors" />
              <span className="text-sm text-primary group-hover:text-primary transition-colors">
                Ver Pergunta
              </span>
            </button>
          </DialogTrigger>
          <DialogContent className="flex max-h-[90dvh] w-[calc(100%-2rem)] max-w-6xl flex-col overflow-hidden">
            <DialogHeader className="shrink-0">
              <DialogTitle className="text-2xl font-semibold text-foreground">
                {assignment?.title}
              </DialogTitle>
            </DialogHeader>
            <div className="min-h-0 min-w-0 overflow-y-auto rounded-lg border border-border bg-card/50 p-4 sm:p-6">
              <MarkdownContent
                className="text-base"
                content={assignment?.description || "Nenhuma descrição fornecida."}
              />
              {(assignment.startDate || assignment.dueDate) && (
                <div className="mt-4 space-y-1 text-sm text-slate-400">
                  {assignment.startDate && (
                    <p>Início: {formatDateTime(assignment.startDate)}</p>
                  )}
                  {assignment.dueDate && (
                    <p>Entrega: {formatDateTime(assignment.dueDate)}</p>
                  )}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:gap-0">
        <Button variant="ghost" size="sm" onClick={() => back()}>
          Voltar
        </Button>

        {actions}
      </div>
    </header>
  );
};

export default WorkspaceHeader;
