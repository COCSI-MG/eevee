"use client";

import type { KeyboardEvent } from "react";
import { Code2, Columns2, Monitor, PanelLeft, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export enum WorkspaceViewMode {
  Single = "single",
  Split = "split",
  Preview = "preview"
}

export enum WorkspaceMobilePane {
  Code = "code",
  Preview = "preview"
}

interface WorkspaceViewControlsProps {
  id: string;
  mode: WorkspaceViewMode;
  canPreview: boolean;
  explorerOpen: boolean;
  mobilePane: WorkspaceMobilePane;
  onModeChange: (mode: WorkspaceViewMode) => void;
  onExplorerToggle: () => void;
  onMobilePaneChange: (pane: WorkspaceMobilePane) => void;
  onCloseSecondary?: () => void;
}

const MODES = [
  { value: WorkspaceViewMode.Single, label: "Código", icon: Code2 },
  { value: WorkspaceViewMode.Split, label: "Duas páginas", icon: Columns2 },
  { value: WorkspaceViewMode.Preview, label: "Visualização", icon: Monitor },
] as const;

const MOBILE_PANES = [
  { value: WorkspaceMobilePane.Code, label: "Código", icon: Code2 },
  { value: WorkspaceMobilePane.Preview, label: "Resultado", icon: Monitor },
] as const;

export function WorkspaceViewControls({
  id,
  mode,
  canPreview,
  explorerOpen,
  mobilePane,
  onModeChange,
  onExplorerToggle,
  onMobilePaneChange,
  onCloseSecondary
} : WorkspaceViewControlsProps )
{

  const handleTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const total = MOBILE_PANES.length;

    const nextIndexEventKey: Record<string, number> = {
      Home: 0,
      End: total - 1,
      ArrowRight: (index + 1) % total,
      ArrowLeft: (index - 1 + total) % total,
    };

    const nextIndex = nextIndexEventKey[event.key];

    if (nextIndex === undefined) return;

    event.preventDefault();

    const tabs = event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="tab"]');

    tabs?.[nextIndex]?.focus();

    onMobilePaneChange(MOBILE_PANES[nextIndex].value);
  };

  return (
    <div className="shrink-0 border-b border-border/25 bg-background">
      <div className="flex h-12 min-w-0 items-center justify-between gap-2 px-3">

        <span className="hidden items-center gap-2 text-xs font-medium text-muted-foreground lg:inline-flex">
          <Code2 aria-hidden="true" className="h-4 w-4 text-primary" />
          Área de trabalho
        </span>

        <Button
          size="sm" variant="ghost" aria-expanded={explorerOpen}
          aria-controls={`${id}-explorer`} onClick={onExplorerToggle}
          className="h-8 px-2 text-muted-foreground hover:bg-card/60 hover:text-foreground lg:hidden"
        >
          <PanelLeft aria-hidden="true" />
          Arquivos
        </Button>

        <div className="flex min-w-0 items-center gap-2">

          {onCloseSecondary && (
            <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground" aria-label="Fechar página 2" title="Fechar página 2" onClick={onCloseSecondary}>
              <X aria-hidden="true" />
            </Button>
          )}

          <div role="group" aria-label="Layout do editor" className="inline-flex items-center gap-1 rounded-lg border border-border/20 bg-card/25 p-1">

            {MODES.filter((item) => item.value !== WorkspaceViewMode.Preview || canPreview).map(({ value, label, icon: Icon }) => (
              <Button
                key={value}
                size="sm"
                variant="ghost"
                aria-label={label}
                title={label}
                aria-pressed={mode === value}
                onClick={() => onModeChange(value)}
                className={cn(
                  "h-7 gap-1.5 px-2 text-muted-foreground hover:bg-card/70 hover:text-foreground sm:px-2.5",
                  mode === value && "bg-card text-foreground shadow-sm ring-1 ring-border/25",
                )}
              >
                <Icon aria-hidden="true" className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{label}</span>
              </Button>
            ))}

          </div>
        </div>
      </div>

      {mode === WorkspaceViewMode.Preview && (
        <div role="tablist" aria-label="Área do workspace" className="flex gap-1 border-t border-border/15 px-3 py-1.5 lg:hidden">
          {MOBILE_PANES.map(
            ({ value, label, icon: Icon }, index) => (

            <button
              key={value}
              id={`${id}-${value}-tab`}
              role="tab"
              aria-selected={mobilePane === value}
              aria-controls={`${id}-${value}-panel`}
              tabIndex={mobilePane === value ? 0 : -1}
              onClick={() => onMobilePaneChange(value)}
              onKeyDown={(event) => handleTabKeyDown(event, index)}
              className="inline-flex h-8 flex-1 items-center justify-center gap-2 rounded-md text-xs
              text-muted-foreground transition-colors hover:bg-card/40 focus-visible:outline-none
              focus-visible:ring-2 focus-visible:ring-ring aria-selected:bg-card aria-selected:font-medium aria-selected:text-foreground"
            >
              <Icon aria-hidden="true" className="h-3.5 w-3.5" />{label}
            </button>
          ))}
        </div>
      )}

    </div>
  );
}
