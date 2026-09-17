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
    <header className="flex items-center justify-between p-3 border-b border-border">
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
          <DialogContent className="max-w-3xl max-h-[70vh]">
            <DialogHeader>
              <DialogTitle className="text-2xl font-semibold text-foreground">
                {assignment?.title}
              </DialogTitle>
            </DialogHeader>
            <div className="mt-6 space-y-4">
              <div className="p-6 bg-card/50 rounded-lg border border-border max-h-96 overflow-y-auto">
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
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center">
        <Button variant="ghost" size="sm" onClick={() => back()}>
          Voltar
        </Button>

        {actions}
      </div>
    </header>
  );
};

export default WorkspaceHeader;
