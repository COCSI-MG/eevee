"use client";

import React from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MarkdownContent } from "@/components/shared/markdown-content";

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
    <div className="border-b border-border bg-background/50">
      <div className="flex items-center justify-between p-3 hover:bg-card/50 transition-colors">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 hover:bg-primary/20"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-foreground truncate">
              Pergunta
            </h3>
            <p className="text-xs text-muted-foreground truncate">{title}</p>
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-border px-3 py-3 max-h-48 overflow-y-auto bg-background/30">
          <div className="space-y-3">
            <div>
              <h4 className="text-xs font-semibold text-foreground mb-2 uppercase tracking-wide">
                {title}
              </h4>
              <MarkdownContent
                content={description || "Nenhuma descrição fornecida."}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
