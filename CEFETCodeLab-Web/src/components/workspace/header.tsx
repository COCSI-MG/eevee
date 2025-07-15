"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Code, Info, Play, Save } from "lucide-react";
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
  onSaveClick: () => void;
}

const WorkspaceHeader: React.FC<WorkspaceHeaderProps> = ({
  assignment,
  onRunClick,
  onSaveClick,
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
                {assignment?.title}
              </DialogTitle>
            </DialogHeader>
            <div className="p-4 text-sm text-slate-300">
              {assignment?.description || "Nenhuma descrição fornecida."}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => back()}>
          Assigments
        </Button>
        <Button variant="ghost" size="sm">
          Ajuda
        </Button>

        <div className="flex items-center gap-2 ml-4">
          <Button
            size={"sm"}
            className="bg-green-600 hover:bg-green-700 text-white"
            onClick={onRunClick}
          >
            <Play className="w-4 h-4 mr-1" />
            Run
          </Button>

          <Button size={"sm"} variant={"outline"} onClick={onSaveClick}>
            <Save className="w-4 h-4 mr-1" />
            Save
          </Button>
        </div>
      </div>
    </header>
  );
};

export default WorkspaceHeader;
