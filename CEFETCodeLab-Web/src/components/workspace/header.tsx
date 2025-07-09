"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Code, Info } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";

interface WorkspaceHeaderProps {
  assignmentDescription?: string;
}

const WorkspaceHeader: React.FC<WorkspaceHeaderProps> = ({
  assignmentDescription,
}) => {
  const { back } = useRouter();

  return (
    <header className="flex items-center justify-between p-3 border-b border-slate-700">
      <div className="flex items-center gap-2">
        <Code className="h-5 w-5" />
        <span className="font-bold text-lg">EEVEE</span>

        <Dialog>
          <DialogTrigger asChild>
            <Info className="ml-4 h-4 w-4 text-slate-400 cursor-pointer" />
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold">
                Descrição da Atividade
              </DialogTitle>
            </DialogHeader>
            <div className="p-4 text-sm text-slate-300">
              {assignmentDescription || "Nenhuma descrição fornecida."}
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => back()}>
          Assigments
        </Button>
        <Button variant="ghost" size="sm">
          Ajuda
        </Button>
      </div>
    </header>
  );
};

export default WorkspaceHeader;
