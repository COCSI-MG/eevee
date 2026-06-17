"use client";

import React from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WorkspaceQuestionPanelProps {
  title: string;
  description: string;
}

export default function WorkspaceQuestionPanel({
  title,
  description,
}: WorkspaceQuestionPanelProps) {
  const [isExpanded, setIsExpanded] = React.useState(true);

  return (
    <div className="border-b border-slate-700 bg-slate-900/50">
      <div className="flex items-center justify-between p-3 hover:bg-slate-800/50 transition-colors">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 hover:bg-slate-700"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-slate-200 truncate">
              Pergunta
            </h3>
            <p className="text-xs text-slate-400 truncate">{title}</p>
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-slate-700 px-3 py-3 max-h-48 overflow-y-auto bg-slate-900/30">
          <div className="space-y-3">
            <div>
              <h4 className="text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wide">
                {title}
              </h4>
              <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                {description || "Nenhuma descrição fornecida."}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
